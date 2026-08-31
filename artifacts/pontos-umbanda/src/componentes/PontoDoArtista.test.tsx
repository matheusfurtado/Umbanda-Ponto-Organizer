/**
 * A linha do artista: o que abre a letra, e o que NÃO abre.
 *
 * Este é o primeiro teste de componente do projeto, e ele existe porque o
 * achado #12 não tinha como ser pego de outro jeito. O docstring do
 * `PontoDoArtista` afirmava, por escrito, uma estrutura que o JSX nunca teve —
 * "a linha inteira é o gatilho da letra... sem `stopPropagation`, clicar em
 * ouvir também abriria a letra" — e havia um `e.stopPropagation()` inerte
 * sustentando a frase. Ninguém mediu porque ninguém PODIA medir: sem
 * renderizador, estrutura de JSX é prosa.
 *
 * Então o que se afirma aqui é comportamento, não forma. "A seta está dentro
 * do botão" seria fixar uma decisão de layout. "Clicar em ouvir não abre a
 * letra" e "a seta faz parte do que abre" são o que a pessoa sente.
 */

import { equal, match, ok } from "node:assert/strict";
import { test } from "node:test";
import { renderizar } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { PontoDoArtista } from "@/componentes/PontoDoArtista";
import type { PontoDoArtista as Ponto } from "@/api/artista";

const PONTO: Ponto = {
  id: "og-1",
  titulo: "Ogum de Lei",
  orixa: "Ogum",
  orixaId: "ogum",
  orixaEmoji: "⚔️",
  orixaCor: "#c00",
  orixaTipo: "orixa",
  letra: "Ogum de Lei, Ogum de Lei",
  cliques: 3,
  videoUrl: "https://youtube.com/watch?v=x",
  videoStatus: "encontrado",
};

test("o título abre a letra, que não estava lá antes", async () => {
  const tela = await renderizar(<PontoDoArtista ponto={PONTO} />);
  ok(!tela.texto().includes("Ogum de Lei, Ogum de Lei"), "a letra já vinha aberta");
  await tela.clicar("button");
  match(tela.texto(), /Ogum de Lei, Ogum de Lei/);
  equal(tela.exigir("button").getAttribute("aria-expanded"), "true");
  await tela.desmontar();
});

test("clicar em Ouvir NÃO abre a letra", async () => {
  // A afirmação do docstring antigo, agora medida. O `<a>` é IRMÃO do
  // `<button>`, então o clique nunca chegaria ao `onClick` dele — e é por isso
  // que o `stopPropagation` que existia ali era inerte.
  const rede = fingirRede(() => ({ status: 204 }));
  try {
    const tela = await renderizar(<PontoDoArtista ponto={PONTO} />);
    await tela.clicar("a");
    ok(
      !tela.texto().includes("Ogum de Lei, Ogum de Lei"),
      "ouvir abriu a letra: quem volta do YouTube encontra a tela mexida sem ter pedido",
    );
    equal(tela.exigir("button").getAttribute("aria-expanded"), "false");
    await tela.desmontar();
  } finally {
    rede.restaurar();
  }
});

test("Ouvir conta o clique — uma vez, e só quando há vídeo", async () => {
  const rede = fingirRede(() => ({ status: 204 }));
  try {
    const tela = await renderizar(<PontoDoArtista ponto={PONTO} />);
    await tela.clicar("a");
    equal(rede.chamadas.length, 1, `chamadas: ${JSON.stringify(rede.chamadas)}`);
    match(rede.chamadas[0].url, /og-1/);
    await tela.desmontar();

    const semVideo = await renderizar(
      <PontoDoArtista ponto={{ ...PONTO, videoUrl: null }} />,
    );
    ok(semVideo.naoTem("a"), "ofereceu Ouvir para ponto sem vídeo");
    await semVideo.desmontar();
  } finally {
    rede.restaurar();
  }
});

test("a seta faz parte do que abre — é ela que diz que abre", async () => {
  // Estava FORA do botão: o único sinal de que a linha abre alguma coisa
  // ficava a um clique de distância do que de fato abre.
  const tela = await renderizar(<PontoDoArtista ponto={PONTO} />);
  const seta = tela.exigir("svg.lucide-chevron-down");
  ok(
    tela.exigir("button").contains(seta),
    "a seta está fora do botão que abre a letra",
  );
  await tela.desmontar();
});

test("o ponto sem letra DIZ que não tem, em vez de abrir vazio", async () => {
  // 47 dos 520 estão assim. Um vazio parece defeito da tela.
  const tela = await renderizar(<PontoDoArtista ponto={{ ...PONTO, letra: "  " }} />);
  await tela.clicar("button");
  match(tela.texto(), /ainda não está no acervo/);
  await tela.desmontar();
});

test("o casamento duvidoso é anunciado junto com o link", async () => {
  const tela = await renderizar(
    <PontoDoArtista ponto={{ ...PONTO, videoStatus: "revisar" }} />,
  );
  match(tela.texto(), /casamento a conferir/);
  ok(tela.achar("a"), "escondeu o link em vez de anunciar a dúvida");
  await tela.desmontar();
});
