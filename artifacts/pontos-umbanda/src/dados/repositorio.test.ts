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
  };

  Object.assign(globalThis, {
    localStorage: {
      getItem: (k: string) => disco.get(k) ?? null,
      setItem: (k: string, v: string) => void disco.set(k, v),
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

    if (!init?.method || init.method === "GET") return resposta(200, servidor.acervo);

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
