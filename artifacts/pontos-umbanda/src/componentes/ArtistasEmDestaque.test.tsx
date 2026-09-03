/**
 * Artistas na tela inicial.
 *
 * A seção existia só na barra lateral — que não existe no celular. Quem abre o
 * app no telefone, que é como se usa isto no meio de uma gira, não tinha
 * caminho nenhum para a página de artista.
 */

import { deepEqual, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { ArtistasEmDestaque } from "@/componentes/ArtistasEmDestaque";

beforeEach(() => localStorage.clear());

const artista = (i: number) => ({
  id: `a${i}`, nome: `Canal ${i}`, pontos: i, seguidores: 0, curado: true,
});

async function abrir(resposta: { status?: number; corpo?: unknown }) {
  const rede = fingirRede((url) => {
    if (url.includes("/artistas")) return resposta;
    throw new Error(`chamada não prevista: ${url}`);
  });
  const tela = await renderizar(
    <Router hook={memoryLocation({ path: "/" }).hook}>
      <ArtistasEmDestaque />
    </Router>,
  );
  await assentar();
  return {
    tela,
    limpar: async () => {
      await tela.desmontar();
      rede.restaurar();
    },
  };
}

const destinos = (tela: Tela) => tela.todos("a").map((a) => a.getAttribute("href"));

test("mostra os artistas, cada um levando à página dele", async () => {
  const { tela, limpar } = await abrir({ corpo: [artista(1), artista(2)] });
  try {
    deepEqual(destinos(tela), ["/artista/a1", "/artista/a2"]);
    match(tela.texto(), /Canal 1/);
    // Singular e plural: "1 pontos" numa vitrine é o tipo de detalhe que faz o
    // resto parecer descuidado.
    match(tela.texto(), /1 ponto(?!s)/);
    match(tela.texto(), /2 pontos/);
  } finally {
    await limpar();
  }
});

test("com muitos, mostra dez e a saída para os outros", async () => {
  // "A saída existe justamente para o décimo primeiro não desaparecer do app"
  // — a mesma lição da seção de favoritos, que sem ela escondia o nono.
  const { tela, limpar } = await abrir({ corpo: Array.from({ length: 14 }, (_, i) => artista(i + 1)) });
  try {
    const naPrateleira = destinos(tela).filter((h) => h?.startsWith("/artista/")).length;
    ok(naPrateleira === 10, `mostrou ${naPrateleira} em vez de dez`);
    ok(destinos(tela).includes("/artistas"), "os outros quatro sumiram do app");
    // A saída é o TÍTULO, e não um "ver mais" solto na ponta direita da linha.
    // Ele ficava longe do que abre, sublinhado, sem nada por perto explicando
    // o que ampliava — *"esse ver mais ali tá muito feio"*.
    //
    // O que se cobra é a saída existir e ser o título, não o texto dela.
    const titulo = tela
      .todos("a")
      .find((a) => a.getAttribute("href") === "/artistas");
    ok(titulo, "não há saída para os outros artistas");
    match(titulo!.textContent ?? "", /Artistas/);
    // E o rótulo não conta: o número envelhece a cada canal novo, e não ajuda
    // ninguém a decidir se vale tocar.
    ok(!/ver todos os \d/.test(tela.texto()), "o rótulo voltou a contar os artistas");
  } finally {
    await limpar();
  }
});

test("a prateleira rola SOZINHA — a página não rola de lado por causa dela", async () => {
  // Dez avatares não cabem numa tela de celular. Se o transbordo vazasse para
  // a página, o acervo inteiro passaria a rolar na horizontal — o mesmo
  // defeito que o `min-w-0` do `<main>` existe para evitar.
  const { tela, limpar } = await abrir({ corpo: Array.from({ length: 14 }, (_, i) => artista(i + 1)) });
  try {
    const faixa = tela.todos("div").find((d) =>
      (d.getAttribute("class") ?? "").includes("overflow-x-auto"));
    ok(faixa, "a prateleira não tem rolagem própria");
  } finally {
    await limpar();
  }
});

test("a inicial do artista vira o avatar, com cor estável", async () => {
  // A cor sai do nome (`lib/matiz.ts`), a mesma regra da capa das playlists:
  // cor sorteada a cada render faria a lista piscar e destruiria a memória
  // visual que o avatar existe para criar.
  const { tela, limpar } = await abrir({ corpo: [artista(1)] });
  try {
    // Pelo ELEMENTO que carrega a cor, e não pelo primeiro `span` com a letra:
    // o de fora é só um embrulho de centralização, e a asserção passava por
    // sorte de ordem no DOM.
    const avatar = tela
      .todos("span")
      .find((s) => /hsl\(/.test(s.getAttribute("style") ?? ""));
    ok(avatar, "o avatar saiu sem cor derivada do nome");
    ok(avatar.textContent === "C", `mostrou "${avatar.textContent}" em vez da inicial`);
  } finally {
    await limpar();
  }
});

test("com poucos, não oferece 'ver todos' — não há outros", async () => {
  const { tela, limpar } = await abrir({ corpo: [artista(1)] });
  try {
    ok(!destinos(tela).includes("/artistas"), "prometeu uma lista maior que não existe");
  } finally {
    await limpar();
  }
});

test("enquanto carrega, diz que está carregando", async () => {
  // Regra da fase 1: todo estado de rede precisa de carregando/erro/vazio.
  const { tela, limpar } = await abrir({ corpo: [] });
  try {
    ok(tela.naoTem('[aria-busy="true"]'), "continuou carregando depois de responder");
  } finally {
    await limpar();
  }
});

test("acervo sem artista nenhum: a seção some, e não fica um título vazio", async () => {
  const { tela, limpar } = await abrir({ corpo: [] });
  try {
    ok(!/Artistas/.test(tela.texto()), `sobrou um título sem nada embaixo: ${tela.texto()}`);
  } finally {
    await limpar();
  }
});

test("se a busca falha, a seção SOME — o acervo é o que a pessoa veio ver", async () => {
  // Uma faixa vermelha no meio da tela inicial custa mais atenção do que a
  // informação vale. A mensagem completa mora em `/artistas`, que é a tela deles.
  const { tela, limpar } = await abrir({ status: 500, corpo: { detail: "estourou" } });
  try {
    ok(tela.texto().trim() === "", `deixou resto na tela inicial: ${tela.texto()}`);
    ok(tela.naoTem('[aria-busy="true"]'), "ficou girando sobre o erro");
  } finally {
    await limpar();
  }
});
