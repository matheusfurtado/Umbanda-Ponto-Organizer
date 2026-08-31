/**
 * O que cada barra oferece, e para quem.
 *
 * Nenhuma das duas tinha teste, e elas são o índice do app inteiro: item que
 * aparece para quem não pode usá-lo vira promessa quebrada em toda abertura.
 */

import { deepEqual, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { BarraLateral } from "@/componentes/BarraLateral";
import { BarraInferior } from "@/componentes/BarraInferior";
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
  orixas: [{ id: "ogum", nome: "Ogum", cor: "#c00", emoji: "⚔️", ordem: 0 }] as AppData["orixas"],
  subcategorias: [],
  pontos: [{
    id: "p1", subcategoriaId: "s1", titulo: "Ogum de Lei",
    letra: "l", favorito: true, ordem: 0, criadoEm: 0,
  }],
};

async function abrir(Barra: typeof BarraLateral, logado: boolean) {
  localStorage.setItem("pontos-umbanda-data", JSON.stringify(ACERVO));
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) return logado ? { corpo: EU } : { status: 401, corpo: {} };
    if (url.includes("/meus-direitos")) return { corpo: { plano: "gratis", repertorios: false } };
    if (url.includes("/acervo")) return { corpo: { ...ACERVO, acesso: {}, versao: "v1" } };
    throw new Error(`chamada não prevista: ${url}`);
  });
  const tela = await renderizar(
    <Router hook={memoryLocation({ path: "/" }).hook}>
      <AuthProvider>
        <EntitlementsProvider>
          <AppProvider>
            <Barra onTrocarPaleta={() => {}} />
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

const destinos = (tela: Tela) =>
  tela.todos("a").map((a) => a.getAttribute("href"));

for (const [nome, Barra] of [
  ["lateral", BarraLateral],
  ["inferior", BarraInferior],
] as const) {
  test(`barra ${nome}: sem conta, Favoritos NÃO é oferecido`, async () => {
    // A lista de favoritos é da conta. Sem sessão ela é sempre vazia — e um
    // item de menu que abre uma tela vazia todas as vezes é pior que a ausência
    // dele. No celular custa ainda mais: é um quinto da navegação inteira.
    const { tela, limpar } = await abrir(Barra, false);
    try {
      ok(
        !destinos(tela).includes("/favoritos"),
        `ofereceu Favoritos a quem não entrou: ${destinos(tela).join(", ")}`,
      );
    } finally {
      await limpar();
    }
  });

  test(`barra ${nome}: com conta, Favoritos volta`, async () => {
    const { tela, limpar } = await abrir(Barra, true);
    try {
      ok(
        destinos(tela).includes("/favoritos"),
        `escondeu Favoritos de quem entrou: ${destinos(tela).join(", ")}`,
      );
    } finally {
      await limpar();
    }
  });
}

test("a barra lateral continua aberta ao que é de todo mundo", async () => {
  // O portão é só no Favoritos. Artistas, novidades e a comunidade são a porta
  // de entrada de quem ainda não tem conta — é por elas que alguém decide ter.
  const { tela, limpar } = await abrir(BarraLateral, false);
  try {
    const abertos = destinos(tela).filter((h): h is string => h !== null);
    deepEqual(
      ["/", "/buscar", "/novidades", "/giras-publicas", "/artistas"].filter((r) => abertos.includes(r)),
      ["/", "/buscar", "/novidades", "/giras-publicas", "/artistas"],
      `sumiu algo que é de todo mundo: ${abertos.join(", ")}`,
    );
  } finally {
    await limpar();
  }
});

test("a lateral leva a 'Meus artistas' com esse nome, e só para quem entrou", async () => {
  // Chamava-se "Biblioteca": exato e sem serventia — ninguém procura
  // "biblioteca" atrás do artista que acabou de seguir. E é de quem tem conta:
  // sem sessão a lista é sempre vazia.
  const comConta = await abrir(BarraLateral, true);
  try {
    const item = comConta.tela
      .todos("a")
      .find((a) => a.getAttribute("href") === "/seguindo");
    ok(item, "sumiu o caminho para os artistas que a pessoa segue");
    ok(
      /Meus artistas/.test(item.textContent ?? ""),
      `o item voltou a se chamar "${item.textContent?.trim()}"`,
    );
  } finally {
    await comConta.limpar();
  }

  const semConta = await abrir(BarraLateral, false);
  try {
    ok(
      !destinos(semConta.tela).includes("/seguindo"),
      "ofereceu a lista de seguidos a quem não entrou",
    );
  } finally {
    await semConta.limpar();
  }
});
