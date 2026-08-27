/**
 * A camada offline das giras — o caminho que perde dado quando erra.
 *
 * Estes testes existem porque o bug que eles cobrem não aparece em nenhuma
 * tela: o aparelho volta a ter sinal, sobe a sequência que montou horas antes,
 * e apaga em silêncio o que a pessoa acrescentou no OUTRO aparelho. Ninguém vê
 * acontecer. Só descobre no dia da gira, quando o ponto não está lá.
 *
 * Por isso o cenário é sempre o mesmo: dois aparelhos, um deles atrasado.
 *
 * ## Como isto roda
 *
 * `node --test src/` — sem runner instalado, sem jsdom. O Node 24 executa
 * TypeScript direto, e o que precisa de navegador aqui é pouco e explícito:
 * `localStorage` e `fetch`. O `fetch` é substituído por um servidor de mentira
 * que reproduz a regra de versão do backend (`servicos/versao_repertorio.py`),
 * então o cliente HTTP de verdade entra no teste — inclusive o formato do
 * corpo que ele monta.
 *
 * Cada cenário importa o módulo com uma query diferente (`?cenario=N`) porque
 * a fila é estado de módulo, lido do `localStorage` no import. Sem isso, o
 * segundo teste herdaria a fila do primeiro.
 */

import assert from "node:assert/strict";
import test from "node:test";

const CHAVE_CACHE = "pontos-umbanda-repertorios";
const CHAVE_FILA = "pontos-umbanda-repertorios-fila";

interface ItemFalso {
  pontoId: string;
  ordem?: number;
  secao?: string | null;
}
interface GiraFalsa {
  id: string;
  nome: string;
  versao?: string;
  itens: ItemFalso[];
  publico?: boolean;
  ordem?: number;
}

/** A versão muda quando a sequência muda — é só disso que o teste precisa. */
function versaoDe(itens: ItemFalso[]): string {
  return "v" + itens.map((i) => i.pontoId).join("-");
}

interface Servidor {
  giras: GiraFalsa[];
  /** Tudo que o cliente mandou, na ordem. */
  puts: { id: string; corpo: { itens?: ItemFalso[]; versao?: string } }[];
  /** Roda uma vez, no meio do próximo PUT — para simular corrida. */
  duranteOProximoPut: (() => void) | null;
}

/**
 * Prepara o ambiente de um cenário e devolve o módulo, recém-carregado.
 *
 * O `localStorage` é semeado ANTES do import de propósito: é no import que a
 * fila é lida do disco, e é exatamente essa leitura que precisa ser testada
 * (uma fila guardada por uma versão antiga do app tem outro formato).
 */
async function montar(cenario: string, inicial: {
  cache?: GiraFalsa[];
  fila?: unknown;
  servidor: GiraFalsa[];
}) {
  const disco = new Map<string, string>();
  if (inicial.cache) disco.set(CHAVE_CACHE, JSON.stringify(inicial.cache));
  if (inicial.fila) disco.set(CHAVE_FILA, JSON.stringify(inicial.fila));

  const servidor: Servidor = {
    giras: structuredClone(inicial.servidor),
    puts: [],
    duranteOProximoPut: null,
  };

  Object.assign(globalThis, {
    localStorage: {
      getItem: (k: string) => disco.get(k) ?? null,
      setItem: (k: string, v: string) => void disco.set(k, v),
      removeItem: (k: string) => void disco.delete(k),
    },
    window: { addEventListener() {}, removeEventListener() {} },
  });

  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    const resposta = (status: number, corpo: unknown) =>
      new Response(status === 204 ? null : JSON.stringify(corpo), {
        status,
        headers: { "Content-Type": "application/json" },
      });

    if (!init?.method || init.method === "GET") {
      return resposta(200, servidor.giras);
    }
    const id = String(url).replace("/api/v1/repertorios/", "").replace("/itens", "");
    const corpo = JSON.parse(String(init.body));
    servidor.puts.push({ id, corpo });

    if (servidor.duranteOProximoPut) {
      const f = servidor.duranteOProximoPut;
      servidor.duranteOProximoPut = null;
      f();
    }

    const gira = servidor.giras.find((g) => g.id === id);
    if (!gira) return resposta(404, { detail: "Não achei essa gira." });
    // A regra do backend, igual: versão ausente passa (envio de app antigo),
    // versão diferente da atual é recusada.
    if (corpo.versao && gira.versao && corpo.versao !== gira.versao) {
      return resposta(409, { detail: "Esta gira mudou em outro aparelho." });
    }
    gira.itens = corpo.itens.map((i: ItemFalso, ordem: number) => ({ ...i, ordem }));
    gira.versao = versaoDe(gira.itens);
    return resposta(200, gira);
  }) as typeof fetch;

  const mod = await import(`./repertorios.ts?cenario=${cenario}`);
  return {
    mod,
    servidor,
    naFila: () => JSON.parse(disco.get(CHAVE_FILA) ?? "null"),
    noCache: () => JSON.parse(disco.get(CHAVE_CACHE) ?? "null") as GiraFalsa[],
    sequenciaNoServidor: (id = "r1") =>
      servidor.giras.find((g) => g.id === id)?.itens.map((i) => i.pontoId).join(","),
  };
}

