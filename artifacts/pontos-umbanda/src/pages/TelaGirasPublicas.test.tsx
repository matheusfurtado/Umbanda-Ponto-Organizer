/**
 * A vitrine — a página que abre para quem não tem conta.
 *
 * "É por aqui que o app circula no boca a boca do terreiro, que é o canal de
 * aquisição gratuito do produto — pedir cadastro para ver mataria justamente
 * isso." Então o que se prende aqui é: abre sem conta, e nada que dependa de
 * conta pode esvaziar a página.
 */

import { deepEqual, equal, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaGirasPublicas } from "@/pages/TelaGirasPublicas";
import { AuthProvider } from "@/auth/AuthContext";

beforeEach(() => localStorage.clear());

const EU = {
  id: "u1", email: "maria@exemplo.com", email_verificado: true,
  apelido: "quem-olha", admin: false, favoritos_publicos: false, foto: null,
};

const VITRINE = [
  { id: "g1", nome: "Gira de sexta", publico: true, de: "Terreiro de Ogum", pontos: 12 },
  { id: "g2", nome: "Festa de Exu", publico: true, de: "Casa da Mata", pontos: 7 },
];

const DE_QUEM_SIGO = [
  { id: "g9", nome: "Gira do Pai João", de: "Pai João", pontos: 5 },
];

interface Cenario {
  vitrine?: { status?: number; corpo?: unknown };
  seguidas?: { status?: number; corpo?: unknown };
  logada?: boolean;
}

async function abrir(c: Cenario = {}) {
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) {
      return c.logada ? { corpo: EU } : { status: 401, corpo: {} };
    }
    if (url.includes("/repertorios/publicos")) return c.vitrine ?? { corpo: VITRINE };
    if (url.includes("/giras-de-quem-sigo") || url.includes("/seguindo")) {
      return c.seguidas ?? { corpo: DE_QUEM_SIGO };
    }
    throw new Error(`chamada não prevista: ${url}`);
  });
  const { hook } = memoryLocation({ path: "/giras-publicas" });
  const tela = await renderizar(
    <Router hook={hook}>
      <AuthProvider>
        <TelaGirasPublicas />
      </AuthProvider>
    </Router>,
  );
  await assentar();
  return {
    tela,
    chamadas: rede.chamadas,
    limpar: async () => {
      await tela.desmontar();
      rede.restaurar();
      localStorage.clear();
    },
  };
}

const cartoes = (tela: Tela) =>
  tela.todos("a[href^='/gira/']").map((a) => a.getAttribute("href"));

test("abre sem conta — é o canal de aquisição do produto", async () => {
  const { tela, limpar } = await abrir();
  try {
    match(tela.texto(), /Giras da comunidade/);
    deepEqual(cartoes(tela), ["/gira/g1", "/gira/g2"]);
    // O apelido de quem montou, nunca o e-mail.
    match(tela.texto(), /Terreiro de Ogum/);
    ok(!tela.texto().includes("@"), `vazou e-mail na vitrine: ${tela.texto()}`);
  } finally {
    await limpar();
  }
});

test("sem conta, nem chega a pedir as giras de quem se segue", async () => {
  // Pedir uma rota que exige sessão para quem não tem gera 401 à toa — e o
  // efeito é guardado por `if (!autenticado) return`.
  const { tela, chamadas, limpar } = await abrir();
  try {
    ok(
      !chamadas.some((c) => /sigo|seguindo/.test(c.url)),
      `pediu rota de conta sem conta: ${JSON.stringify(chamadas)}`,
    );
    ok(!/De quem você segue/.test(tela.texto()));
  } finally {
    await limpar();
  }
});

test("com conta, as giras de quem se segue vêm antes da vitrine", async () => {
  // "O que dá sentido ao seguir. Sem isto, seguir alguém só mexia num número."
  const { tela, limpar } = await abrir({ logada: true });
  try {
    const texto = tela.texto();
    match(texto, /De quem você segue/);
    ok(
      texto.indexOf("Gira do Pai João") < texto.indexOf("Gira de sexta"),
      "a seção de quem se segue veio depois da vitrine",
    );
  } finally {
    await limpar();
  }
});

test("se as giras de quem se segue falharem, a vitrine continua inteira", async () => {
  // "Um erro aqui não pode esvaziar a página que é o canal de aquisição."
  const { tela, limpar } = await abrir({
    logada: true,
    seguidas: { status: 500, corpo: { detail: "estourou" } },
  });
  try {
    deepEqual(cartoes(tela), ["/gira/g1", "/gira/g2"], "a vitrine sumiu junto");
    ok(!/De quem você segue/.test(tela.texto()));
    // E o erro daquele pedaço NÃO vira alarme na página inteira.
    ok(!/estourou/.test(tela.texto()));
  } finally {
    await limpar();
  }
});

test("vitrine vazia convida a publicar, e diz onde", async () => {
  const { tela, limpar } = await abrir({ vitrine: { corpo: [] } });
  try {
    match(tela.texto(), /Nenhuma gira pública ainda/);
    match(tela.texto(), /Minhas giras/, "não disse onde se torna pública");
    ok(tela.naoTem('[aria-busy="true"]'), "ficou carregando sobre uma resposta vazia");
  } finally {
    await limpar();
  }
});

test("quando a vitrine falha, a tela para de dizer que está carregando", async () => {
  // O esqueleto aparece enquanto `giras === null`, e o erro não mexe nisso —
  // então a página mostrava a mensagem de falha COM os cartões fantasmas
  // animando embaixo, para sempre. Quem vê isso espera; não há o que esperar.
  const { tela, limpar } = await abrir({
    vitrine: { status: 503, corpo: { detail: "Não consegui carregar as giras públicas." } },
  });
  try {
    match(tela.texto(), /Não consegui carregar as giras públicas/);
    ok(
      tela.naoTem('[aria-busy="true"]'),
      "mostrou o erro e continuou fingindo que carrega",
    );
  } finally {
    await limpar();
  }
});
