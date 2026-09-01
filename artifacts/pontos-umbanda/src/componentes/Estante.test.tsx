/**
 * A estante — a `/organizar` que nasce vazia.
 *
 * ADR 0009: *"o organizar acervo tem que nascer vazio, e assim que eu clicar
 * seja em um orixá/playlist e em curtir, ele aparece em organizar acervo,
 * seria uma biblioteca de playlist, algo parecido como o meus artistas, só que
 * com playlist"*.
 */

import { deepEqual, match, ok } from "node:assert/strict";
import { test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { Estante } from "@/componentes/Estante";

const GUARDADOS = [
  { alvoTipo: "orixa", alvoId: "ogum", nome: "Ogum", pontos: 30, de: null, ordem: 0 },
  {
    alvoTipo: "playlist", alvoId: "g1", nome: "Gira de sexta",
    pontos: 12, de: "Pai João", ordem: 1,
  },
];

async function abrir(itens: unknown = GUARDADOS) {
  const chamadas: string[] = [];
  const rede = fingirRede((url, init) => {
    if (url.includes("/eu/biblioteca")) {
      chamadas.push(`${init?.method ?? "GET"} ${url}`);
      if ((init?.method ?? "GET") === "GET") return { corpo: itens };
      return { status: 204 };
    }
    throw new Error(`chamada não prevista: ${url}`);
  });
  const tela = await renderizar(
    <Router hook={memoryLocation({ path: "/organizar" }).hook}>
      <Estante />
    </Router>,
  );
  await assentar();
  return {
    tela, chamadas,
    limpar: async () => { await tela.desmontar(); rede.restaurar(); },
  };
}

const botao = (tela: Tela, texto: RegExp) =>
  tela.todos("button").filter((b) => texto.test(b.textContent ?? ""));

test("vazia é o estado NORMAL, e a tela diz o que fazer", async () => {
  // "O organizar acervo tem que nascer vazio." Uma estante vazia e muda faria
  // parecer defeito, quando é o começo previsto.
  const { tela, limpar } = await abrir([]);
  try {
    match(tela.texto(), /está vazia — e é assim que ela começa/);
    const saidas = tela.todos("a").map((a) => a.getAttribute("href"));
    ok(saidas.includes("/"), "sem caminho para os orixás");
    ok(saidas.includes("/giras-publicas"), "sem caminho para as playlists");
    ok(tela.naoTem('[aria-busy="true"]'), "ficou carregando sobre estante vazia");
  } finally {
    await limpar();
  }
});

test("mostra orixá e playlist, cada um levando ao seu lugar", async () => {
  const { tela, limpar } = await abrir();
  try {
    const links = tela.todos("a").map((a) => a.getAttribute("href"));
    ok(links.includes("/orixa/ogum"), `sem link para o orixá: ${links}`);
    ok(links.includes("/gira/g1"), `sem link para a playlist: ${links}`);
    match(tela.texto(), /Ogum/);
    match(tela.texto(), /Gira de sexta/);
  } finally {
    await limpar();
  }
});

test("a contagem vem do servidor, e diz de quem é a playlist alheia", async () => {
  // Guardar é REFERÊNCIA: a playlist pode ter mudado desde que foi guardada.
  // Congelar o número na hora de guardar reproduziria o defeito do acervo
  // copiado, que envelhece sozinho.
  const { tela, limpar } = await abrir();
  try {
    match(tela.texto(), /30 pontos/);
    match(tela.texto(), /de Pai João/);
  } finally {
    await limpar();
  }
});

test("tirar chama a rota do item certo e o remove da lista", async () => {
  const { tela, chamadas, limpar } = await abrir();
  try {
    await tela.clicar(botao(tela, /Tirar/)[1]);
    await assentar();
    ok(
      chamadas.some((c) => c.includes("DELETE") && c.includes("/playlist/g1")),
      `chamou a rota errada: ${chamadas.join(" | ")}`,
    );
    ok(!/Gira de sexta/.test(tela.texto()), "o item tirado continuou na tela");
    match(tela.texto(), /Ogum/);
  } finally {
    await limpar();
  }
});

test("falha ao carregar é dita com as palavras do servidor", async () => {
  const rede = fingirRede(() => ({
    status: 503, corpo: { detail: "O acervo está em manutenção." },
  }));
  const tela = await renderizar(
    <Router hook={memoryLocation({ path: "/organizar" }).hook}>
      <Estante />
    </Router>,
  );
  await assentar();
  try {
    match(tela.texto(), /em manutenção/);
    ok(tela.naoTem('[aria-busy="true"]'), "mostrou o erro e continuou girando");
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});

test("um item só não vira '1 pontos'", async () => {
  const { tela, limpar } = await abrir([
    { alvoTipo: "orixa", alvoId: "x", nome: "X", pontos: 1, de: null, ordem: 0 },
  ]);
  try {
    // `· 1 ponto` e não `/1 ponto\b/`: o `textContent` cola os elementos, e o
    // texto sai "1 pontoTirar" — entre `o` e `T` não há fronteira de palavra.
    // A primeira versão deste caso falhava por isso, apontando para o plural.
    match(tela.texto(), /· 1 ponto/);
    ok(!/1 pontos/.test(tela.texto()), "escreveu '1 pontos'");
  } finally {
    await limpar();
  }
});
