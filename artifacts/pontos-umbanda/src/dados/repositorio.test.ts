/**
 * A camada offline do acervo — a fila que já perdeu dado de três jeitos.
 *
 * Os três estão cobertos aqui, cada um por um teste, porque nenhum deles
 * aparece na tela quando acontece:
 *
 * 1. O `carregar()` gravava o servidor por cima do que a pessoa editou sem
 *    sinal, e o pendente vivia só em memória — recarregar bastava para apagá-lo.
 * 2. Trocar de conta no MESMO aparelho (o tablet do terreiro) não limpava nada,
 *    e o acervo de quem saiu era empurrado para dentro da conta de quem entrou.
 * 3. O envio não aplicava a versão que ele mesmo criou, então o salvamento
 *    seguinte levava 409 dizendo "mudou em outro aparelho" sem nada ter mudado —
 *    e responder "ficar com o do outro" apagava a própria edição.
 *
 * ## Como isto roda
 *
 * `pnpm test`. Sem runner instalado e sem jsdom: o Node 24 executa TypeScript
 * direto, e o que precisa de navegador é pouco e explícito — `localStorage` e
 * `fetch`. O `fetch` vira um servidor de mentira que reproduz a regra de versão
 * do backend, então o cliente HTTP de verdade entra no teste, com o corpo que
 * ele monta de verdade.
 *
 * Cada cenário importa o módulo com uma query diferente (`?cenario=N`) porque o
 * pendente e o relógio de envio são estado de módulo. Sem isso, um cenário
 * herdaria a fila do anterior.
 */

import assert from "node:assert/strict";
import test from "node:test";

const CHAVE_ACERVO = "pontos-umbanda-data";
const CHAVE_PENDENTE = "pontos-umbanda-pendente";

interface PontoFalso {
  id: string;
  subcategoriaId?: string;
  titulo: string;
  letra?: string;
  autor?: string | null;
  ordem?: number;
  favorito?: boolean;
}
interface AcervoFalso {
  orixas: { id: string; nome: string; ordem?: number }[];
  subcategorias: { id: string; orixaId: string; nome: string }[];
  pontos: PontoFalso[];
  versao?: string;
  ultimoOrixaId?: string;
}

/** A versão muda quando o acervo muda — é só disso que o teste precisa. */
function versaoDe(pontos: PontoFalso[]): string {
  return "v" + pontos.map((p) => p.id).join("-");
}

function acervo(pontos: PontoFalso[], versao?: string): AcervoFalso {
  return {
    orixas: [{ id: "o1", nome: "Ogum", ordem: 0 }],
    subcategorias: [{ id: "s1", orixaId: "o1", nome: "Chegada" }],
    pontos,
    versao: versao ?? versaoDe(pontos),
  };
}

interface Servidor {
  acervo: AcervoFalso;
  /** Tudo que o cliente mandou, na ordem. */
  puts: { versao: string | null; pontos: PontoFalso[] }[];
  /** Roda uma vez, no meio do próximo PUT — para simular corrida. */
  duranteOProximoPut: (() => void) | null;
  /** Liga para o `fetch` falhar como rede caída. */
  fora: boolean;
  /** Faz todo PUT ser recusado com este status. 402 = sem plano, 401 = sem sessão. */
  recusaPutCom: number | null;
  /** Liga o portão do ADR 0002: o GET devolve o acervo achatado. */
  portaoFechado: boolean;
  /**
   * Segura o próximo GET até `soltarGet()`.
   *
   * É o que permite ORDENAR duas cargas: sem isso as duas resolvem na mesma
   * volta do laço e a corrida — que é o defeito — não acontece no teste.
   */
  prenderProximoGet: boolean;
}

/**
 * Prepara o ambiente de um cenário e devolve o módulo, recém-carregado.
 *
 * O `localStorage` é semeado ANTES do import: é assim que o app abre de
 * verdade, com o que a sessão anterior deixou no disco. Passar um `disco` já
 * usado simula recarregar a página sem perder o que estava guardado.
 */
