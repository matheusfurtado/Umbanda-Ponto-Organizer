/**
 * "Fora do app" — o que saiu por não ter gravação de artista.
 *
 * O que se prende aqui é o que a tela promete a quem modera: que ela LISTA (a
 * desativação sem lista é perda silenciosa — ninguém confere o que não vê), que
 * ela agrupa pelo lugar no acervo, e que ela diz, na cara, que nada foi
 * apagado. A marca é reversível; uma tela que sugerisse exclusão faria quem
 * modera tratar um acervo litúrgico como perdido.
 */

import { deepEqual, match, ok } from "node:assert/strict";
import { test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaDesativados } from "@/pages/TelaDesativados";

function ponto(id: string, titulo: string, orixa: string, extra = {}) {
  return {
    id, titulo, letra: `letra de ${titulo}`, orixa,
    subcategoria: "Descarrego", candidatas: 0, temVideo: false,
    artistaNome: null, videoUrl: null, doYoutube: false, ...extra,
  };
}

const LISTA = [
  ponto("p1", "Ponto de Omulu", "Omulu", { candidatas: 3 }),
  ponto("p2", "Outro de Omulu", "Omulu"),
  ponto("p3", "Ponto de Ogum", "Ogum", { temVideo: true }),
  ponto("p4", "Trazido do YouTube", "Ogum", {
    doYoutube: true, artistaNome: "Juliana D Passos",
    videoUrl: "https://youtu.be/abc123",
  }),
];

async function abrir(resposta?: { status?: number; corpo?: unknown }) {
  const chamadas: string[] = [];
  const rede = fingirRede((url, init) => {
    chamadas.push(`${init?.method ?? "GET"} ${url}`);
    if (url.includes("/reativar")) return { status: 204 };
    if (url.includes("/admin/pontos-desativados")) return resposta ?? { corpo: LISTA };
    throw new Error(`chamada não prevista: ${url}`);
  });
  const { hook } = memoryLocation({ path: "/moderacao/desativados" });
  const tela = await renderizar(
    <Router hook={hook}>
      <TelaDesativados />
    </Router>,
  );
  await assentar();
  return {
    tela,
    chamadas,
    limpar: async () => {
      await tela.desmontar();
      rede.restaurar();
    },
  };
}

const grupos = (tela: Tela) => tela.todos("h2").map((h) => h.textContent?.trim());

test("agrupa por orixá, na ordem em que o servidor mandou", async () => {
  // A ordem do servidor é a litúrgica. A pergunta que se faz aqui é *que
  // pedaço do acervo está fora*, e isso se lê seguindo a hierarquia — uma fila
  // por data responderia "o que saiu por último", que ninguém perguntou.
  const { tela, limpar } = await abrir();
  try {
    deepEqual(grupos(tela), ["Omulu · 2", "Ogum · 2"]);
    match(tela.texto(), /Ponto de Omulu/);
    match(tela.texto(), /Ponto de Ogum/);
  } finally {
    await limpar();
  }
});

test("diz que nada foi apagado", async () => {
  // Não é decoração: a marca é reversível e o `--recriar` da semente já apagou
  // ponto aprovado pela comunidade neste projeto. Quem modera precisa saber
  // que está olhando uma lista de suspensos, não de perdidos.
  const { tela, limpar } = await abrir();
  try {
    match(tela.texto(), /não foram apagados/i);
  } finally {
    await limpar();
  }
});

test("aponta o caminho de volta para os que já têm palpite", async () => {
  // O que transforma a lista em trabalho: 1 dos 3 tem candidata esperando na
  // fila de casamento, e é de lá que sai a gravação que o traz de volta.
  const { tela, limpar } = await abrir();
  try {
    match(tela.texto(), /1 já têm palpite/);
    ok(
      tela.todos("a").some((a) => a.getAttribute("href") === "/moderacao/casamentos"),
      "sem link para a fila, a lista é um beco sem saída",
    );
    match(tela.texto(), /3 palpites de vídeo/);
    match(tela.texto(), /nenhum palpite de vídeo ainda/);
  } finally {
    await limpar();
  }
});

test("sem nada fora do app, a tela diz isso em vez de ficar em branco", async () => {
  const { tela, limpar } = await abrir({ corpo: [] });
  try {
    match(tela.texto(), /Nenhum ponto fora do app/);
    ok(tela.naoTem('[aria-busy="true"]'), "ficou carregando sobre resposta vazia");
  } finally {
    await limpar();
  }
});

test("falha ao carregar é dita com as palavras do servidor", async () => {
  const { tela, limpar } = await abrir({
    status: 503, corpo: { detail: "O acervo está em manutenção." },
  });
  try {
    match(tela.texto(), /em manutenção/);
    ok(tela.naoTem('[aria-busy="true"]'), "mostrou o erro e continuou girando");
    ok(!/API 503/.test(tela.texto()), "vazou o status para a tela");
  } finally {
    await limpar();
  }
});

test("o trazido do YouTube mostra o vídeo de onde a letra saiu", async () => {
  // Decidir sem ver de onde a letra veio é carimbar, não conferir. É a razão
  // de o botão existir só para esta metade da lista.
  const { tela, limpar } = await abrir();
  try {
    ok(
      tela.todos("a").some((a) => a.getAttribute("href") === "https://youtu.be/abc123"),
      "sem link do vídeo, a aprovação seria às cegas",
    );
    match(tela.texto(), /Letra trazida da descrição deste vídeo/);
    match(tela.texto(), /Juliana D Passos/);
  } finally {
    await limpar();
  }
});

test("só o trazido do YouTube ganha o botão de pôr no app", async () => {
  // O ponto que saiu por não ter artista continua sem botão: o caminho de
  // volta dele é GANHAR uma gravação, e um botão o devolveria mudo.
  const { tela, limpar } = await abrir();
  try {
    const botoes = tela
      .todos("button")
      .filter((b) => /Pôr no app/.test(b.textContent ?? ""));
    ok(
      botoes.length === 1,
      `esperava 1 botão (só o trazido do YouTube), achei ${botoes.length}`,
    );
  } finally {
    await limpar();
  }
});

test("aprovar chama a rota e tira a linha da lista", async () => {
  const { tela, chamadas, limpar } = await abrir();
  try {
    const botao = tela
      .todos("button")
      .find((b) => /Pôr no app/.test(b.textContent ?? ""));
    ok(botao, "não achei o botão");
    // `tela.clicar` e não `botao.click()`: o harness embrulha em `act`, e sem
    // isso o React avisa que a atualização de estado ficou fora do teste.
    await tela.clicar(botao!);
    await assentar();
    ok(
      chamadas.some((c) => c.includes("POST") && c.includes("/admin/pontos/p4/reativar")),
      `não chamou a rota de reativar: ${chamadas.join(", ")}`,
    );
    ok(!/Trazido do YouTube/.test(tela.texto()), "a linha continuou na lista");
  } finally {
    await limpar();
  }
});
