/**
 * O orixá — a tela onde o portão do ADR 0002 aparece de verdade.
 *
 * Uma tela serve os dois planos, "e a diferença aparece sozinha": com
 * subcategorias os pontos vêm em seções da gira, sem elas numa lista única. Uma
 * e não duas porque duas divergem — já aconteceu aqui.
 *
 * "Sozinha" é confortável de escrever e difícil de garantir: o que a sustenta é
 * o servidor mandar `subcategorias: []` para quem não paga. Se um dia a
 * hierarquia vazar, esta tela a exibe sem reclamar, porque ela não confere
 * nada — só desenha o que recebeu. Estes testes prendem os dois lados.
 *
 * (`TelaAcervoSimples`, que o nome sugere ser a tela do plano grátis, NÃO está
 * ligada a nada. Ver o aviso no topo dela.)
 */

import { deepEqual, equal, match, ok } from "node:assert/strict";
import { test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaOrixa } from "@/pages/TelaOrixa";
import { AppProvider } from "@/context";
import { AuthProvider } from "@/auth/AuthContext";
import { EntitlementsProvider } from "@/billing/EntitlementsContext";
import type { AppData, Orixa, Ponto } from "@/types";

const OGUM = { id: "ogum", nome: "Ogum", cor: "#c00", emoji: "⚔️", ordem: 0 } as Orixa;

function ponto(id: string, titulo: string, sub: string, extra: Partial<Ponto> = {}): Ponto {
  return {
    id, titulo, subcategoriaId: sub, orixaId: "ogum",
    letra: `letra de ${titulo}`, favorito: false, ordem: 0, criadoEm: 0,
    ...extra,
  };
}

/** O que o servidor manda para quem PAGA: orixás, subcategorias e pontos. */
const PAGO: AppData = {
  orixas: [OGUM],
  subcategorias: [
    { id: "ogum-0", orixaId: "ogum", nome: "Chegada", ordem: 0, criadoEm: 0 },
    { id: "ogum-1", orixaId: "ogum", nome: "Louvação", ordem: 1, criadoEm: 0 },
  ],
  pontos: [
    ponto("p1", "Ogum de Lei", "ogum-0"),
    ponto("p2", "Ogum Megê", "ogum-1", { videoUrl: "https://y/1", videoStatus: "encontrado" }),
  ],
};

/**
 * O que ele manda para quem NÃO paga: os mesmos pontos, `subcategoriaId`
 * vazio, `subcategorias: []`. É o achatamento do portão, e é aqui que a tela
 * tem de virar lista sozinha.
 */
const GRATIS: AppData = {
  orixas: [OGUM],
  subcategorias: [],
  pontos: PAGO.pontos.map((p) => ({ ...p, subcategoriaId: "", ordem: 0, videoUrl: null })),
};

