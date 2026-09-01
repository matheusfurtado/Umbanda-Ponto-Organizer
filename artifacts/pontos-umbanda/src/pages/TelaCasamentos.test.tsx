/**
 * Conferir casamento — o que a tela precisa ter junto para ninguém errar.
 *
 * Errar aqui é pôr o ponto de uma entidade no vídeo de outra. As três coisas
 * que decidem — o LUGAR do ponto, o começo da letra e o vídeo — ficam na mesma
 * linha de propósito.
 */

import { deepEqual, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaCasamentos } from "@/pages/TelaCasamentos";

beforeEach(() => localStorage.clear());

const caso = (over: Record<string, unknown> = {}) => ({
  id: 1, pontoId: "p1", titulo: "Se queres luz, oxalá quem dá...",
  letra: "Se queres luz, oxalá quem dá\nSe queres paz...",
  orixa: "Oxalá", subcategoria: "Louvação",
  artistaId: null, artistaNome: null,
  videoId: "abc", url: "https://youtu.be/abc",
  videoTitulo: "Ponto de Pomba Gira", canal: "Canal X",
  confianca: 0.55, principal: true, ...over,
});

async function abrir(
  fila: { status?: number; corpo?: unknown } = { corpo: [caso()] },
  quantos: unknown = { total: 390, principais: 156 },
) {
  const acoes: string[] = [];
  // O item DECIDIDO some da fila — é o que o servidor faz, porque decidir tira
  // a linha do `revisar`. O falso não fazia isso, e passou a importar quando a
  // tela ganhou busca automática ao esvaziar: ela pedia mais, recebia de volta
  // o que acabara de ser confirmado, e o teste acusava a tela de não ter
  // removido nada.
  const decididos = new Set<string>();
  const rede = fingirRede((url, init) => {
    const decisao = /\/casamentos\/([^/]+)\/(confirmar|recusar)$/.exec(url);
    if (decisao) {
      acoes.push(`${init?.method} ${url}`);
      decididos.add(decisao[1]);
      return { status: 204 };
    }
    if (url.includes("/casamentos/quantos")) return { corpo: quantos };
    if (url.includes("/admin/casamentos")) {
      if (!Array.isArray(fila.corpo)) return fila;
      return {
        ...fila,
        corpo: (fila.corpo as { id: number }[]).filter(
          (c) => !decididos.has(String(c.id)),
        ),
      };
    }
    throw new Error(`chamada não prevista: ${url}`);
  });
  const tela = await renderizar(<TelaCasamentos />);
  await assentar();
  return { tela, acoes, limpar: async () => { await tela.desmontar(); rede.restaurar(); } };
}

const botao = (tela: Tela, texto: RegExp) =>
  tela.todos("button").find((b) => texto.test(b.textContent ?? ""));

test("o LUGAR do ponto aparece em destaque — é o erro mais grave", async () => {
  // Ponto de Oxalá casado com vídeo de Pomba Gira é o erro mais comum, e só se
  // vê comparando o topo do ponto com o título do vídeo.
  const { tela, limpar } = await abrir();
  try {
    match(tela.texto(), /Oxalá · Louvação/);
    match(tela.texto(), /Ponto de Pomba Gira/);
  } finally {
    await limpar();
  }
});

test("letra, vídeo e link ficam na mesma linha da fila", async () => {
  const { tela, limpar } = await abrir();
  try {
    match(tela.texto(), /Se queres luz/);
    match(tela.texto(), /Canal X/);
    match(tela.texto(), /confiança 0\.55/);
    ok(tela.achar('a[href="https://youtu.be/abc"]'), "sem caminho para abrir o vídeo");
  } finally {
    await limpar();
  }
});

test("a tela avisa quando recusar deixa o ponto SEM link", async () => {
  // É o custo da decisão, e precisa estar visível antes do clique.
  const { tela, limpar } = await abrir({ corpo: [caso({ principal: true })] });
  try {
    // No ITEM, e não no texto da tela: o contador lá em cima também fala em
    // "sem link", e a asserção larga passava dos dois jeitos.
    match(tela.exigir("li").textContent ?? "", /deixa este ponto sem\s*link/i);
  } finally {
    await limpar();
  }
});

test("gravação de artista NÃO avisa isso — recusar não tira link de ninguém", async () => {
  const { tela, limpar } = await abrir({
    corpo: [caso({ principal: false, artistaNome: "Juliana D Passos" })],
  });
  try {
    ok(
      !/deixa este ponto sem/i.test(tela.exigir("li").textContent ?? ""),
      "avisou custo que não existe",
    );
    match(tela.texto(), /artista: Juliana D Passos/);
  } finally {
    await limpar();
  }
});

test("o contador separa o que custa link do acervo", async () => {
  const { tela, limpar } = await abrir();
  try {
    match(tela.texto(), /390/);
    match(tela.texto(), /156/);
    match(tela.texto(), /sem link enquanto esperam/);
  } finally {
    await limpar();
  }
});

