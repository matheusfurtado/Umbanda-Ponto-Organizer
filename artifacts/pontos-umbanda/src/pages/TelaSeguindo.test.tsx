/**
 * A biblioteca — a lista que **só a própria pessoa vê**.
 *
 * "Quem alguém segue num app de Umbanda é um mapa da rede religiosa dela, e o
 * servidor nem devolve os nomes para terceiros — só a contagem." Então o que
 * se prende aqui é o que a tela promete: a lista é dela, e cada metade se
 * vira sozinha quando a outra falha.
 */

import { deepEqual, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaSeguindo } from "@/pages/TelaSeguindo";

beforeEach(() => localStorage.clear());

const ARTISTAS = [
  { id: "a1", nome: "Canal do Terreiro", pontos: 12, seguidores: 3, curado: true },
];
const GENTE = [
  { apelido: "Pai João", foto: null, giras: 2 },
];

interface Cenario {
  artistas?: { status?: number; corpo?: unknown };
  gente?: { status?: number; corpo?: unknown };
}

async function abrir(c: Cenario = {}) {
  const rede = fingirRede((url) => {
    if (url.includes("/eu/artistas")) return c.artistas ?? { corpo: ARTISTAS };
    if (url.includes("/eu/seguindo")) return c.gente ?? { corpo: GENTE };
    throw new Error(`chamada não prevista: ${url}`);
  });
  const { hook } = memoryLocation({ path: "/seguindo" });
  const tela = await renderizar(
    <Router hook={hook}>
      <TelaSeguindo />
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

const links = (tela: Tela, prefixo: string) =>
  tela.todos(`a[href^='${prefixo}']`).map((a) => a.getAttribute("href"));

test("a tela diz, na cara, que ninguém mais vê esta lista", async () => {
  // Não é decoração: é a única coisa que responde a pergunta que a pessoa faz
  // antes de seguir alguém num app que revela religião.
  const { tela, limpar } = await abrir();
  try {
    match(tela.texto(), /Ninguém mais vê quem você segue/);
  } finally {
    await limpar();
  }
});

test("artistas e pessoas aparecem, cada um levando ao seu lugar", async () => {
  const { tela, limpar } = await abrir();
  try {
    deepEqual(links(tela, "/artista/"), ["/artista/a1"]);
    deepEqual(links(tela, "/perfil/"), ["/perfil/Pai%20Jo%C3%A3o"]);
    match(tela.texto(), /12 pontos/);
    match(tela.texto(), /2 playlists públicas/);
  } finally {
    await limpar();
  }
});

test("uma metade que falha não leva a outra junto", async () => {
  // "Artista vem primeiro: é a metade que tem conteúdo do primeiro dia,
  // enquanto seguir gente depende de a comunidade existir."
  const { tela, limpar } = await abrir({
    gente: { status: 500, corpo: { detail: "estourou" } },
  });
  try {
    deepEqual(links(tela, "/artista/"), ["/artista/a1"], "a lista de artistas sumiu junto");
  } finally {
    await limpar();
  }
});

test("a metade que falhou para de fingir que está carregando", async () => {
  // Mesmo defeito da vitrine: o esqueleto olhava só para `null`, e `null` é o
  // que sobra quando a busca falha — os cartões fantasmas animavam ao lado da
  // mensagem de erro, indefinidamente.
  const { tela, limpar } = await abrir({
    gente: { status: 500, corpo: { detail: "Não consegui carregar." } },
  });
  try {
    match(tela.texto(), /Não consegui carregar/);
    ok(tela.naoTem('[aria-busy="true"]'), "mostrou o erro e continuou girando");
  } finally {
    await limpar();
  }
});

test("quem não segue ninguém recebe um caminho, não um vazio", async () => {
  const { tela, limpar } = await abrir({
    artistas: { corpo: [] },
    gente: { corpo: [] },
  });
  try {
    match(tela.texto(), /não segue nenhum artista/i);
    match(tela.texto(), /não segue ninguém/i);
    // E os dois caminhos de saída, que é o que transforma o vazio em convite.
    ok(tela.todos("a").some((a) => a.getAttribute("href") === "/artistas"));
    ok(tela.todos("a").some((a) => a.getAttribute("href") === "/giras-publicas"));
    ok(tela.naoTem('[aria-busy="true"]'), "ficou carregando sobre resposta vazia");
  } finally {
    await limpar();
  }
});
