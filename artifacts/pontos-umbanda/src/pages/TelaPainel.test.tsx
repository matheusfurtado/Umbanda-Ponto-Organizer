/**
 * O painel de administração — e a frase que ele quase perdeu.
 *
 * O `api/painel.ts` montava `new Error(...)` com um `.status` pendurado, fora
 * do vocabulário `ErroApi`/`ErroRede`. Quando as telas passaram a usar
 * `mensagemDeErro`, essa forma deixou de ser reconhecida: quem não é admin
 * lia **"Não consegui carregar."** em vez de "Esta área é de quem modera o
 * acervo." — resposta sobre permissão apresentada como falha do app.
 *
 * A cerca que achou isso foi a de vocabulário, não um teste desta tela. Este
 * arquivo é o outro lado: prende o que a pessoa VÊ.
 */

import { equal, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaPainel } from "@/pages/TelaPainel";

beforeEach(() => localStorage.clear());

const GRUPOS = [
  {
    chave: "contas",
    titulo: "Contas",
    numeros: [
      {
        chave: "ativas",
        rotulo: "Contas ativas",
        valor: 42,
        ressalva: "Não mede quem abriu o app sem entrar.",
      },
    ],
  },
];

const RANKING = [
  { id: "p1", titulo: "Ogum de Lei", orixa: "Ogum", artista: null, quantos: 9 },
];

interface Cenario {
  metricas?: { status?: number; corpo?: unknown } | "rede";
  rankings?: { status?: number; corpo?: unknown };
}

async function abrir(c: Cenario = {}) {
  const rede = fingirRede((url) => {
    if (url.includes("/admin/metricas/pontos-")) return c.rankings ?? { corpo: RANKING };
    if (url.includes("/admin/metricas")) {
      if (c.metricas === "rede") throw new TypeError("Failed to fetch");
      return c.metricas ?? { corpo: { grupos: GRUPOS } };
    }
    throw new Error(`chamada não prevista: ${url}`);
  });
  const { hook } = memoryLocation({ path: "/painel" });
  const tela = await renderizar(
    <Router hook={hook}>
      <TelaPainel />
    </Router>,
  );
  await assentar();
  return {
    tela,
    limpar: async () => {
      await tela.desmontar();
      rede.restaurar();
      localStorage.clear();
    },
  };
}

const aviso = (tela: Tela) => tela.todos('[role="alert"], .border-destructive\\/40')[0];

test("quem não é admin lê que a área é de quem modera", async () => {
  // O 404 aqui não é "sumiu": é a API dizendo que esta conta não é admin, sem
  // confirmar que a área existe. A frase é escrita no cliente porque o
  // servidor, de propósito, não manda uma — e por isso ela precisa CHEGAR.
  const { tela, limpar } = await abrir({ metricas: { status: 404, corpo: {} } });
  try {
    match(tela.texto(), /Esta área é de quem modera o acervo/);
    ok(
      !/Não consegui carregar/.test(tela.texto()),
      "caiu no texto genérico — o erro voltou a sair do vocabulário",
    );
  } finally {
    await limpar();
  }
});

test("outro erro do servidor diz o status, e não finge permissão", async () => {
  const { tela, limpar } = await abrir({ metricas: { status: 503, corpo: {} } });
  try {
    match(tela.texto(), /O servidor respondeu 503/);
    ok(
      !/quem modera/.test(tela.texto()),
      "tratou uma indisponibilidade como se fosse falta de permissão",
    );
  } finally {
    await limpar();
  }
});

test("sem rede, a falha é dita como falha de rede", async () => {
  // Antes, a queda de rede chegava como `TypeError` cru: `ehErroDeRede`
  // respondia "não é rede", e a tela culpava a permissão.
  const { tela, limpar } = await abrir({ metricas: "rede" });
  try {
    match(tela.texto(), /[Ss]em conex/);
    ok(!/quem modera/.test(tela.texto()), "culpou a permissão por falta de rede");
  } finally {
    await limpar();
  }
});

test("cada número vem com a ressalva do que ele não mede", async () => {
  // "Quem lê este painel decide preço, prazo e prioridade, e um número lido
  // como outra coisa custa mais caro que número nenhum."
  const { tela, limpar } = await abrir();
  try {
    match(tela.texto(), /Contas ativas/);
    match(tela.texto(), /42/);
    match(tela.texto(), /Não mede quem abriu o app sem entrar/);
  } finally {
    await limpar();
  }
});

test("ranking que falha não esconde os números do painel", async () => {
  // "Uma falha nelas não pode esconder o painel inteiro — quem abre isto quer
  // os números do negócio antes de qualquer lista."
  const { tela, limpar } = await abrir({
    rankings: { status: 500, corpo: { detail: "estourou" } },
  });
  try {
    match(tela.texto(), /Contas ativas/, "o painel sumiu junto com o ranking");
    match(tela.texto(), /42/);
  } finally {
    await limpar();
  }
});

test("o ranking mostra PONTO, nunca pessoa", async () => {
  // A regra do painel é "diz quantos, nunca quem", e vale para o ranking:
  // uma lista de pontos não é uma lista de gente.
  const { tela, limpar } = await abrir();
  try {
    match(tela.texto(), /Ogum de Lei/);
    ok(!tela.texto().includes("@"), `vazou e-mail no painel: ${tela.texto()}`);
  } finally {
    await limpar();
  }
});

test("o aviso de erro é anunciado, e não só colorido", async () => {
  const { tela, limpar } = await abrir({ metricas: { status: 404, corpo: {} } });
  try {
    ok(aviso(tela), "o erro não tem como ser encontrado por leitor de tela");
    equal(tela.naoTem('[aria-busy="true"]'), true, "continuou dizendo que carrega");
  } finally {
    await limpar();
  }
});