async function montar(cenario: string, inicial: {
  cache?: AcervoFalso;
  pendente?: { dono: string; dados: AcervoFalso };
  servidor: AcervoFalso;
  disco?: Map<string, string>;
}) {
  const disco = inicial.disco ?? new Map<string, string>();
  if (inicial.cache) disco.set(CHAVE_ACERVO, JSON.stringify(inicial.cache));
  if (inicial.pendente) disco.set(CHAVE_PENDENTE, JSON.stringify(inicial.pendente));

  /** Os ouvintes de janela que o módulo registrar — `online`, hoje. */
  const ouvintes = new Map<string, () => void>();

  const servidor: Servidor = {
    acervo: structuredClone(inicial.servidor),
    puts: [],
    duranteOProximoPut: null,
    fora: false,
    recusaPutCom: null,
    portaoFechado: false,
    prenderProximoGet: false,
  };
  let soltarOGetPreso: (() => void) | null = null;

  /**
   * O aparelho recusando o disco.
   *
   * `"cheio"` = cota estourada (o acervo tem ~250 KB e o pendente guarda uma
   * segunda cópia inteira). `"bloqueado"` = Safari com "bloquear todos os
   * cookies", webview restrita, iframe de terceiro — cenário que o próprio
   * `storage.ts` já tratava como real na LEITURA e não tratava na escrita.
   */
  const aparelho = { recusa: null as null | "cheio" | "bloqueado" };

  Object.assign(globalThis, {
    localStorage: {
      getItem: (k: string) => {
        if (aparelho.recusa === "bloqueado") throw new Error("SecurityError");
        return disco.get(k) ?? null;
      },
      setItem: (k: string, v: string) => {
        if (aparelho.recusa) throw new Error("QuotaExceededError");
        disco.set(k, v);
      },
      removeItem: (k: string) => void disco.delete(k),
    },
    window: {
      addEventListener: (evento: string, f: () => void) => void ouvintes.set(evento, f),
      removeEventListener: (evento: string) => void ouvintes.delete(evento),
    },
  });

  globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    if (servidor.fora) throw new TypeError("fetch failed");

    const resposta = (status: number, corpo: unknown) =>
      new Response(JSON.stringify(corpo), {
        status,
        headers: { "Content-Type": "application/json" },
      });

    if (!init?.method || init.method === "GET") {
      if (servidor.prenderProximoGet) {
        servidor.prenderProximoGet = false;
        await new Promise<void>((liberar) => {
          soltarOGetPreso = liberar;
        });
        // De novo DEPOIS de soltar: `fora` é checado lá em cima, antes do
        // portão, então a requisição presa já passou por ele. Sem esta segunda
        // checagem não dá para simular "a rede caiu enquanto esta carga
        // esperava", que é o caminho do `catch`.
        if (servidor.fora) throw new TypeError("fetch failed");
      }
      if (!servidor.portaoFechado) return resposta(200, servidor.acervo);
      // O que o portão faz de verdade, medido numa conta que perdeu o plano:
      // 520 pontos ficam, 55 subcategorias viram 0, toda `ordem` vira 0 e
      // `subcategoriaId` vira "".
      return resposta(200, {
        ...servidor.acervo,
        subcategorias: [],
        pontos: servidor.acervo.pontos.map((p) => ({
          ...p,
          subcategoriaId: "",
          ordem: 0,
        })),
        acesso: { plano: "gratis", acervoOrganizado: false, podeSincronizar: false },
      });
    }

    const corpo = JSON.parse(String(init.body));
    servidor.puts.push({ versao: corpo.versao, pontos: corpo.pontos });

    if (servidor.recusaPutCom !== null) {
      return resposta(servidor.recusaPutCom, {
        detail: "Guardar seus pontos na nuvem faz parte do plano pago.",
      });
    }

    if (servidor.duranteOProximoPut) {
      const f = servidor.duranteOProximoPut;
      servidor.duranteOProximoPut = null;
      f();
    }

    // A regra do backend, igual: versão ausente passa (envio de app antigo),
    // versão diferente da atual é recusada.
    if (corpo.versao && servidor.acervo.versao && corpo.versao !== servidor.acervo.versao) {
      return resposta(409, { detail: "O acervo mudou em outro aparelho." });
    }
    servidor.acervo = {
      ...servidor.acervo,
      pontos: corpo.pontos,
      versao: versaoDe(corpo.pontos),
    };
    return resposta(200, {
      versao: servidor.acervo.versao,
      orixas: corpo.orixas.length,
      subcategorias: corpo.subcategorias.length,
      pontos: corpo.pontos.length,
      pontosCanonicos: 0,
      pontosCriados: corpo.pontos.length,
      favoritos: 0,
    });
  }) as typeof fetch;

  const mod = await import(`./repositorio.ts?cenario=${cenario}`);
  return {
    mod,
    servidor,
    disco,
    pendenteNoDisco: () => JSON.parse(disco.get(CHAVE_PENDENTE) ?? "null"),
    cache: () => JSON.parse(disco.get(CHAVE_ACERVO) ?? "null") as AcervoFalso,
    noServidor: () => servidor.acervo.pontos.map((p) => p.id).join(","),
    /** O navegador avisando que a rede voltou. */
    redeVoltou: () => ouvintes.get("online")?.(),
    aparelho,
    /** Solta o GET que ficou preso, para ele responder DEPOIS do outro. */
    soltarGet: () => {
      soltarOGetPreso?.();
      soltarOGetPreso = null;
    },
    /**
     * Deixa o módulo em repouso ao fim do cenário.
     *
     * Sem isto, um envio reagendado (1,5 s) dispara DEPOIS, já com o `fetch` do
     * cenário seguinte instalado, e escreve no servidor de mentira errado. O
     * teste falharia sozinho, sem nada de errado no código.
     */
    encerrar: () => mod.descartarPendente(),
  };
}

const respirar = () => new Promise((r) => setTimeout(r, 60));

test("a edição feita sem sinal vence o servidor, e o carregamento não a apaga", async (t) => {
  const a = await montar("1", {
    cache: acervo([{ id: "p1", titulo: "Ogum de Lei" }], "vX"),
    // Ela editou offline: acrescentou um ponto. Isso ficou guardado como dela.
    pendente: {
      dono: "u1",
      dados: acervo([{ id: "p1", titulo: "Ogum de Lei" }, { id: "p2", titulo: "Ogum Megê" }], "vX"),
    },
    // O servidor tem só o que existia antes — e um `ultimoOrixaId` que não é dele.
    servidor: acervo([{ id: "p1", titulo: "Ogum de Lei" }], "vX"),
  });
  t.after(() => a.encerrar());

  a.mod.definirDono("u1");
  const carga = await a.mod.carregar();

  assert.deepEqual(
    carga.dados.pontos.map((p: PontoFalso) => p.id),
    ["p1", "p2"],
    "o carregamento sobrescreveu a edição feita sem sinal",
  );
  assert.equal(carga.fonte, "cache");
  assert.match(String(carga.motivo), /ainda não enviadas/);
  assert.deepEqual(
    a.cache().pontos.map((p) => p.id),
    ["p1", "p2"],
    "o cache do aparelho ficou com o do servidor: recarregar perderia a edição",
  );
});

