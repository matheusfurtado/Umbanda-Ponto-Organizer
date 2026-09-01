/**
 * Conferir casamento — o que a tela precisa ter junto para ninguém errar.
 *
 * Errar aqui é pôr o ponto de uma entidade no vídeo de outra. As três coisas
 * que decidem — o LUGAR do ponto, o começo da letra e o vídeo — ficam na mesma
 * linha de propósito.
 */

import { deepEqual, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaCasamentos } from "@/pages/TelaCasamentos";

beforeEach(() => localStorage.clear());

const caso = (over: Record<string, unknown> = {}) => ({
  id: 1, pontoId: "p1", titulo: "Se queres luz, oxalá quem dá...",
  letra: "Se queres luz, oxalá quem dá\nSe queres paz...",
  orixa: "Oxalá", subcategoria: "Louvação",
  artistaId: null, artistaNome: null,
  videoId: "abc", url: "https://youtu.be/abc",
  videoTitulo: "Ponto de Pomba Gira", canal: "Canal X",
  confianca: 0.55, principal: true, ...over,
});

async function abrir(
  fila: { status?: number; corpo?: unknown } = { corpo: [caso()] },
  quantos: unknown = { total: 390, principais: 156 },
) {
  const acoes: string[] = [];
  const rede = fingirRede((url, init) => {
    if (/\/(confirmar|recusar)$/.test(url)) {
      acoes.push(`${init?.method} ${url}`);
      return { status: 204 };
    }
    if (url.includes("/casamentos/quantos")) return { corpo: quantos };
    if (url.includes("/admin/casamentos")) return fila;
    throw new Error(`chamada não prevista: ${url}`);
  });
  const tela = await renderizar(<TelaCasamentos />);
  await assentar();
  return { tela, acoes, limpar: async () => { await tela.desmontar(); rede.restaurar(); } };
}

const botao = (tela: Tela, texto: RegExp) =>
  tela.todos("button").find((b) => texto.test(b.textContent ?? ""));

test("o LUGAR do ponto aparece em destaque — é o erro mais grave", async () => {
  // Ponto de Oxalá casado com vídeo de Pomba Gira é o erro mais comum, e só se
  // vê comparando o topo do ponto com o título do vídeo.
  const { tela, limpar } = await abrir();
  try {
    match(tela.texto(), /Oxalá · Louvação/);
    match(tela.texto(), /Ponto de Pomba Gira/);
  } finally {
    await limpar();
  }
});

test("letra, vídeo e link ficam na mesma linha da fila", async () => {
  const { tela, limpar } = await abrir();
  try {
    match(tela.texto(), /Se queres luz/);
    match(tela.texto(), /Canal X/);
    match(tela.texto(), /confiança 0\.55/);
    ok(tela.achar('a[href="https://youtu.be/abc"]'), "sem caminho para abrir o vídeo");
  } finally {
    await limpar();
  }
});

test("a tela avisa quando recusar deixa o ponto SEM link", async () => {
  // É o custo da decisão, e precisa estar visível antes do clique.
  const { tela, limpar } = await abrir({ corpo: [caso({ principal: true })] });
  try {
    // No ITEM, e não no texto da tela: o contador lá em cima também fala em
    // "sem link", e a asserção larga passava dos dois jeitos.
    match(tela.exigir("li").textContent ?? "", /deixa este ponto sem\s*link/i);
  } finally {
    await limpar();
  }
});

test("gravação de artista NÃO avisa isso — recusar não tira link de ninguém", async () => {
  const { tela, limpar } = await abrir({
    corpo: [caso({ principal: false, artistaNome: "Juliana D Passos" })],
  });
  try {
    ok(
      !/deixa este ponto sem/i.test(tela.exigir("li").textContent ?? ""),
      "avisou custo que não existe",
    );
    match(tela.texto(), /artista: Juliana D Passos/);
  } finally {
    await limpar();
  }
});

test("o contador separa o que custa link do acervo", async () => {
  const { tela, limpar } = await abrir();
  try {
    match(tela.texto(), /390/);
    match(tela.texto(), /156/);
    match(tela.texto(), /sem link enquanto esperam/);
  } finally {
    await limpar();
  }
});

test("decidir tira da lista na hora, sem recarregar tudo", async () => {
  // A fila tem centenas: recarregar a cada decisão faria a pessoa esperar por
  // decisão, e conferir 390 assim ninguém faz.
  const { tela, acoes, limpar } = await abrir();
  try {
    await tela.clicar(botao(tela, /É este ponto/)!);
    await assentar();
    deepEqual(acoes, ["POST /api/v1/admin/casamentos/1/confirmar"]);
    ok(!/Se queres luz/.test(tela.texto()), "o caso decidido continuou na tela");
    match(tela.texto(), /Nada para conferir/);
  } finally {
    await limpar();
  }
});

test("recusar chama a rota de recusar, e não a de confirmar", async () => {
  const { tela, acoes, limpar } = await abrir();
  try {
    await tela.clicar(botao(tela, /Não é/)!);
    await assentar();
    deepEqual(acoes, ["POST /api/v1/admin/casamentos/1/recusar"]);
  } finally {
    await limpar();
  }
});

test("fila vazia diz isso, e não fica carregando", async () => {
  const { tela, limpar } = await abrir({ corpo: [] });
  try {
    match(tela.texto(), /Nada para conferir/);
    ok(tela.naoTem('[aria-busy="true"]'), "continuou carregando sobre resposta vazia");
  } finally {
    await limpar();
  }
});

test("quem não é admin lê a resposta do servidor, e o esqueleto para", async () => {
  const { tela, limpar } = await abrir({ status: 404, corpo: {} });
  try {
    ok(/\S/.test(tela.texto()), "a tela ficou muda sobre a recusa");
    ok(tela.naoTem('[aria-busy="true"]'), "mostrou o erro e continuou girando");
  } finally {
    await limpar();
  }
});
