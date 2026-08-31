/**
 * Os favoritos — e o que a tela promete sobre não perdê-los.
 *
 * A estrela é a única coisa que a pessoa cria sozinha no acervo do plano
 * grátis. Errar aqui não é errar uma lista: é fazer alguém achar que perdeu o
 * que marcou, ou achar que está guardado onde não está.
 */

import { deepEqual, equal, match, ok } from "node:assert/strict";
import { test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaFavoritos } from "@/pages/TelaFavoritos";
import { AppProvider } from "@/context";
import { AuthProvider } from "@/auth/AuthContext";
import { EntitlementsProvider } from "@/billing/EntitlementsContext";
import type { AppData, Ponto } from "@/types";

const EU = {
  id: "u1", email: "m@e.com", email_verificado: true,
  apelido: "m", admin: false, foto: null, favoritos_publicos: false,
};

function ponto(id: string, titulo: string, extra: Partial<Ponto> = {}): Ponto {
  return {
    id, titulo, subcategoriaId: "", letra: "l",
    favorito: false, ordem: 0, criadoEm: 0, ...extra,
  };
}

/**
 * Três orixás fora da ordem litúrgica no vetor, de propósito: é o vetor do
 * cache, e nada promete que ele chegue ordenado.
 */
const ACERVO: AppData = {
  orixas: [
    { id: "oxum", nome: "Oxum", cor: "#fc0", emoji: "💛", ordem: 2 },
    { id: "exu", nome: "Exu", cor: "#000", emoji: "🔱", ordem: 0 },
    { id: "ogum", nome: "Ogum", cor: "#c00", emoji: "⚔️", ordem: 1 },
  ] as AppData["orixas"],
  subcategorias: [{ id: "s-ogum", orixaId: "ogum", nome: "Chegada", ordem: 0, criadoEm: 0 }],
  pontos: [
    ponto("p1", "Ponto de Oxum", { orixaId: "oxum", favorito: true }),
    ponto("p2", "Ponto de Exu", { orixaId: "exu", favorito: true }),
    // Sem `orixaId`: o orixá vem da SUBCATEGORIA — é o caso do acervo que a
    // própria pessoa organizou.
    ponto("p3", "Ponto de Ogum", { subcategoriaId: "s-ogum", favorito: true }),
    ponto("p4", "Não marcado", { orixaId: "exu" }),
    ponto("p5", "Órfão marcado", { favorito: true }),
  ],
};

async function abrir(acervo: AppData | null, direitos: Record<string, unknown>, getFalha = false) {
  localStorage.clear();
  if (acervo) localStorage.setItem("pontos-umbanda-data", JSON.stringify(acervo));
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) return { corpo: EU };
    if (url.includes("/meus-direitos")) return { corpo: direitos };
    if (url.includes("/acervo")) {
      if (getFalha) throw new TypeError("Failed to fetch");
      return { corpo: { ...(acervo ?? ACERVO), acesso: { acervoOrganizado: true }, versao: "v1" } };
    }
    throw new Error(`chamada não prevista: ${url}`);
  });
  const { hook } = memoryLocation({ path: "/favoritos" });
  const tela = await renderizar(
    <Router hook={hook}>
      <AuthProvider>
        <EntitlementsProvider>
          <AppProvider>
            <TelaFavoritos />
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

const titulosDosGrupos = (tela: Tela) => tela.todos("h2").map((h) => h.textContent?.trim());

test("agrupa por orixá NA ORDEM DA GIRA, não na ordem em que foram marcados", async () => {
  // "Na ordem do acervo, que é litúrgica — não na ordem em que foram
  // favoritados, que não quer dizer nada para quem monta uma gira."
  const { tela, limpar } = await abrir(ACERVO, { plano: "mensal", sync: true });
  try {
    deepEqual(titulosDosGrupos(tela), ["Exu", "Ogum", "Oxum", "Sem orixá"]);
  } finally {
    await limpar();
  }
});

test("o ponto sem `orixaId` cai no orixá da subcategoria dele", async () => {
  // É o acervo que a PRÓPRIA pessoa organizou: a subcategoria é dela.
  const { tela, limpar } = await abrir(ACERVO, { plano: "mensal", sync: true });
  try {
    const ogum = tela.todos("section").find((s) => /Ogum/.test(s.textContent ?? ""));
    ok(ogum, "o grupo de Ogum não existe");
    match(ogum.textContent ?? "", /Ponto de Ogum/, "o ponto foi para o grupo errado");
  } finally {
    await limpar();
  }
});

test("só os marcados entram, e a contagem confere", async () => {
  const { tela, limpar } = await abrir(ACERVO, { plano: "mensal", sync: true });
  try {
    match(tela.texto(), /4 pontos marcados com a estrela/);
    ok(!tela.texto().includes("Não marcado"), "entrou ponto que ninguém favoritou");
  } finally {
    await limpar();
  }
});

test("a conta só é prometida a quem a tem", async () => {
  // Favorito é estado do acervo, e o acervo sobe pelo `PUT /acervo`, que exige
  // o direito `sync`. O plano grátis leva 402 — para essas pessoas o favorito
  // vive SÓ neste aparelho, e a frase prometia conta a todo mundo. É uma
  // promessa sobre não perder o que se marcou, dita a quem ainda vai decidir
  // se confia na estrela.
  const semNada: AppData = { ...ACERVO, pontos: [ponto("p9", "Nada marcado")] };

  const gratis = await abrir(semNada, { plano: "gratis", sync: false });
  try {
    ok(
      !/na sua conta\./.test(gratis.tela.texto()),
      `prometeu conta a quem não sincroniza: ${gratis.tela.texto().slice(0, 200)}`,
    );
    match(gratis.tela.texto(), /Ficam guardados neste aparelho/);
  } finally {
    await gratis.limpar();
  }

  const pago = await abrir(semNada, { plano: "mensal", sync: true });
  try {
    match(pago.tela.texto(), /neste aparelho e na sua conta/);
  } finally {
    await pago.limpar();
  }
});

test("sem favorito nenhum, convida — e não diz que algo deu errado", async () => {
  const semNada: AppData = { ...ACERVO, pontos: [ponto("p9", "Nada marcado")] };
  const { tela, limpar } = await abrir(semNada, { plano: "mensal", sync: true });
  try {
    match(tela.texto(), /Nenhum ponto favoritado ainda/);
    ok(tela.todos("a").some((a) => a.getAttribute("href") === "/"), "sem caminho de volta ao acervo");
    ok(tela.naoTem('[role="alert"]'), "tratou lista vazia como erro");
  } finally {
    await limpar();
  }
});

test("acervo que não carregou NÃO é dito como 'você não tem favoritos'", async () => {
  // "Dizer a primeira quando a verdade é a segunda faz a pessoa achar que
  // PERDEU o que marcou."
  const { tela, limpar } = await abrir(null, { plano: "mensal", sync: true }, true);
  try {
    const aviso = tela.exigir('[role="alert"]');
    match(aviso.textContent ?? "", /Não consegui carregar o acervo/);
    match(aviso.textContent ?? "", /nada foi perdido/i);
    ok(
      !tela.texto().includes("Nenhum ponto favoritado ainda"),
      "disse que ela não tem favoritos quando não deu para saber",
    );
  } finally {
    await limpar();
  }
});
