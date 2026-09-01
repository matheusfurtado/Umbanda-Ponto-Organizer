/**
 * "Fora do app" — duas pilhas com problemas opostos.
 *
 * Trazidos do YouTube TÊM letra, vídeo e artista, e esperam alguém olhar. Do
 * acervo, não têm gravação nenhuma e esperam um vídeo aparecer. A tela dizia
 * "Pontos sem nenhuma gravação de artista" para os dois — falso para 809 das
 * 1.031 linhas —, mandava tudo numa lista só, sem filtro, sem descarte e com a
 * letra cortada em 240 caracteres.
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

const DO_YT = (id: string, titulo: string, artista = "Juliana D Passos") =>
  ponto(id, titulo, "Ogum", {
    doYoutube: true, artistaNome: artista,
    videoUrl: `https://youtu.be/${id}`,
  });

const CONTAS = {
  total: 4, youtube: 2, acervo: 2,
  artistas: [{ id: "juliana", nome: "Juliana D Passos", quantos: 2 }],
};

const LISTA = [
  ponto("p1", "Ponto de Omulu", "Omulu"),
  ponto("p2", "Outro de Omulu", "Omulu", { candidatas: 3 }),
  DO_YT("yt:a", "Trazido A"),
  DO_YT("yt:b", "Trazido B"),
];

/** Um servidor que respeita filtro, deslocamento e as decisões tomadas. */
function servidor(itens = LISTA, contas: unknown = CONTAS) {
  const fora = new Set<string>();
  const pedidos: string[] = [];
  const rede = fingirRede((url, init) => {
    if (url.includes("/pontos-desativados/quantos")) return { corpo: contas };
    if (url.includes("/em-lote")) {
      const corpo = JSON.parse(String(init?.body ?? "{}"));
      const validos = (corpo.ids as string[]).filter((i) => !fora.has(i));
      validos.forEach((i) => fora.add(i));
      return { corpo: { feitos: validos.length, pedidos: corpo.ids.length } };
    }
    const decisao = /\/admin\/pontos\/([^/]+)\/(reativar|descartar)$/.exec(url);
    if (decisao) {
      fora.add(decodeURIComponent(decisao[1]));
      return { status: 204 };
    }
    if (url.includes("/admin/pontos-desativados")) {
      pedidos.push(url);
      const q = new URL(url, "http://t").searchParams;
      const desde = Number(q.get("desde") ?? 0);
      let vivos = itens.filter((p) => !fora.has(p.id));
      if (q.get("origem") === "youtube") vivos = vivos.filter((p) => p.doYoutube);
      if (q.get("origem") === "acervo") vivos = vivos.filter((p) => !p.doYoutube);
      if (q.get("artista")) vivos = vivos.filter((p) => p.artistaNome !== null);
      const busca = q.get("busca");
      if (busca) vivos = vivos.filter((p) => p.titulo.includes(busca));
      return { corpo: vivos.slice(desde, desde + 50) };
    }
    throw new Error(`chamada não prevista: ${url}`);
  });
  return { rede, pedidos };
}

async function abrir(itens = LISTA, contas: unknown = CONTAS) {
  const { rede, pedidos } = servidor(itens, contas);
  const { hook } = memoryLocation({ path: "/moderacao/desativados" });
  const tela = await renderizar(
    <Router hook={hook}>
      <TelaDesativados />
    </Router>,
  );
  await assentar();
  return {
    tela, pedidos,
    limpar: async () => { await tela.desmontar(); rede.restaurar(); },
  };
}

const botao = (tela: Tela, texto: RegExp) =>
  tela.todos("button").filter((b) => texto.test(b.textContent ?? ""));