async function abrir(acervo: AppData, direitos: Record<string, unknown>) {
  localStorage.setItem("pontos-umbanda-data", JSON.stringify(acervo));
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) return { corpo: { id: "u1", email: "m@e.com", email_verificado: true, apelido: "m", admin: false, foto: null, favoritos_publicos: false } };
    if (url.includes("/meus-direitos")) return { corpo: direitos };
    if (url.includes("/acervo")) {
      return { corpo: { ...acervo, acesso: { acervoOrganizado: direitos.acervoOrganizado === true } } };
    }
    throw new Error(`chamada não prevista: ${url}`);
  });
  const { hook } = memoryLocation({ path: "/" });
  const tela = await renderizar(
    <Router hook={hook}>
      <AuthProvider>
        <EntitlementsProvider>
          <AppProvider>
            <TelaOrixa orixa={OGUM} onVoltar={() => {}} />
          </AppProvider>
        </EntitlementsProvider>
      </AuthProvider>
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

const secoes = (tela: { todos: (s: string) => Element[] }) =>
  tela.todos("h2").map((h) => h.textContent?.trim());

test("quem paga vê as seções da gira, na ordem", async () => {
  const { tela, limpar } = await abrir(PAGO, {
    plano: "mensal", acervoOrganizado: true, linksDeVideo: true,
  });
  try {
    deepEqual(secoes(tela), ["Chegada", "Louvação"]);
    match(tela.texto(), /2 seções/);
  } finally {
    await limpar();
  }
});

test("quem não paga vê lista única — sem seção e sem 'Outros'", async () => {
  // O achatamento do portão. Sem subcategorias a tela não pode inventar
  // seções, e também não pode rotular a lista inteira de "Outros" — "Outros"
  // em relação a quê?
  const { tela, limpar } = await abrir(GRATIS, {
    plano: "gratis", acervoOrganizado: false, linksDeVideo: false,
  });
  try {
    deepEqual(secoes(tela), [], `apareceu cabeçalho de seção: ${secoes(tela)}`);
    match(tela.texto(), /Ogum de Lei/, "os pontos sumiram junto com as seções");
    match(tela.texto(), /Ogum Megê/);
  } finally {
    await limpar();
  }
});

test("o cabeçalho não anuncia seção que não existe", async () => {
  // Só o CABEÇALHO: o convite ao plano fala de seções de propósito — é o que
  // ele está vendendo. Medir o texto da tela inteira misturava as duas coisas
  // e o teste passava a proibir a frase de venda.
  const linhaDoCabecalho = (tela: { exigir: (s: string) => Element }) =>
    tela.exigir("h1").nextElementSibling?.textContent ?? "";

  const gratis = await abrir(GRATIS, { plano: "gratis", acervoOrganizado: false });
  try {
    match(linhaDoCabecalho(gratis.tela), /2 pontos/);
    ok(
      !/seç/.test(linhaDoCabecalho(gratis.tela)),
      `o cabeçalho do plano grátis prometeu seções: ${linhaDoCabecalho(gratis.tela)}`,
    );
  } finally {
    await gratis.limpar();
  }

  const pago = await abrir(PAGO, { plano: "mensal", acervoOrganizado: true });
  try {
    match(linhaDoCabecalho(pago.tela), /2 pontos · 1 com vídeo · 2 seções/);
  } finally {
    await pago.limpar();
  }
});

test("a tela NÃO reordena o que o servidor mandou", async () => {
  // A ordem da gira é do servidor — é ela o produto pago, e é conteúdo
  // litúrgico. Uma ordenação de conveniência no cliente a desfaria em
  // silêncio, e ninguém notaria olhando esta tela isolada.
  const foraDeAlfabetica: AppData = {
    ...PAGO,
    pontos: [
      ponto("p3", "Zé do caminho", "ogum-0"),
      ponto("p1", "Ogum de Lei", "ogum-0"),
      ponto("p2", "Ave Ogum", "ogum-0"),
    ],
  };
  const { tela, limpar } = await abrir(foraDeAlfabetica, {
    plano: "mensal", acervoOrganizado: true,
  });
  try {
    // Duas coisas por linha têm `aria-expanded` — o título e a seta —, e só o
    // título carrega texto. A seta entra como "" e sai aqui.
    const titulos = tela
      .todos("button[aria-expanded]")
      .map((b) => b.textContent?.trim() ?? "")
      .filter(Boolean);
    deepEqual(
      titulos,
      ["Zé do caminho", "Ogum de Lei", "Ave Ogum"],
      "a tela ordenou por conta própria e desfez a sequência da gira",
    );
  } finally {
    await limpar();
  }
});

test("o convite ao plano vem NO FIM, e só para quem não tem", async () => {
  // "No topo empurraria o conteúdo para baixo e leria como pedágio."
  const gratis = await abrir(GRATIS, { plano: "gratis", acervoOrganizado: false });
  try {
    const texto = gratis.tela.texto();
    ok(
      texto.indexOf("Ogum de Lei") < texto.lastIndexOf("Ogum"),
      "o convite veio antes do que a pessoa foi buscar",
    );
    ok(gratis.tela.todos("a").some((a) => a.getAttribute("href") === "/planos"));
  } finally {
    await gratis.limpar();
  }

  const pago = await abrir(PAGO, { plano: "mensal", acervoOrganizado: true });
  try {
    equal(
      pago.tela.todos("a").filter((a) => a.getAttribute("href") === "/planos").length,
      0,
      "vendeu o plano para quem já paga",
    );
  } finally {
    await pago.limpar();
  }
});

test("a busca filtra por título E por letra, e diz quando não achou", async () => {
  const { tela, limpar } = await abrir(PAGO, { plano: "mensal", acervoOrganizado: true });
  try {
    const campo = tela.exigir('input[aria-label="Buscar pontos de Ogum"]') as HTMLInputElement;
    const { act } = await import("react");
    const digitar = async (texto: string) => {
      await act(async () => {
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, "value",
        )?.set;
        setter?.call(campo, texto);
        campo.dispatchEvent(new window.Event("input", { bubbles: true }));
      });
    };

    await digitar("megê");
    match(tela.texto(), /Ogum Megê/);
    ok(!tela.texto().includes("Ogum de Lei"), "não filtrou");

    // Pela letra, e ignorando acento: é o que `semAcento` promete.
    await digitar("letra de ogum de lei");
    match(tela.texto(), /Ogum de Lei/);

    await digitar("xangô");
    match(tela.texto(), /Nenhum ponto com esse trecho aqui/);
  } finally {
    await limpar();
  }
});

test("a lista vazia SEM busca não é dita como resultado de busca", async () => {
  const vazio: AppData = { ...GRATIS, pontos: [] };
  const { tela, limpar } = await abrir(vazio, { plano: "gratis", acervoOrganizado: false });
  try {
    match(tela.texto(), /Nenhum ponto neste orixá ainda/);
    ok(
      !tela.texto().includes("esse trecho"),
      "culpou a busca por uma lista vazia que a pessoa não buscou",
    );
  } finally {
    await limpar();
  }
});
