/**
 * Os clientes novos: denúncia e painel.
 *
 * O que estes testes guardam é o que o cruzamento com a API **não** vê. Existe
 * um teste do lado do Python (`test_front_chama_rota_que_existe.py`) que
 * confere se todo caminho chamado aqui é uma rota de verdade; ele pega endereço
 * errado e não pega mais nada. Fica de fora:
 *
 * - **O formato do corpo.** A API fala `alvoTipo`/`alvoId` em camelCase, e o
 *   Python recebe em snake_case por alias. Mandar `alvo_tipo` daqui daria 422
 *   com a rota certa — verde nos dois lados, quebrado na tela.
 * - **O mapeamento do erro.** O 404 de `/admin/metricas` não é "sumiu": é a API
 *   dizendo que esta conta não é admin, sem confirmar que a área existe. A tela
 *   depende dessa tradução.
 *
 * Roda com `pnpm test`, sem runner instalado: o `fetch` é substituído e o
 * cliente de verdade entra no teste.
 */

import assert from "node:assert/strict";
import test from "node:test";

interface Pedido {
  url: string;
  metodo: string;
  corpo: unknown;
}

/** Instala um `fetch` de mentira e devolve o que ele recebeu. */
function espiar(resposta: { status?: number; corpo?: unknown } = {}): Pedido[] {
  const pedidos: Pedido[] = [];
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    pedidos.push({
      url: String(url),
      metodo: init?.method ?? "GET",
      corpo: init?.body ? JSON.parse(String(init.body)) : undefined,
    });
    const status = resposta.status ?? 200;
    return new Response(status === 204 ? null : JSON.stringify(resposta.corpo ?? {}), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
  return pedidos;
}

test("denunciar manda os campos com o nome que a API espera", async () => {
  const pedidos = espiar({ status: 201, corpo: { id: "d1" } });
  const { denunciar } = await import("./denuncia.ts?cenario=1");

  await denunciar("perfil", "Terreiro do Cruzeiro", "ofensivo");

  assert.equal(pedidos.length, 1);
  assert.equal(pedidos[0].metodo, "POST");
  assert.equal(pedidos[0].url, "/api/v1/denuncias");
  assert.deepEqual(pedidos[0].corpo, {
    // camelCase: é assim que o Python recebe, por alias. Em snake_case daria
    // 422 com a rota certa — o tipo de erro que passa nos dois lados.
    alvoTipo: "perfil",
    alvoId: "Terreiro do Cruzeiro",
    motivo: "ofensivo",
    detalhe: null,
  });
});

test("denunciar um perfil manda o APELIDO, não um id", async () => {
  // O perfil público não devolve o id da conta, e não vai passar a devolver só
  // para caber um botão. Quem resolve apelido -> conta é o servidor.
  const pedidos = espiar({ status: 201, corpo: { id: "d2" } });
  const { denunciar } = await import("./denuncia.ts?cenario=2");

  await denunciar("perfil", "Casa de Ogum", "outro", "  explicando  ");

  const corpo = pedidos[0].corpo as { alvoId: string; detalhe: string };
  assert.equal(corpo.alvoId, "Casa de Ogum");
  assert.equal(corpo.detalhe, "  explicando  ", "o detalhe foi mexido no caminho");
});

test("acolher e recusar mandam a decisão no corpo", async () => {
  const pedidos = espiar({ status: 200, corpo: {} });
  const { acolher, recusarDenuncia } = await import("./denuncia.ts?cenario=3");

  await acolher("d9", "gira_despublicada", "não é ponto");
  await recusarDenuncia("d9");

  assert.equal(pedidos[0].url, "/api/v1/admin/denuncias/d9/acolher");
  assert.deepEqual(pedidos[0].corpo, { acao: "gira_despublicada", nota: "não é ponto" });
  assert.equal(pedidos[1].url, "/api/v1/admin/denuncias/d9/recusar");
  assert.deepEqual(pedidos[1].corpo, { nota: null });
});

test("o 404 do painel vira a frase que a tela mostra", async () => {
  // 404 aqui não é "sumiu": é a API dizendo que esta conta não é admin, sem
  // confirmar que a área existe. Mostrar "servidor respondeu 404" mandaria a
  // pessoa procurar defeito onde não há.
  espiar({ status: 404, corpo: { detail: "Rota não encontrada" } });
  const { verMetricas } = await import("./painel.ts?cenario=4");

  await assert.rejects(
    () => verMetricas(),
    (erro: Error & { status?: number }) => {
      assert.match(erro.message, /modera o acervo/);
      assert.equal(erro.status, 404, "o status precisa viajar junto do erro");
      return true;
    },
  );
});

test("o painel devolve os grupos que a tela desenha", async () => {
  espiar({
    status: 200,
    corpo: {
      grupos: [
        {
          chave: "contas",
          titulo: "Quem se cadastrou",
          numeros: [{ chave: "contas", rotulo: "Contas", valor: 3, ressalva: "" }],
        },
      ],
    },
  });
  const { verMetricas } = await import("./painel.ts?cenario=5");

  const grupos = await verMetricas();

  assert.equal(grupos.length, 1, "desembrulhou errado: a resposta vem em { grupos }");
  assert.equal(grupos[0].numeros[0].valor, 3);
});

test("erro de denúncia carrega o status, para a tela distinguir 409 de 429", async () => {
  // 409 é "você já denunciou isso"; 429 é o teto de pendentes. As duas viram
  // mensagens diferentes na tela, e sem o status ela não tem como escolher.
  espiar({ status: 409, corpo: { detail: "Você já denunciou isso. Estamos olhando." } });
  const { denunciar } = await import("./denuncia.ts?cenario=6");

  await assert.rejects(
    () => denunciar("gira", "g1", "ofensivo"),
    (erro: Error & { status?: number }) => {
      assert.equal(erro.status, 409);
      assert.match(erro.message, /já denunciou/);
      return true;
    },
  );
});