test("decidir tira da lista na hora, sem recarregar tudo", async () => {
  // A fila tem centenas: recarregar a cada decisão faria a pessoa esperar por
  // decisão, e conferir 390 assim ninguém faz.
  const { tela, acoes, limpar } = await abrir();
  try {
    await tela.clicar(botao(tela, /É este ponto/)!);
    await assentar();
    deepEqual(acoes, ["POST /api/v1/admin/casamentos/1/confirmar"]);
    ok(!/Se queres luz/.test(tela.texto()), "o caso decidido continuou na tela");
    match(tela.texto(), /Nada para conferir/);
  } finally {
    await limpar();
  }
});

test("recusar chama a rota de recusar, e não a de confirmar", async () => {
  const { tela, acoes, limpar } = await abrir();
  try {
    await tela.clicar(botao(tela, /Não é/)!);
    await assentar();
    deepEqual(acoes, ["POST /api/v1/admin/casamentos/1/recusar"]);
  } finally {
    await limpar();
  }
});

test("fila vazia diz isso, e não fica carregando", async () => {
  const { tela, limpar } = await abrir({ corpo: [] });
  try {
    match(tela.texto(), /Nada para conferir/);
    ok(tela.naoTem('[aria-busy="true"]'), "continuou carregando sobre resposta vazia");
  } finally {
    await limpar();
  }
});

test("quem não é admin lê a resposta do servidor, e o esqueleto para", async () => {
  const { tela, limpar } = await abrir({ status: 404, corpo: {} });
  try {
    ok(/\S/.test(tela.texto()), "a tela ficou muda sobre a recusa");
    ok(tela.naoTem('[aria-busy="true"]'), "mostrou o erro e continuou girando");
  } finally {
    await limpar();
  }
});

/**
 * Um servidor de fila de verdade: responde por DESLOCAMENTO e some com o que
 * foi decidido, que é o comportamento que quebrava a paginação por página.
 */
function servidorDeFila(total: number) {
  const decididos = new Set<number>();
  const pedidos: number[] = [];
  const rede = fingirRede((url, init) => {
    const decisao = /\/casamentos\/(\d+)\/(confirmar|recusar)$/.exec(url);
    if (decisao) {
      decididos.add(Number(decisao[1]));
      return { status: 204 };
    }
    if (url.includes("/casamentos/quantos")) {
      return { corpo: { total: total - decididos.size, principais: 0 } };
    }
    if (url.includes("/admin/casamentos")) {
      const desde = Number(new URL(url, "http://t").searchParams.get("desde") ?? 0);
      pedidos.push(desde);
      const vivos = Array.from({ length: total }, (_, i) => i + 1)
        .filter((id) => !decididos.has(id));
      return {
        corpo: vivos.slice(desde, desde + 50).map((id) => caso({ id })),
      };
    }
    throw new Error(`chamada não prevista: ${url}`);
  });
  return { rede, pedidos, decididos };
}

test("pede pelo DESLOCAMENTO, não por número de página", async () => {
  // A rota paginava por `pagina * 50`. Cada decisão tira a linha da fila, então
  // ela encolhe enquanto se trabalha: quem confere 10 e pede a "página 1" pula
  // 10 itens que nunca viu. `desde = quantos estão na tela` continua certo
  // depois de qualquer número de decisões.
  const { rede, pedidos } = servidorDeFila(120);
  const tela = await renderizar(<TelaCasamentos />);
  await assentar();
  try {
    deepEqual(pedidos, [0], "a primeira carga não pediu do começo");
    const ver = botao(tela, /Ver mais/);
    ok(ver, "sem 'Ver mais' não há como passar dos 50 primeiros");
    await tela.clicar(ver!);
    await assentar();
    deepEqual(pedidos, [0, 50], "o segundo pedido não usou o tamanho da lista");
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});

test("quando a lista esvazia, a tela busca sozinha o pedaço seguinte", async () => {
  // O defeito: a tela chamava a rota SEM deslocamento e nunca buscava de novo.
  // Depois de 50 decisões ela ficava vazia com o contador dizendo que faltavam
  // centenas, e a única saída era recarregar o navegador — oito vezes às cegas
  // para vencer os 395.
  const { rede, pedidos } = servidorDeFila(60);
  const tela = await renderizar(<TelaCasamentos />);
  await assentar();
  try {
    // Decide os 50 que vieram, um a um.
    for (let i = 0; i < 50; i++) {
      const sim = botao(tela, /É este ponto/);
      ok(sim, `sumiu o botão na decisão ${i + 1}`);
      await tela.clicar(sim!);
      await assentar();
    }
    ok(pedidos.length > 1, "esvaziou a lista e não pediu mais nada");
    ok(
      botao(tela, /É este ponto/),
      "a tela ficou vazia com fila ainda cheia no servidor",
    );
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});

test("no fim da fila para de oferecer 'Ver mais'", async () => {
  // Botão que promete mais e devolve vazio é pior que botão nenhum.
  const { rede } = servidorDeFila(20);
  const tela = await renderizar(<TelaCasamentos />);
  await assentar();
  try {
    ok(!botao(tela, /Ver mais/), "ofereceu mais com a fila inteira na tela");
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});