/** Deixa o debounce e o envio correrem. */
const respirar = () => new Promise((r) => setTimeout(r, 60));

test("fila guardada por versão antiga do app sobe inteira, e sem versão", async () => {
  // Antes das seções, cada entrada da fila era uma lista de ids. Uma gira
  // montada offline naquela versão ainda pode estar esperando sinal aqui.
  const a = await montar("1", {
    fila: [["r1", ["p1", "p2"]]],
    cache: [{ id: "r1", nome: "Abertura", versao: "vX", itens: [] }],
    servidor: [{ id: "r1", nome: "Abertura", versao: "vX", itens: [] }],
  });

  a.mod.sincronizarAgora();
  await respirar();

  assert.deepEqual(
    a.servidor.puts[0].corpo.itens?.map((i) => i.pontoId),
    ["p1", "p2"],
    "a gira montada offline subiu vazia — a pessoa perderia a sequência inteira",
  );
  assert.equal(
    a.servidor.puts[0].corpo.versao,
    undefined,
    "inventou uma versão para um envio que nunca viu nenhuma",
  );
  assert.equal(a.naFila(), null, "fila não foi limpa depois de o servidor confirmar");
});

test("envio atrasado não apaga o que o outro aparelho acrescentou", async () => {
  // Ela montou a gira sem sinal, sobre a versão "vX"…
  const a = await montar("2", {
    fila: [["r1", { itens: [{ pontoId: "p1", secao: null }], versao: "vX" }]],
    cache: [{ id: "r1", nome: "Abertura", versao: "vX", itens: [{ pontoId: "p1" }] }],
    // …e enquanto isso o outro aparelho acrescentou dois pontos.
    servidor: [{
      id: "r1", nome: "Abertura", versao: "vB",
      itens: [{ pontoId: "p1" }, { pontoId: "p2" }, { pontoId: "p3" }],
    }],
  });
  let estado: { pendentes: number; conflitos: string[] } = {
    pendentes: 0, conflitos: [],
  };
  a.mod.observarSincronia((e: typeof estado) => { estado = e });

  a.mod.sincronizarAgora();
  await respirar();

  assert.equal(a.sequenciaNoServidor(), "p1,p2,p3", "apagou o trabalho do outro aparelho");
  assert.deepEqual(estado.conflitos, ["r1"], "sem estado de conflito a tela não tem o que mostrar");
  assert.equal(estado.pendentes, 1, "descartou o que ela montou aqui");

  // E não pode insistir sozinho: reenviar em laço é justamente o que apagaria
  // o outro lado na tentativa seguinte.
  const antes = a.servidor.puts.length;
  a.mod.sincronizarAgora();
  await respirar();
  assert.equal(a.servidor.puts.length, antes, "reenviou em laço");

  // Ela decide: fica com a dela.
  await a.mod.forcarEnvio("r1");
  await respirar();
  assert.equal(a.sequenciaNoServidor(), "p1", "forçar não gravou a sequência deste aparelho");
  assert.deepEqual(estado.conflitos, [], "faixa de conflito ficaria na tela depois de resolvida");
  assert.equal(estado.pendentes, 0);
});