test("o pendente sobrevive a recarregar a página", async (t) => {
  // O bug: `aguardando` vivia só em memória. Recarregar (ou o sistema matar o
  // PWA em segundo plano) apagava o pendente, e o carregamento seguinte
  // sobrescrevia o cache com o do servidor. A edição sumia sem aviso.
  const primeira = await montar("2a", {
    cache: acervo([{ id: "p1", titulo: "Ogum de Lei" }], "vX"),
    servidor: acervo([{ id: "p1", titulo: "Ogum de Lei" }], "vX"),
  });
  primeira.mod.definirDono("u1");
  primeira.servidor.fora = true; // sem sinal: nada sobe
  primeira.mod.persistir(
    acervo([{ id: "p1", titulo: "Ogum de Lei" }, { id: "p2", titulo: "Ogum Megê" }], "vX"),
  );
  primeira.mod.sincronizarAgora();
  await respirar();

  const deixadoNoDisco = primeira.disco.get(CHAVE_PENDENTE);
  assert.ok(deixadoNoDisco, "o envio que falhou não deixou nada guardado no disco");
  // Encerra o relógio da instância antiga e repõe o disco como a sessão o
  // deixou — descartar aqui apagaria justamente o que este teste verifica.
  primeira.mod.descartarPendente();
  primeira.disco.set(CHAVE_PENDENTE, deixadoNoDisco);

  // Recarrega: módulo novo, MESMO disco. E agora com sinal.
  const b = await montar("2b", {
    servidor: acervo([{ id: "p1", titulo: "Ogum de Lei" }], "vX"),
    disco: primeira.disco,
  });
  t.after(() => b.encerrar());

  b.mod.definirDono("u1");
  const carga = await b.mod.carregar();
  assert.deepEqual(
    carga.dados.pontos.map((p: PontoFalso) => p.id),
    ["p1", "p2"],
    "o pendente não sobreviveu ao recarregamento — a edição offline sumiu",
  );
});

test("trocar de conta no mesmo aparelho não leva o acervo de quem saiu", async (t) => {
  // O tablet do terreiro é de todo mundo. Este é o teste que impede o acervo
  // de uma pessoa de ser gravado dentro da conta de outra.
  const a = await montar("3", {
    cache: acervo([{ id: "p1", titulo: "Ogum de Lei" }], "vX"),
    pendente: {
      dono: "u1",
      dados: acervo([{ id: "p1", titulo: "Ogum de Lei" }, { id: "segredo", titulo: "Do outro" }], "vX"),
    },
    servidor: acervo([{ id: "p1", titulo: "Ogum de Lei" }], "vX"),
  });
  t.after(() => a.encerrar());
  let estado: { pendente: boolean; conflito: boolean } = { pendente: false, conflito: false };
  a.mod.observarEnvio((e: typeof estado) => { estado = e });

  a.mod.definirDono("u2"); // outra pessoa entra

  assert.equal(estado.pendente, false, "o pendente de outra conta continuou armado");
  assert.equal(a.pendenteNoDisco(), null, "o pendente de outra conta ficou no disco");

  a.mod.sincronizarAgora();
  await respirar();
  assert.equal(a.servidor.puts.length, 0, "empurrou o acervo de u1 para dentro da conta de u2");

  const carga = await a.mod.carregar();
  assert.deepEqual(
    carga.dados.pontos.map((p: PontoFalso) => p.id),
    ["p1"],
    "u2 viu o acervo de u1 na tela",
  );
});

test("dois salvamentos seguidos não inventam conflito", async (t) => {
  // Sem aplicar a versão que o próprio envio criou, o segundo salvamento leva
  // 409 dizendo "mudou em outro aparelho" sem nada ter mudado — e responder
  // "ficar com o do outro" apagaria a edição dela.
  const a = await montar("4", {
    cache: acervo([{ id: "p1", titulo: "Ogum de Lei" }], "vX"),
    servidor: acervo([{ id: "p1", titulo: "Ogum de Lei" }], "vX"),
  });
  t.after(() => a.encerrar());
  let estado: { pendente: boolean; conflito: boolean } = { pendente: false, conflito: false };
  a.mod.observarEnvio((e: typeof estado) => { estado = e });
  a.mod.definirDono("u1");

  a.mod.persistir(acervo([{ id: "p1", titulo: "Ogum de Lei" }, { id: "p2", titulo: "Ogum Megê" }], "vX"));
  a.mod.sincronizarAgora();
  await respirar();

  a.mod.persistir(acervo(
    [{ id: "p1", titulo: "Ogum de Lei" }, { id: "p2", titulo: "Ogum Megê" }, { id: "p3", titulo: "Ogum Beira-Mar" }],
    a.cache().versao,
  ));
  a.mod.sincronizarAgora();
  await respirar();

  assert.equal(estado.conflito, false, "409 contra o próprio aparelho no segundo salvamento");
  assert.equal(a.noServidor(), "p1,p2,p3", "o segundo salvamento não chegou");
  assert.equal(estado.pendente, false);
});

test("o que ela editou durante o envio sobe depois, sem conflito falso", async (t) => {
  const a = await montar("5", {
    cache: acervo([{ id: "p1", titulo: "Ogum de Lei" }], "vX"),
    servidor: acervo([{ id: "p1", titulo: "Ogum de Lei" }], "vX"),
  });
  t.after(() => a.encerrar());
  let estado: { pendente: boolean; conflito: boolean } = { pendente: false, conflito: false };
  a.mod.observarEnvio((e: typeof estado) => { estado = e });
  a.mod.definirDono("u1");

  a.mod.persistir(acervo([{ id: "p1", titulo: "Ogum de Lei" }, { id: "p2", titulo: "Ogum Megê" }], "vX"));
  // Ela acrescenta mais um ponto enquanto o envio anterior ainda está no ar.
  a.servidor.duranteOProximoPut = () => {
    a.mod.persistir(acervo(
      [{ id: "p1", titulo: "Ogum de Lei" }, { id: "p2", titulo: "Ogum Megê" }, { id: "p3", titulo: "Ogum Beira-Mar" }],
      "vX",
    ));
  };
  a.mod.sincronizarAgora();
  await respirar();
  a.mod.sincronizarAgora();
  await respirar();

  assert.equal(estado.conflito, false, "o aparelho entrou em conflito consigo mesmo");
  assert.equal(a.noServidor(), "p1,p2,p3", "o ponto acrescentado durante o envio não subiu");
});

