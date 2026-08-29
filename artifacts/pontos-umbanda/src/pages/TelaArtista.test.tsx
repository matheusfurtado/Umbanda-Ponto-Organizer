/**
 * Trocar de artista sem sair da página — o cenário do achado #14.
 *
 * O `Route path="/artista/:id"` NÃO remonta o componente quando só o parâmetro
 * muda. Tudo que é sobre o artista anterior precisa ser zerado à mão, e
 * esquecer um estado não dá erro: dá a tela do outro artista.
 *
 * Isto não tinha como ser testado antes — é efeito de React reagindo a uma
 * prop de rota, exatamente o que uma suíte sem renderizador não alcança.
 */

import { equal, match, ok } from "node:assert/strict";
import { test } from "node:test";
import { act } from "react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { renderizar } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaArtista } from "@/pages/TelaArtista";
import type { Artista, PontoDoArtista } from "@/api/artista";

function ponto(id: string, orixaId: string, titulo: string): PontoDoArtista {
  return {
    id, titulo,
    orixa: orixaId === "ogum" ? "Ogum" : "Oxum",
    orixaId,
    orixaEmoji: orixaId === "ogum" ? "⚔️" : "💛",
    orixaCor: "#c00",
    orixaTipo: "orixa",
    letra: "l",
    cliques: 0,
    videoUrl: null,
    videoStatus: null,
  };
}

function artista(id: string, nome: string, pontos: PontoDoArtista[]): Artista {
  return {
    id, nome, pontos: pontos.length, seguidores: 0, curado: false,
    canalUrl: null, bio: null, foto: null,
    possoEditar: false, seguindo: null,
    pontosDoArtista: pontos,
  };
}

/** Só de Ogum. */
const ANA = artista("ana", "Ana do Terreiro", [
  ponto("a1", "ogum", "Ogum de Lei"),
  ponto("a2", "ogum", "Ogum Megê"),
]);
/** Só de Oxum — NENHUM ponto de Ogum. É esse o par que expõe o defeito. */
const BENTO = artista("bento", "Bento Cantador", [
  ponto("b1", "oxum", "Oxum de Ouro"),
]);

const ACERVO: Record<string, Artista> = { ana: ANA, bento: BENTO };

function montar(inicio: string) {
  const { hook, navigate } = memoryLocation({ path: inicio, record: true });
  return { hook, navigate };
}

test("o filtro do artista anterior não atravessa para o próximo", async () => {
  const rede = fingirRede((url) => {
    const id = url.split("/artistas/")[1];
    return { corpo: ACERVO[id] };
  });
  try {
    const { hook, navigate } = montar("/artista/ana");
    const tela = await renderizar(
      <Router hook={hook}>
        <TelaArtista />
      </Router>,
    );
    match(tela.texto(), /Ana do Terreiro/);

    // Filtra por Ogum — entidade que a Ana tem e o Bento não.
    const chipOgum = tela
      .todos("button[aria-pressed]")
      .find((b) => b.textContent?.includes("Ogum"));
    ok(chipOgum, `não achei o chip de Ogum em: ${tela.texto()}`);
    await tela.clicar(chipOgum);
    equal(chipOgum.getAttribute("aria-pressed"), "true");
    match(tela.texto(), /Ogum de Lei/);

    // Troca de artista SEM sair da rota: só a URL muda, o componente fica.
    await act(async () => {
      navigate("/artista/bento");
    });

    match(tela.texto(), /Bento Cantador/, "não carregou o segundo artista");
    match(
      tela.texto(),
      /Oxum de Ouro/,
      "a página do Bento veio VAZIA: o filtro de Ogum atravessou, e como " +
        "`pontosDoArtista.length` não é zero o estado de vazio também não apareceu",
    );
    const todos = tela
      .todos("button[aria-pressed]")
      .find((b) => b.textContent?.trim().startsWith("Todos"));
    equal(todos?.getAttribute("aria-pressed"), "true", "o chip aceso é do artista que saiu");
    await tela.desmontar();
  } finally {
    rede.restaurar();
  }
});