test("descartar deixa a do servidor na tela — e ela não volta", async () => {
  const a = await montar("3", {
    fila: [["r1", { itens: [{ pontoId: "p9", secao: null }], versao: "vX" }]],
    cache: [{ id: "r1", nome: "Abertura", versao: "vX", itens: [{ pontoId: "p9" }] }],
    servidor: [{
      id: "r1", nome: "Abertura", versao: "vB",
      itens: [{ pontoId: "p1" }, { pontoId: "p2" }],
    }],
  });
  let estado: { pendentes: number; conflitos: string[] } = {
    pendentes: 0, conflitos: [],
  };
  a.mod.observarSincronia((e: typeof estado) => { estado = e });
  a.mod.sincronizarAgora();
  await respirar();
  assert.deepEqual(estado.conflitos, ["r1"], "preparo do cenário falhou: não houve conflito");

  await a.mod.descartarPendente("r1");

  assert.deepEqual(estado.conflitos, []);
  assert.equal(estado.pendentes, 0);
  assert.deepEqual(
    a.noCache()[0].itens.map((i) => i.pontoId),
    ["p1", "p2"],
    "a tela seguiria mostrando a sequência que ela acabou de descartar",
  );
  const carga = await a.mod.carregar();
  assert.deepEqual(
    carga.repertorios[0].itens.map((i: ItemFalso) => i.pontoId),
    ["p1", "p2"],
    "o descartado ressuscitou no carregamento seguinte",
  );
});

test("mexer durante o envio sobe na rodada seguinte, sem conflito falso", async () => {
  const a = await montar("4", {
    cache: [{ id: "r1", nome: "Abertura", versao: "vX", itens: [{ pontoId: "p1" }] }],
    servidor: [{ id: "r1", nome: "Abertura", versao: "vX", itens: [{ pontoId: "p1" }] }],
  });
  let estado: { pendentes: number; conflitos: string[] } = {
    pendentes: 0, conflitos: [],
  };
  a.mod.observarSincronia((e: typeof estado) => { estado = e });

  a.mod.definirSequencia("r1", [{ pontoId: "p1", secao: null }, { pontoId: "p2", secao: null }]);
  // Ela arrasta mais um ponto enquanto o envio anterior ainda está no ar.
  a.servidor.duranteOProximoPut = () => {
    a.mod.definirSequencia("r1", [
      { pontoId: "p1", secao: null },
      { pontoId: "p2", secao: null },
      { pontoId: "p3", secao: null },
    ]);
  };
  a.mod.sincronizarAgora();
  await respirar();
  a.mod.sincronizarAgora();
  await respirar();

  assert.deepEqual(
    estado.conflitos, [],
    "409 contra o próprio aparelho: 'mudou em outro lugar' sem nada ter mudado",
  );
  assert.equal(a.sequenciaNoServidor(), "p1,p2,p3", "o ponto arrastado durante o envio não subiu");
});

test("edição nova sobre fila velha não se aproveita da versão que o cache já viu", async () => {
  // O caminho mais escorregadio: a fila está baseada na "vX", mas `carregar()`
  // já gravou no cache a "vB" que veio do servidor. Se a próxima edição pegar
  // a versão do cache, ela afirma ter visto uma mudança que nunca apareceu na
  // tela — e o servidor aceita gravar por cima dela.
  const a = await montar("5", {
    fila: [["r1", { itens: [{ pontoId: "p1", secao: null }], versao: "vX" }]],
    cache: [{ id: "r1", nome: "Abertura", versao: "vX", itens: [{ pontoId: "p1" }] }],
    servidor: [{
      id: "r1", nome: "Abertura", versao: "vB",
      itens: [{ pontoId: "p1" }, { pontoId: "p2" }],
    }],
  });
  let estado: { pendentes: number; conflitos: string[] } = {
    pendentes: 0, conflitos: [],
  };
  a.mod.observarSincronia((e: typeof estado) => { estado = e });

  const carga = await a.mod.carregar();
  assert.deepEqual(
    carga.repertorios[0].itens.map((i: ItemFalso) => i.pontoId),
    ["p1"],
    "a sequência montada offline não apareceu depois de carregar",
  );
  assert.equal(carga.fonte, "servidor", "caiu para cache: algum erro foi engolido no caminho");

  a.mod.definirSequencia("r1", [{ pontoId: "p1", secao: null }, { pontoId: "p3", secao: null }]);
  a.mod.sincronizarAgora();
  await respirar();

  assert.equal(a.sequenciaNoServidor(), "p1,p2", "o ponto do outro aparelho sumiu em silêncio");
  assert.deepEqual(estado.conflitos, ["r1"], "gravou por cima sem consultar a pessoa");
});