test("mudança vinda de outro aparelho vira decisão, nunca sobrescrita", async (t) => {
  const a = await montar("6", {
    cache: acervo([{ id: "p1", titulo: "Ogum de Lei" }], "vX"),
    pendente: {
      dono: "u1",
      dados: acervo([{ id: "p1", titulo: "Ogum de Lei" }, { id: "meu", titulo: "Meu ponto" }], "vX"),
    },
    // No outro aparelho ela já tinha acrescentado dois. O servidor está adiante.
    servidor: acervo(
      [{ id: "p1", titulo: "Ogum de Lei" }, { id: "outro1", titulo: "De lá" }, { id: "outro2", titulo: "De lá também" }],
      "vB",
    ),
  });
  t.after(() => a.encerrar());
  let estado: { pendente: boolean; conflito: boolean } = { pendente: false, conflito: false };
  a.mod.observarEnvio((e: typeof estado) => { estado = e });
  a.mod.definirDono("u1");

  a.mod.sincronizarAgora();
  await respirar();

  assert.equal(a.noServidor(), "p1,outro1,outro2", "apagou o que ela fez no outro aparelho");
  assert.equal(estado.conflito, true, "sem estado de conflito a tela não tem o que perguntar");
  assert.equal(estado.pendente, true, "descartou o que ela fez neste aparelho");

  // A rede oscilar não é a pessoa decidindo. Reenviar sozinho aqui é o que
  // apagaria o outro lado — e a decisão ainda não foi tomada.
  const antes = a.servidor.puts.length;
  a.mod.ligarRetomadaAutomatica();
  a.redeVoltou();
  await respirar();
  assert.equal(a.servidor.puts.length, antes, "o Wi-Fi voltar reenviou por cima do conflito");

  // A tela avisa QUANTOS pontos ela perderia ao ficar com o deste aparelho —
  // pode nunca tê-los visto: o servidor acrescenta sozinho o que a comunidade
  // aprovou (ADR 0005).
  assert.equal(await a.mod.contarSoDoServidor(), 2);

  // Ela decide: manda a dela.
  await a.mod.forcarEnvio();
  await respirar();
  assert.equal(a.noServidor(), "p1,meu", "forçar não gravou o acervo deste aparelho");
  assert.equal(estado.conflito, false, "a faixa de conflito ficaria na tela depois de resolvida");
  assert.equal(estado.pendente, false);
});

test("ficar com o do servidor descarta o pendente de vez", async (t) => {
  const a = await montar("7", {
    cache: acervo([{ id: "p1", titulo: "Ogum de Lei" }], "vX"),
    pendente: {
      dono: "u1",
      dados: acervo([{ id: "p1", titulo: "Ogum de Lei" }, { id: "meu", titulo: "Meu ponto" }], "vX"),
    },
    servidor: acervo([{ id: "p1", titulo: "Ogum de Lei" }, { id: "outro", titulo: "De lá" }], "vB"),
  });
  t.after(() => a.encerrar());
  let estado: { pendente: boolean; conflito: boolean } = { pendente: false, conflito: false };
  a.mod.observarEnvio((e: typeof estado) => { estado = e });
  a.mod.definirDono("u1");
  a.mod.sincronizarAgora();
  await respirar();
  assert.equal(estado.conflito, true, "preparo do cenário falhou: não houve conflito");

  a.mod.descartarPendente();

  assert.equal(estado.conflito, false);
  assert.equal(estado.pendente, false);
  assert.equal(a.pendenteNoDisco(), null, "o descartado ficou no disco e voltaria no recarregamento");

  const carga = await a.mod.carregar();
  assert.deepEqual(
    carga.dados.pontos.map((p: PontoFalso) => p.id),
    ["p1", "outro"],
    "o descartado ressuscitou no carregamento seguinte",
  );
  assert.equal(carga.fonte, "servidor");
});

test("sem servidor, mostra o acervo do aparelho e diz o porquê", async (t) => {
  const a = await montar("8", {
    cache: acervo([{ id: "p1", titulo: "Ogum de Lei" }], "vX"),
    servidor: acervo([], "vX"),
  });
  t.after(() => a.encerrar());
  a.mod.definirDono("u1");
  a.servidor.fora = true;

  const carga = await a.mod.carregar();
  assert.deepEqual(carga.dados.pontos.map((p: PontoFalso) => p.id), ["p1"]);
  assert.equal(carga.fonte, "cache", "não distinguiu cache de primeira abertura");
  assert.equal(carga.motivo, "sem conexão com o servidor");
});

test("primeira abertura sem rede não é falha, é primeira abertura", async (t) => {
  // Distinguir os dois muda a mensagem: uma diz "estou sem sinal agora", a
  // outra diz "preciso de conexão uma vez para trazer o acervo".
  const a = await montar("9", { servidor: acervo([], "vX") });
  t.after(() => a.encerrar());
  a.mod.definirDono(null);
  a.servidor.fora = true;

  const carga = await a.mod.carregar();
  assert.equal(carga.fonte, "local");
  assert.deepEqual(carga.dados.pontos, [], "veio acervo embutido: o portão do ADR 0002 fura aqui");
});

test("forçar o envio sem rede avisa, em vez de sumir com a decisão", async (t) => {
  // A faixa de conflito chama isto no clique de "manter o deste aparelho". Se a
  // falha for engolida, a pessoa clica e a tela não muda — ela conclui que não
  // funcionou, ou que funcionou. Nas duas leituras ela erra.
  const a = await montar("10", {
    cache: acervo([{ id: "p1", titulo: "Ogum de Lei" }], "vX"),
    pendente: {
      dono: "u1",
      dados: acervo([{ id: "p1", titulo: "Ogum de Lei" }, { id: "meu", titulo: "Meu ponto" }], "vX"),
    },
    servidor: acervo([{ id: "p1", titulo: "Ogum de Lei" }, { id: "outro", titulo: "De lá" }], "vB"),
  });
  t.after(() => a.encerrar());
  let estado: { pendente: boolean; conflito: boolean } = { pendente: false, conflito: false };
  a.mod.observarEnvio((e: typeof estado) => { estado = e });
  a.mod.definirDono("u1");
  a.mod.sincronizarAgora();
  await respirar();
  assert.equal(estado.conflito, true, "preparo do cenário falhou");

  a.servidor.fora = true;
  await assert.rejects(() => a.mod.forcarEnvio(), "a falha foi engolida");

  assert.ok(a.pendenteNoDisco(), "perdeu o que ela fez neste aparelho");
  assert.equal(estado.conflito, true, "deu o conflito por resolvido sem ter resolvido");
  assert.equal(a.noServidor(), "p1,outro", "mexeu no servidor mesmo tendo falhado");

  // Rede de volta: a decisão dela ainda vale.
  a.servidor.fora = false;
  await a.mod.forcarEnvio();
  await respirar();
  assert.equal(a.noServidor(), "p1,meu");
  assert.equal(estado.conflito, false);
});


