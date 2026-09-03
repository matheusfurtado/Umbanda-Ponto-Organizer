/**
 * A faixa que convida a instalar — e o que ela pode prometer.
 *
 * Três coisas aqui já eram falsas ao mesmo tempo: ela prometia offline (que a
 * `TelaPlanos` VENDE como vantagem paga), ela nunca aparecia no iPad, e o
 * passo a passo do iPhone mandava procurar um símbolo que é a tecla ESC.
 */

import { match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { InstallBanner } from "@/components/InstallBanner";

beforeEach(() => localStorage.clear());

const IPAD_MODERNO = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36";

function fingirAparelho(ua: string, toques: number) {
  for (const [nome, valor] of [["userAgent", ua], ["maxTouchPoints", toques]] as const) {
    Object.defineProperty(window.navigator, nome, { value: valor, configurable: true });
  }
}

async function abrir(ua = IPAD_MODERNO, toques = 5) {
  fingirAparelho(ua, toques);
  const tela = await renderizar(<InstallBanner />);
  await assentar();
  return { tela, limpar: () => tela.desmontar() };
}

const botao = (tela: Tela, texto: RegExp) =>
  tela.todosNaPagina("button").find((b) => texto.test(b.textContent ?? ""));

test("no iPad a faixa APARECE — é o aparelho onde ela é a única forma de instalar", async () => {
  // O iPad não dispara `beforeinstallprompt` e, do iPadOS 13 em diante, não se
  // declara "iPad" no user agent. Os dois caminhos falhavam ao mesmo tempo.
  const { tela, limpar } = await abrir();
  try {
    match(tela.texto(), /Instalar o app/);
    ok(botao(tela, /Como instalar/), "sem o caminho do passo a passo no iPad");
  } finally {
    await limpar();
  }
});

test("a faixa promete que funciona sem sinal — e agora isso é verdade", async () => {
  // A promessa tinha SAÍDO em 31/08, porque o app se contradizia: oferecia
  // offline de graça aqui e o vendia como pago na `TelaPlanos`. Naquele dia não
  // dava para escolher um lado — era decisão dele.
  //
  // Ele decidiu em 03/09, opção (A): **offline é de todo mundo**. O que o plano
  // muda é O QUE se leva offline — a lista alfabética ou a gira inteira. Então
  // a promessa voltou, e este teste é a prova de que ela pode estar aqui.
  const { tela, limpar } = await abrir();
  try {
    match(
      tela.texto(),
      /sem sinal|offline/i,
      "a faixa deixou de dizer que o app funciona sem sinal, que é verdade e é "
      + "o que mais importa para quem abre isto no terreiro",
    );
    match(tela.texto(), /tela inicial/, "ficou sem dizer o que instalar faz");
  } finally {
    await limpar();
  }
});

test("o passo a passo do iPhone mostra o compartilhar de verdade, não a tecla ESC", async () => {
  // O símbolo era `⎋` — U+238B, BROKEN CIRCLE WITH NORTHWEST ARROW, que é a
  // tecla ESC. Quem seguisse a instrução procuraria na barra do Safari um
  // desenho que não está lá, e concluiria que o app não instala.
  const { tela, limpar } = await abrir();
  try {
    await tela.clicar(botao(tela, /Como instalar/)!);
    await assentar();
    match(tela.textoNaPagina(), /Adicionar à Tela de Início/);
    ok(
      !tela.textoNaPagina().includes("⎋"),
      "a tecla ESC voltou a ser apresentada como o ícone de compartilhar",
    );
    // Em palavras também: quem não vê a tela não recebe SVG nenhum.
    match(tela.textoNaPagina(), /quadrado com a seta para cima/);
    ok(tela.todosNaPagina("svg").length > 0, "sumiu o desenho do ícone");
  } finally {
    await limpar();
  }
});

test("o passo a passo diz que é no Safari, e o que fazer se não for", async () => {
  // No iPhone e no iPad, adicionar à tela de início é do Safari. Um passo a
  // passo que fala em "a barra do navegador" manda quem está em outro
  // navegador procurar um botão que não existe ali.
  const { tela, limpar } = await abrir();
  try {
    await tela.clicar(botao(tela, /Como instalar/)!);
    await assentar();
    match(tela.textoNaPagina(), /no Safari/);
    match(tela.textoNaPagina(), /outro navegador/);
  } finally {
    await limpar();
  }
});

test("dispensar tira a faixa, e ela não volta na próxima abertura", async () => {
  // "Quem não quer instalar a via de novo a cada abertura, e a única forma de
  // se ver livre dela era instalar — o que faz a sugestão parecer cobrança."
  const { tela, limpar } = await abrir();
  try {
    await tela.clicar(tela.exigir('button[aria-label="Dispensar o convite para instalar"]'));
    await assentar();
    ok(tela.naoTem("div"), `a faixa continuou na tela: ${tela.texto()}`);
  } finally {
    await limpar();
  }
  const segunda = await abrir();
  try {
    ok(!/Instalar o app/.test(segunda.tela.texto()), "a faixa voltou depois de dispensada");
  } finally {
    await segunda.limpar();
  }
});

test("sem convite nativo e fora do iPhone, não há faixa nenhuma", async () => {
  // No Android sem `beforeinstallprompt` o app não tem como instalar, e uma
  // faixa que só sabe dizer "instale" sem caminho é ruído puro.
  const { tela, limpar } = await abrir(ANDROID, 1);
  try {
    ok(!/Instalar o app/.test(tela.texto()), `apareceu sem ter como instalar: ${tela.texto()}`);
  } finally {
    await limpar();
  }
});
