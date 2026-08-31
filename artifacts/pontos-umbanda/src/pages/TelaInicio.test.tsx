/**
 * A ordem da tela inicial — que é a decisão de produto que ela carrega.
 *
 * Cada seção aqui disputa a primeira tela de um celular segurado com uma mão
 * só, no meio de uma gira. O que fica embaixo, numa lista com 18 orixás acima,
 * não existe na prática — foi o que aconteceu com a prateleira de artistas na
 * primeira versão dela.
 */

import { deepEqual, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaInicio } from "@/pages/TelaInicio";
import { AppProvider } from "@/context";
import { AuthProvider } from "@/auth/AuthContext";
import { EntitlementsProvider } from "@/billing/EntitlementsContext";
import type { AppData } from "@/types";

beforeEach(() => localStorage.clear());

const EU = {
  id: "u1", email: "m@e.com", email_verificado: true,
  apelido: "maria", admin: false, foto: null, favoritos_publicos: false,
};

const ACERVO: AppData = {
  orixas: [
    { id: "ogum", nome: "Ogum", cor: "#c00", emoji: "⚔️", ordem: 0, tipo: "orixa" },
    { id: "pretos", nome: "Preto Velho", cor: "#333", emoji: "🕯️", ordem: 1, tipo: "linha" },
  ] as AppData["orixas"],
  subcategorias: [{ id: "s1", orixaId: "ogum", nome: "Chegada", ordem: 0, criadoEm: 0 }],
  pontos: [{
    id: "p1", subcategoriaId: "s1", orixaId: "ogum", titulo: "Ogum de Lei",
    letra: "l", favorito: true, ordem: 0, criadoEm: 0,
  }],
};

const ARTISTAS = [{ id: "a1", nome: "Canal do Terreiro", pontos: 3, seguidores: 0, curado: true }];

async function abrir({ logado = true } = {}) {
  localStorage.setItem("pontos-umbanda-data", JSON.stringify(ACERVO));
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) return logado ? { corpo: EU } : { status: 401, corpo: {} };
    if (url.includes("/meus-direitos")) return { corpo: { plano: "gratis", repertorios: false } };
    if (url.includes("/artistas")) return { corpo: ARTISTAS };
    if (url.includes("/acervo")) {
      return { corpo: { ...ACERVO, acesso: { acervoOrganizado: true }, versao: "v1" } };
    }
    throw new Error(`chamada não prevista: ${url}`);
  });
  const tela = await renderizar(
    <Router hook={memoryLocation({ path: "/" }).hook}>
      <AuthProvider>
        <EntitlementsProvider>
          <AppProvider>
            <TelaInicio
              onAbrirOrixa={() => {}}
              onAdicionar={() => {}}
              onSugerirAutor={() => {}}
            />
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

/** As seções na ordem em que a pessoa rola por elas. */
const secoes = (tela: Tela) =>
  tela.todos("section").map((s) => s.getAttribute("aria-label"));

test("Artistas vem ANTES dos orixás — foi para isso que ela subiu", async () => {
  // Embaixo, depois de 18 orixás, das linhas e dos momentos, a prateleira não
  // existia numa tela de celular.
  const { tela, limpar } = await abrir();
  try {
    const ordem = secoes(tela).filter((s): s is string => s !== null);
    const artistas = ordem.indexOf("Artistas");
    const orixas = ordem.indexOf("Orixás");
    ok(artistas >= 0, `a prateleira de artistas sumiu da tela inicial: ${ordem.join(", ")}`);
    ok(orixas >= 0, "o índice de orixás sumiu");
    ok(artistas < orixas, `Artistas voltou para baixo dos orixás: ${ordem.join(", ")}`);
  } finally {
    await limpar();
  }
});

test("mas os favoritos continuam em primeiro — é o atalho de quem está na gira", async () => {
  // Quem já separou os pontos não deve rolar por artista nenhum para achá-los.
  const { tela, limpar } = await abrir();
  try {
    const primeiro = tela.texto().indexOf("Seus favoritos");
    const artistas = tela.texto().indexOf("Artistas");
    ok(primeiro >= 0 && primeiro < artistas, "os favoritos caíram abaixo dos artistas");
  } finally {
    await limpar();
  }
});

test("sem conta, a seção de favoritos não aparece", async () => {
  // Favoritar virou coisa de conta; a prateleira sem sessão seria sempre vazia.
  const { tela, limpar } = await abrir({ logado: false });
  try {
    ok(!/Seus favoritos/.test(tela.texto()), "mostrou favoritos a quem não entrou");
    // E o resto da tela continua inteiro — o portão é só nos favoritos.
    deepEqual(
      secoes(tela).filter((s) => s === "Artistas" || s === "Orixás"),
      ["Artistas", "Orixás"],
    );
  } finally {
    await limpar();
  }
});