/** Espera de verdade: o reenvio é agendado com `setTimeout`. */
function esperar(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

test("402 não vira laço: o app para de insistir e nada se perde", async () => {
  // O achado: usuário grátis logado (e anônimo, com 401) mandava o acervo
  // INTEIRO a cada 1,5 s, para sempre, contra uma rota que já tinha dito não.
  // Bateria e franquia de dados na gira; carga que ninguém pediu no servidor.
  const c = await montar("bloqueio-402", { servidor: acervo([{ id: "p1", titulo: "Um" }]) });
  try {
    c.mod.definirDono("u1");
    c.servidor.recusaPutCom = 402;

    c.mod.persistir(acervo([{ id: "p1", titulo: "Um" }, { id: "p2", titulo: "Dois" }]));
    // Duas janelas de reenvio inteiras. Sem o conserto, seriam ~3 PUTs.
    await esperar(3400);

    assert.equal(
      c.servidor.puts.length,
      1,
      `mandou ${c.servidor.puts.length} PUTs contra um 402 — o laço voltou`,
    );

    // E o que ela escreveu continua guardado: parar de insistir não é desistir.
    assert.equal(c.pendenteNoDisco()?.dados.pontos.length, 2);
    assert.equal(c.cache().pontos.length, 2);
  } finally {
    c.encerrar();
  }
});

test("editar de novo destrava — uma tentativa por edição, não por segundo", async () => {
  // Quem assinou no meio da sessão precisa que a próxima edição suba. E quem
  // não assinou paga UMA tentativa, não uma a cada 1,5 s.
  const c = await montar("bloqueio-destrava", { servidor: acervo([{ id: "p1", titulo: "Um" }]) });
  try {
    c.mod.definirDono("u1");
    c.servidor.recusaPutCom = 402;
    c.mod.persistir(acervo([{ id: "p1", titulo: "Um" }, { id: "p2", titulo: "Dois" }]));
    await esperar(1800);
    assert.equal(c.servidor.puts.length, 1);

    // Ela assinou. O servidor volta a aceitar, e a próxima edição sobe.
    //
    // A versão é a que o SERVIDOR tem ("vp1"), e não a do conteúdo novo: o
    // envio recusado com 402 nunca chegou a mudar nada lá, então o aparelho
    // continua com a versão de antes. Mandar a versão do conteúdo faria o
    // servidor de mentira responder 409 e o teste acusaria o código certo.
    c.servidor.recusaPutCom = null;
    c.mod.persistir(acervo([
      { id: "p1", titulo: "Um" },
      { id: "p2", titulo: "Dois" },
      { id: "p3", titulo: "Três" },
    ], "vp1"));
    await esperar(1800);

    assert.equal(c.servidor.puts.length, 2);
    assert.equal(c.noServidor(), "p1,p2,p3");
    assert.equal(c.pendenteNoDisco(), null, "o pendente devia ter saído depois do 200");
  } finally {
    c.encerrar();
  }
});

test("erro que passa continua sendo tentado de novo", async () => {
  // O contrapeso: parar cedo demais deixaria a gira sem sinal sem sincronizar
  // nunca, que é o caso NORMAL deste app. 5xx e rede caída seguem insistindo.
  const c = await montar("bloqueio-5xx", { servidor: acervo([{ id: "p1", titulo: "Um" }]) });
  try {
    c.mod.definirDono("u1");
    c.servidor.recusaPutCom = 503;
    c.mod.persistir(acervo([{ id: "p1", titulo: "Um" }, { id: "p2", titulo: "Dois" }]));
    await esperar(3400);

    assert.ok(
      c.servidor.puts.length >= 2,
      `só ${c.servidor.puts.length} tentativa(s) contra um 503 — parou cedo demais`,
    );
  } finally {
    c.encerrar();
  }
});

test("a rede voltar não desperta o laço bloqueado", async () => {
  // `sincronizarAgora()` passa POR FORA do `agendar()`. Sem o guarda aqui,
  // bastava o Wi-Fi oscilar para o laço recomeçar pela porta dos fundos.
  const c = await montar("bloqueio-online", { servidor: acervo([{ id: "p1", titulo: "Um" }]) });
  try {
    c.mod.definirDono("u1");
    c.mod.ligarRetomadaAutomatica();
    c.servidor.recusaPutCom = 402;
    c.mod.persistir(acervo([{ id: "p1", titulo: "Um" }, { id: "p2", titulo: "Dois" }]));
    await esperar(1800);
    assert.equal(c.servidor.puts.length, 1);

    c.redeVoltou();
    c.redeVoltou();
    await esperar(300);
    assert.equal(c.servidor.puts.length, 1, "o evento `online` reabriu o laço");
  } finally {
    c.encerrar();
  }
});


test("a tela mostra o motivo do servidor, não o número do status", async () => {
  // "Servidor respondeu 402" não é informação: é ruído com número. A API já
  // escreve a frase certa ("faz parte do plano pago; seu acervo continua salvo
  // neste aparelho"), e era o cliente que a jogava fora.
  const c = await montar("motivo-legivel", { servidor: acervo([{ id: "p1", titulo: "Um" }]) });
  try {
    c.mod.definirDono("u1");
    c.servidor.recusaPutCom = 402;

    let visto = "";
    const parar = c.mod.observarEnvio((e: { ultimoErro?: string }) => {
      if (e.ultimoErro) visto = e.ultimoErro;
    });
    c.mod.persistir(acervo([{ id: "p1", titulo: "Um" }, { id: "p2", titulo: "Dois" }]));
    await esperar(1800);
    parar();

    assert.match(visto, /plano pago/);
    assert.doesNotMatch(visto, /402/);
  } finally {
    c.encerrar();
  }
});


const ORGANIZADO = [
  { id: "p1", subcategoriaId: "s1", titulo: "Um", ordem: 0 },
  { id: "p2", subcategoriaId: "s1", titulo: "Dois", ordem: 1 },
];

test("o acervo achatado do portão não vira envio", async () => {
  // O caminho da perda, inteiro: a pessoa deixa de pagar, o portão manda o
  // acervo sem hierarquia, o cliente grava por cima do cache e — na primeira
  // edição — enfileira aquilo como se fosse trabalho dela. Voltando a pagar,
  // esse pendente ganhava do servidor e apagava a organização que ela montou.
  const c = await montar("portao-nao-envia", { servidor: acervo(ORGANIZADO) });
  try {
    c.mod.definirDono("u1");
    c.servidor.portaoFechado = true;

    const carga = await c.mod.carregar();
    assert.equal(carga.dados.parcial, true, "a cópia reduzida não foi marcada");
    assert.equal(carga.dados.subcategorias.length, 0);

    // Ela mexe em algo — favoritar, por exemplo. Nada disso pode virar fila.
    c.mod.persistir({ ...carga.dados, pontos: carga.dados.pontos.slice(0, 1) });
    await esperar(1800);

    assert.equal(c.servidor.puts.length, 0, "mandou a cópia reduzida para o servidor");
    assert.equal(c.pendenteNoDisco(), null, "guardou a cópia reduzida como pendente");
  } finally {
    c.encerrar();
  }
});

test("pendente reduzido guardado de antes é descartado, não enviado", async () => {
  // Quem já tem no disco um pendente marcado — de uma versão anterior deste
  // código, ou de uma sessão que ficou aberta — não pode vê-lo subir na
  // primeira abertura depois de voltar a pagar.
  const c = await montar("portao-pendente-velho", {
    servidor: acervo(ORGANIZADO),
    pendente: {
      dono: "u1",
      dados: { ...acervo([{ id: "p1", titulo: "Um" }]), subcategorias: [], parcial: true },
    },
  });
  try {
    c.mod.definirDono("u1");
    const carga = await c.mod.carregar();

    // Veio do servidor, com a hierarquia de volta — e não do pendente achatado.
    assert.equal(carga.fonte, "servidor");
    assert.equal(carga.dados.subcategorias.length, 1);
    assert.equal(c.pendenteNoDisco(), null);

    await esperar(1800);
    assert.equal(c.servidor.puts.length, 0, "o pendente achatado subiu assim mesmo");
  } finally {
    c.encerrar();
  }
});

test("acervo completo continua sendo enviado — o guarda não pode pegar quem paga", async () => {
  // O contrapeso. Marcar demais quebraria o sync de quem paga, que é o
  // produto inteiro.
  const c = await montar("portao-quem-paga", { servidor: acervo(ORGANIZADO) });
  try {
    c.mod.definirDono("u1");
    const carga = await c.mod.carregar();
    assert.notEqual(carga.dados.parcial, true);

    c.mod.persistir({
      ...carga.dados,
      pontos: [...ORGANIZADO, { id: "p3", subcategoriaId: "s1", titulo: "Três", ordem: 2 }],
    });
    await esperar(1800);

    assert.equal(c.servidor.puts.length, 1);
    assert.equal(c.noServidor(), "p1,p2,p3");
  } finally {
    c.encerrar();
  }
});


test("dois salvamentos a partir do MESMO objeto da tela não inventam conflito", async () => {
  // O laço real do `AppProvider`, que os outros testes deste arquivo não
  // imitam: a tela guarda `dados` num `useState`, monta o próximo payload com
  // `{...dados, pontos}` e **nunca relê o cache**. A versão nova que o envio
  // devolve volta para o localStorage e para `aguardando` — e não para o React.
  //
  // Resultado: o segundo salvamento manda a versão que o primeiro já
  // invalidou, leva 409, e o app diz "seus pontos mudaram em outro aparelho".
  // Nada mudou em lugar nenhum: o aparelho conflitou consigo mesmo. E a saída
  // oferecida na faixa ("ficar com o do outro") descarta a segunda edição.
  //
  // O teste vizinho `dois salvamentos seguidos não inventam conflito` passa
  // porque ele relê `c.cache().versao` entre um e outro — coisa que a tela não
  // faz. Era essa releitura que escondia o defeito.
  const c = await montar("tela-reusa-o-mesmo-objeto", {
    cache: acervo([{ id: "p1", titulo: "Um" }], "vp1"),
    servidor: acervo([{ id: "p1", titulo: "Um" }], "vp1"),
  });
  try {
    c.mod.definirDono("u1");
    const carga = await c.mod.carregar();

    // A tela guarda ISTO e vai derivar tudo daqui, sem reler.
    let daTela = carga.dados;

    daTela = { ...daTela, pontos: [...daTela.pontos, { id: "p2", titulo: "Dois" }] };
    c.mod.persistir(daTela);
    await esperar(1800);

    daTela = { ...daTela, pontos: [...daTela.pontos, { id: "p3", titulo: "Três" }] };
    c.mod.persistir(daTela);
    await esperar(1800);

    assert.equal(
      c.noServidor(),
      "p1,p2,p3",
      "a segunda edição não chegou ao servidor",
    );
    // `observarEnvio` chama o ouvinte na hora da inscrição, então o estado
    // chega antes de a inscrição retornar — daí a variável, e não uma Promise.
    let visto: { conflito: boolean; pendente: boolean } | null = null;
    const parar = c.mod.observarEnvio((e: { conflito: boolean; pendente: boolean }) => {
      visto = e;
    });
    parar();
    assert.equal(visto!.conflito, false, "conflito falso contra o próprio aparelho");
    assert.equal(visto!.pendente, false, "ficou pendente sem ter o que enviar");
  } finally {
    c.encerrar();
  }
});


test("o favorito de quem não paga sobrevive a reabrir o app", async () => {
  // Quem não paga não sincroniza (o `PUT` responde 402), então o favorito dela
  // é deste aparelho e de mais lugar nenhum. O `carregar()` gravava o do
  // servidor por cima e ele sumia — sem fila, sem aviso, sem erro. Favoritar é
  // a única coisa que o plano grátis deixa a pessoa fazer.
  const c = await montar("favorito-gratis", {
    servidor: acervo([
      { id: "p1", titulo: "Um" },
      { id: "p2", titulo: "Dois" },
    ]),
  });
  try {
    c.mod.definirDono("u1");
    c.servidor.portaoFechado = true;

    const primeira = await c.mod.carregar();
    assert.equal(primeira.dados.parcial, true, "o cenário não vale: não veio reduzido");

    // Ela favorita, como o `LinhaPonto` faz.
    c.mod.persistir({
      ...primeira.dados,
      pontos: primeira.dados.pontos.map((p: { id: string }) =>
        p.id === "p2" ? { ...p, favorito: true } : p,
      ),
    });

    // Reabre o app com rede.
    const segunda = await c.mod.carregar();
    const p2 = segunda.dados.pontos.find((p: { id: string }) => p.id === "p2");
    assert.equal(p2.favorito, true, "o favorito sumiu ao reabrir");

    // E o que o servidor manda continua mandando no resto: nada de inventar
    // ponto que não existe mais lá.
    assert.deepEqual(
      segunda.dados.pontos.map((p: { id: string }) => p.id),
      ["p1", "p2"],
    );
  } finally {
    c.encerrar();
  }
});

test("baixar o acervo da conta traz a marca `parcial`", async () => {
  // A marca era calculada dentro de `carregar()`, então `baixarDadosDaConta`
  // — que chama `baixarAcervo` direto — devolvia o AppData CRU. Quem estava
  // sem plano e apertava "Baixar os pontos da minha conta neste aparelho"
  // recebia a cópia achatada e o app a enfileirava como trabalho dela: a bomba
  // que `persistir` diz impedir, montada por outro caminho.
  const c = await montar("parcial-no-cliente", {
    servidor: acervo([{ id: "p1", titulo: "Um" }]),
  });
  try {
    c.mod.definirDono("u1");
    c.servidor.portaoFechado = true;

    const { baixarAcervo } = await import(`../api/cliente.ts?cenario=parcial-no-cliente`);
    const cru = await baixarAcervo();
    assert.equal(cru.parcial, true, "a marca não nasce no cliente");
  } finally {
    c.encerrar();
  }
});

test("a carga que perde a corrida NÃO grava o cache", async () => {
  /*
   * O caso comum, e ele é comum de verdade: a pessoa abre o app (carga
   * ANÔNIMA em voo), entra na conta, e começa uma segunda carga — o
   * `context.tsx` rebusca quando o login muda, e a faixa de cache ainda tem um
   * botão "Atualizar" que chama o mesmo caminho.
   *
   * Se a anônima responder por último — rede lenta na primeira, cache quente na
   * segunda —, ela ganha. E a anônima é a visão do PORTÃO: acervo achatado,
   * `subcategorias: []`, `subcategoriaId` vazio (ADR 0002).
   *
   * O prejuízo não é a tela piscar. É o CACHE ficar com a cópia reduzida: na
   * próxima abertura sem rede, quem PAGA vê o acervo de anônimo, e nada
   * explica por quê.
   */
  const a = await montar("corrida-de-cargas", {
    servidor: acervo([{ id: "p1", subcategoriaId: "s1", titulo: "Ogum de Lei" }]),
  });
  a.servidor.acervo.subcategorias = [{ id: "s1", orixaId: "o1", nome: "Chegada" }];
  a.servidor.acervo.orixas = [{ id: "o1", nome: "Ogum" }];
  try {
    // Carga A: anônima (portão fechado) e PRESA antes de responder.
    a.servidor.portaoFechado = true;
    a.servidor.prenderProximoGet = true;
    const velha = a.mod.carregar();

    // Carga B: a pessoa entrou. Sai e volta inteira, primeiro.
    a.servidor.portaoFechado = false;
    const nova = await a.mod.carregar();
    assert.equal(nova.obsoleta, undefined, "a carga mais nova não pode se declarar obsoleta");
    assert.equal(a.cache().subcategorias.length, 1, "a carga nova não gravou a hierarquia");

    // Agora a anônima responde, tarde.
    a.soltarGet();
    const atrasada = await velha;

    assert.equal(atrasada.obsoleta, true, "a carga velha não se declarou obsoleta");
    assert.equal(
      a.cache().subcategorias.length,
      1,
      "a carga anônima gravou o acervo achatado por cima da hierarquia",
    );
    assert.equal(
      a.cache().pontos[0].subcategoriaId,
      "s1",
      "o ponto perdeu a subcategoria para a carga que chegou atrasada",
    );
  } finally {
    a.encerrar();
  }
});

test("a carga atrasada não REARMA a fila de envio", async () => {
  /*
   * O ramo do pendente grava por outro caminho, e o que a carga atrasada faz de
   * errado ali não é a escrita — as duas leem o mesmo pendente, porque ele é
   * lido DEPOIS do `await`, e escrevem a mesma coisa. São os EFEITOS: pôr o
   * pendente de volta em `aguardando`, anunciar `pendente: true` e reagendar um
   * envio que a carga nova já agendou.
   *
   * Este teste conta os ANÚNCIOS depois de a carga nova terminar. Sem ele, o
   * guarda podia ficar no lugar errado — e ficou: na primeira versão ele estava
   * abaixo dos efeitos, e tirá-lo não quebrava nada.
   */
  const a = await montar("corrida-rearma-a-fila", {
    cache: acervo([{ id: "p1", titulo: "Do cache" }]),
    pendente: { dono: "u1", dados: acervo([{ id: "pend", titulo: "Da fila" }]) },
    servidor: acervo([{ id: "srv", titulo: "Do servidor" }]),
  });
  try {
    a.mod.definirDono("u1");

    a.servidor.prenderProximoGet = true;
    const velha = a.mod.carregar();
    const nova = await a.mod.carregar();
    assert.equal(nova.fonte, "cache", "a carga nova não achou o pendente");

    // Conta só o que a ATRASADA fizer daqui para a frente. `observarEnvio`
    // chama o ouvinte na hora, então a primeira não conta.
    let anuncios = -1;
    const parar = a.mod.observarEnvio(() => {
      anuncios += 1;
    });

    a.soltarGet();
    const atrasada = await velha;
    parar();

    assert.equal(atrasada.obsoleta, true, "a carga atrasada não se declarou obsoleta");
    assert.equal(anuncios, 0, `a carga atrasada rearmou a fila (${anuncios} anúncios)`);
  } finally {
    a.encerrar();
  }
});

test("a FALHA de uma carga velha também não fala pela tela", async () => {
  // Sem isto, uma carga anônima que caiu derrubava a tela para "erro" DEPOIS
  // de a carga nova ter trazido o acervo inteiro — a pessoa via "não consegui
  // carregar" com o acervo na frente dela.
  const a = await montar("corrida-com-falha", {
    servidor: acervo([{ id: "p1", titulo: "Ogum de Lei" }]),
  });
  try {
    a.servidor.prenderProximoGet = true;
    const velha = a.mod.carregar();

    const nova = await a.mod.carregar();
    assert.equal(nova.fonte, "servidor");

    // A velha só descobre que a rede caiu quando é solta.
    a.servidor.fora = true;
    a.soltarGet();
    const atrasada = await velha;

    assert.equal(atrasada.obsoleta, true, "a falha atrasada não se declarou obsoleta");
  } finally {
    a.encerrar();
  }
});

test("disco cheio NÃO transforma uma carga boa em falha", async () => {
  /*
   * `salvarDados` era `setItem` nu — ao contrário do `carregarDados` e do
   * `gravarPendente`, que já tinham guarda. Com a cota estourada ele lançava
   * DENTRO do `try` de `carregar()`, e o `catch` de lá apresentava como falha
   * uma carga que tinha dado certo: a faixa vermelha dizia "falha
   * desconhecida" com o acervo do servidor na mão.
   */
  const a = await montar("disco-cheio", {
    cache: acervo([{ id: "velho", titulo: "Do cache" }]),
    servidor: acervo([{ id: "novo", titulo: "Do servidor" }]),
  });
  try {
    a.aparelho.recusa = "cheio";
    const r = await a.mod.carregar();

    assert.equal(r.fonte, "servidor", `a carga boa virou ${r.fonte}: ${r.motivo}`);
    assert.equal(r.motivo, undefined, `inventou um motivo de falha: ${r.motivo}`);
    // O dado chega à tela mesmo sem caber no disco — perder o que veio porque o
    // armazenamento recusou seria trocar um problema por outro, pior.
    assert.equal(r.dados.pontos[0].id, "novo");
  } finally {
    a.aparelho.recusa = null;
    a.encerrar();
  }
});

test("disco cheio não faz a edição da pessoa sumir da tela", async () => {
  // Caminho de ESCRITA: `persistir` lançava, o erro subia por `atualizar` e
  // matava o `setDados` no meio — a edição sumia da tela, sem uma palavra.
  const a = await montar("disco-cheio-escrita", {
    cache: acervo([{ id: "p1", titulo: "Um" }]),
    servidor: acervo([{ id: "p1", titulo: "Um" }]),
  });
  try {
    a.mod.definirDono("u1");
    a.aparelho.recusa = "cheio";
    // Não pode lançar: quem chama é o `atualizar` do contexto, e o que vem
    // depois dele é o `setDados` que põe a edição na tela.
    a.mod.persistir(acervo([{ id: "p1", titulo: "Um" }, { id: "p2", titulo: "Dois" }]));
  } finally {
    a.aparelho.recusa = null;
    a.encerrar();
  }
});

test("armazenamento BLOQUEADO não deixa o esqueleto girando para sempre", async () => {
  /*
   * O erro dentro do tratador de erro. `carregar()` caía no `catch`, e lá
   * dentro havia um `localStorage.getItem` NU para descobrir se já houve
   * visita. Com o armazenamento bloqueado ele lançava de novo — agora sem
   * ninguém para pegar —, a promessa de `carregar()` rejeitava, e o
   * `buscarDoServidor` (que não tem `try/catch`) nunca chegava a `setEstado`.
   *
   * Efeito na tela: os cartões cinza pulsando, para sempre, sem mensagem e sem
   * "tentar de novo".
   */
  const a = await montar("disco-bloqueado", {
    servidor: acervo([{ id: "p1", titulo: "Um" }]),
  });
  try {
    a.servidor.fora = true;
    a.aparelho.recusa = "bloqueado";

    // O que se prende é que ela RESOLVE — antes, rejeitava.
    const r = await a.mod.carregar();
    assert.ok(r.motivo, "a falha de rede perdeu o motivo");
    // Sem disco não há cópia guardada: é primeira abertura, não "cache velho".
    assert.equal(r.fonte, "local", `disse ${r.fonte} sobre um aparelho sem disco`);
  } finally {
    a.aparelho.recusa = null;
    a.encerrar();
  }
});