test("a resposta atrasada do primeiro artista não escreve na tela do segundo", async () => {
  let soltarAna: (() => void) | null = null;
  const rede = fingirRede(async (url) => {
    const id = url.split("/artistas/")[1];
    if (id === "ana") {
      await new Promise<void>((resolver) => {
        soltarAna = resolver;
      });
    }
    return { corpo: ACERVO[id] };
  });
  try {
    const { hook, navigate } = montar("/artista/ana");
    const tela = await renderizar(
      <Router hook={hook}>
        <TelaArtista />
      </Router>,
    );
    // A Ana ainda não respondeu: a tela está no esqueleto.
    ok(tela.achar('[aria-busy="true"]'), "devia estar carregando");

    await act(async () => {
      navigate("/artista/bento");
    });
    match(tela.texto(), /Bento Cantador/);

    // AGORA a Ana responde, atrasada.
    await act(async () => {
      soltarAna?.();
      await new Promise((r) => setTimeout(r, 0));
    });

    match(tela.texto(), /Bento Cantador/, "a resposta velha da Ana venceu a do Bento");
    ok(
      !tela.texto().includes("Ana do Terreiro"),
      "o artista A ficou embaixo da URL do artista B",
    );
    await tela.desmontar();
  } finally {
    rede.restaurar();
  }
});

test("artista sem ponto nenhum DIZ isso, em vez de ficar em branco", async () => {
  const rede = fingirRede(() => ({ corpo: artista("vazio", "Canal Novo", []) }));
  try {
    const { hook } = montar("/artista/vazio");
    const tela = await renderizar(
      <Router hook={hook}>
        <TelaArtista />
      </Router>,
    );
    match(tela.texto(), /Nenhum ponto ligado a este artista/);
    await tela.desmontar();
  } finally {
    rede.restaurar();
  }
});

test("falha ao carregar tem mensagem E saída, não uma tela morta", async () => {
  const rede = fingirRede(() => ({ status: 404, corpo: { detail: "Artista não encontrado." } }));
  try {
    const { hook } = montar("/artista/fantasma");
    const tela = await renderizar(
      <Router hook={hook}>
        <TelaArtista />
      </Router>,
    );
    const aviso = tela.exigir('[role="alert"]');
    match(aviso.textContent ?? "", /Artista não encontrado/);
    // A saída importa tanto quanto o aviso: erro sem caminho de volta é beco.
    const volta = tela.todos("a").find((a) => a.getAttribute("href") === "/artistas");
    ok(volta, `sem link de volta em: ${tela.html()}`);
    await tela.desmontar();
  } finally {
    rede.restaurar();
  }
});

test("o link do vídeo aparece SEM plano — é a exceção do ADR 0007", async () => {
  // Deliberado, e por isso frágil: quem for fechar o portão do vídeo um dia vai
  // passar por aqui achando que achou um furo. A página do artista manda
  // `videoUrl` para todo mundo; o que continua pago é a ORDEM litúrgica.
  const comVideo = artista("ana", "Ana do Terreiro", [
    { ...ponto("a1", "ogum", "Ogum de Lei"), videoUrl: "https://youtu.be/x", videoStatus: "encontrado" },
  ]);
  const rede = fingirRede(() => ({ corpo: comVideo }));
  try {
    const { hook } = montar("/artista/ana");
    const tela = await renderizar(
      <Router hook={hook}>
        <TelaArtista />
      </Router>,
    );
    const ouvir = tela.todos("a").find((a) => a.getAttribute("href") === "https://youtu.be/x");
    ok(ouvir, "o link do vídeo sumiu da página do artista (ver ADR 0007)");
    await tela.desmontar();
  } finally {
    rede.restaurar();
  }
});