test("o cabeçalho não afirma mais que ninguém tem gravação", async () => {
  // Dizia "Pontos sem nenhuma gravação de artista" para a lista inteira, e era
  // falso para 809 das 1.031 linhas: as trazidas TÊM artista, e é por isso que
  // estão esperando conferência.
  const { tela, limpar } = await abrir();
  try {
    ok(
      !/sem nenhuma gravação de artista/i.test(tela.texto()),
      "o cabeçalho voltou a afirmar isso da lista inteira",
    );
    match(tela.texto(), /Trazidos do YouTube \(2\)/);
    match(tela.texto(), /Do acervo, sem artista \(2\)/);
  } finally {
    await limpar();
  }
});

test("dá para trabalhar um artista por vez, e trocar de filtro recomeça", async () => {
  const { tela, pedidos, limpar } = await abrir();
  try {
    const seletor = tela.todos("select")[0];
    ok(seletor, "sem seletor de artista não dá para conferir canal a canal");
    await tela.mudar(seletor, "juliana");
    ok(
      pedidos.some((u) => u.includes("artista=juliana")),
      `não pediu filtrado por artista: ${pedidos.join(" | ")}`,
    );
    // E recomeça do zero: pedir com `desde` de uma lista antiga traria o
    // pedaço errado do resultado novo.
    ok(
      pedidos.some((u) => u.includes("artista=juliana") && !u.includes("desde=")),
      "o filtro novo não recomeçou a lista",
    );
  } finally {
    await limpar();
  }
});

test("só o trazido do YouTube tem 'Pôr no app' e 'Descartar'", async () => {
  // O ponto do acervo não tem os dois: devolvê-lo mudo reporia o que o tirou de
  // lá, e descartá-lo seria usar esta tela para apagar acervo litúrgico.
  const { tela, limpar } = await abrir();
  try {
    deepEqual(botao(tela, /Pôr no app/).length, 2);
    deepEqual(botao(tela, /Descartar/).length, 2);
    deepEqual(tela.todos("input[type=checkbox]").length, 2);
  } finally {
    await limpar();
  }
});

test("descartar tira da lista — é o que faltava para a fila andar", async () => {
  // O extrator acerta 89%: cerca de um em nove é crédito ou recado no lugar do
  // verso. Sem descarte esse item ficava na lista para sempre.
  const { tela, limpar } = await abrir();
  try {
    await tela.clicar(botao(tela, /Descartar/)[0]);
    await assentar();
    ok(!/Trazido A/.test(tela.texto()), "o descartado continuou na tela");
    match(tela.texto(), /Trazido B/);
  } finally {
    await limpar();
  }
});

test("marcar vários e decidir de uma vez", async () => {
  const { tela, limpar } = await abrir();
  try {
    for (const caixa of tela.todos("input[type=checkbox]")) {
      await tela.clicar(caixa);
    }
    await assentar();
    match(tela.texto(), /2 marcados/);
    const emLote = botao(tela, /Pôr no app/).at(0);
    ok(emLote, "sem ação em lote");
    await tela.clicar(emLote!);
    await assentar();
    ok(!/Trazido A/.test(tela.texto()) && !/Trazido B/.test(tela.texto()),
       "o lote não tirou os marcados da lista");
  } finally {
    await limpar();
  }
});

test("a letra vem inteira, não cortada", async () => {
  // Vinha em 240 caracteres e 493 das 692 são maiores — 71% das aprovações
  // eram feitas vendo um pedaço, sendo que o entulho do extrator costuma estar
  // justamente no fim do bloco.
  const longa = "verso ".repeat(80).trim();
  const { tela, limpar } = await abrir([DO_YT("yt:c", "Longa")].map(
    (p) => ({ ...p, letra: longa }),
  ));
  try {
    ok(tela.texto().includes(longa), "a letra chegou cortada à tela");
  } finally {
    await limpar();
  }
});

test("sem nada com o filtro, diz isso em vez de ficar carregando", async () => {
  const { tela, limpar } = await abrir([], { total: 0, youtube: 0, acervo: 0, artistas: [] });
  try {
    match(tela.texto(), /Nada aqui com esse filtro/);
    ok(tela.naoTem('[aria-busy="true"]'), "ficou carregando sobre lista vazia");
  } finally {
    await limpar();
  }
});
