/**
 * O cartão da vitrine, com DOIS destinos que não podem se engolir.
 *
 * "Link dentro de link é HTML inválido: o navegador desfaz o aninhamento e o
 * de dentro deixa de funcionar, sem erro nenhum." O de dentro seria justamente
 * o nome de quem montou a gira — o caminho pelo qual se descobre gente para
 * seguir. Um teste que só olhasse os `href` passaria com o aninhamento de
 * volta, então o que se prende aqui é a AUSÊNCIA do aninhamento.
 */

import { deepEqual, equal, match, ok } from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { renderizar, type Tela } from "../../testes/renderizar.ts";
import { CartaoGira } from "@/componentes/CartaoGira";

const hrefs = (tela: Tela) =>
  tela.todos("a").map((a) => a.getAttribute("href"));

/**
 * O `Link` do wouter sem `Router` assina o histórico do navegador, e o DOM
 * destes testes não expõe `addEventListener` global de propósito — ver
 * `testes/dom.ts`. O `memoryLocation` é a rota de teste que já vale no resto
 * da suíte.
 */
const cartao = (props: Parameters<typeof CartaoGira>[0]) =>
  renderizar(
    <Router hook={memoryLocation({ path: "/giras-publicas" }).hook}>
      <CartaoGira {...props} />
    </Router>,
  );

test("o cartão leva à gira e o nome leva ao perfil", async () => {
  const tela = await cartao({ id: "g1", nome: "Gira de Ogum", de: "Pai João", pontos: 7 });
  try {
    deepEqual(hrefs(tela), ["/gira/g1", "/perfil/Pai%20Jo%C3%A3o"]);
    match(tela.texto(), /7 pontos/);
  } finally {
    await tela.desmontar();
  }
});

test("um link NUNCA está dentro do outro", async () => {
  // O navegador desfaz o aninhamento em silêncio: o de fora continua
  // funcionando, o de dentro morre, e nada acusa. Foi por isso que o link para
  // o perfil ficou só na página da gira por tanto tempo.
  const tela = await cartao({ id: "g1", nome: "Gira de Ogum", de: "Pai João", pontos: 7 });
  try {
    ok(tela.naoTem("a a"), "o link do perfil voltou para dentro do link da gira");
  } finally {
    await tela.desmontar();
  }
});

test("'Anônimo' não vira link — não corresponde a perfil nenhum", async () => {
  const tela = await cartao({ id: "g1", nome: "Gira de Ogum", de: "Anônimo", pontos: 1 });
  try {
    deepEqual(hrefs(tela), ["/gira/g1"]);
    match(tela.texto(), /Anônimo/);
  } finally {
    await tela.desmontar();
  }
});

test("apelido vazio também não vira link", async () => {
  const tela = await cartao({ id: "g1", nome: "Gira", de: "", pontos: 0 });
  try {
    deepEqual(hrefs(tela), ["/gira/g1"]);
  } finally {
    await tela.desmontar();
  }
});

test("um ponto é 'ponto', e não '1 pontos'", async () => {
  const tela = await cartao({ id: "g1", nome: "Gira", de: "Ana", pontos: 1 });
  try {
    match(tela.texto(), /1 ponto(?!s)/);
  } finally {
    await tela.desmontar();
  }
});

test("o link do cartão diz PARA ONDE vai, e não só 'abrir'", async () => {
  // A camada que cobre o cartão não tem texto — sem rótulo, um leitor de tela
  // anuncia "link" e pronto, e a vitrine inteira vira uma fila de "link".
  const tela = await cartao({ id: "g1", nome: "Gira de Ogum", de: "Ana", pontos: 2 });
  try {
    ok(tela.exigir('a[href="/gira/g1"]').getAttribute("aria-label")?.includes("Gira de Ogum"));
  } finally {
    await tela.desmontar();
  }
});

/**
 * A ordem das camadas — o que o DOM de teste NÃO consegue ver.
 *
 * O link da gira cobre o cartão inteiro (`absolute inset-0`); o nome de quem
 * montou só continua clicável porque fica ACIMA dessa camada (`relative z-10`).
 * Tirar o `relative z-10` não quebra nenhum dos testes acima: os dois `href`
 * continuam lá, o aninhamento continua ausente, e o clique passaria a abrir a
 * gira em vez do perfil. Medido por mutação — ela sobreviveu.
 *
 * Não dá para prender isso pelo DOM: happy-dom não tem motor de layout, e as
 * classes do Tailwind não viram estilo computado nos testes. Então esta cerca
 * lê a FONTE, como as outras deste projeto — e, sendo guarda de ausência,
 * traz casos positivos sintéticos, senão enfraquecer o detector passaria em
 * branco.
 */
const FONTE = join(dirname(fileURLToPath(import.meta.url)), "CartaoGira.tsx");

/** `null` quando a camada não foi achada — o que já é a falha. */
function camadas(fonte: string): { cobre: number | null; porCima: number | null } {
  const classes = [...fonte.matchAll(/className="([^"]+)"/g)].map((m) => m[1]);
  const z = (c: string | undefined) => {
    if (c === undefined) return null;
    const achado = /\bz-(\d+)\b/.exec(c);
    return achado ? Number(achado[1]) : null;
  };
  return {
    cobre: z(classes.find((c) => /\babsolute\b/.test(c) && /\binset-0\b/.test(c))),
    porCima: z(classes.find((c) => /\brelative\b/.test(c) && /\bz-\d+\b/.test(c))),
  };
}

test("o nome de quem montou fica ACIMA da camada que cobre o cartão", async () => {
  const { cobre, porCima } = camadas(readFileSync(FONTE, "utf8"));
  ok(cobre !== null, "não achei a camada que cobre o cartão (`absolute inset-0`)");
  ok(porCima !== null, "o link do perfil perdeu o `relative z-N` — ele virou inalcançável");
  ok(
    porCima > cobre,
    `o link do perfil (z-${porCima}) não está acima da camada da gira (z-${cobre})`,
  );
});

test("este detector reconhece o que diz reconhecer", async () => {
  // Guarda de ausência não falha sozinha: sem estes casos, afrouxar o regex
  // acima deixaria a cerca verde para sempre.
  const bom = `
    <Link className="absolute inset-0 z-0 rounded-xl" />
    <Link className="relative z-10 underline" />`;
  const semCamada = `
    <Link className="absolute inset-0 z-0 rounded-xl" />
    <Link className="underline" />`;
  const invertido = `
    <Link className="absolute inset-0 z-20 rounded-xl" />
    <Link className="relative z-10 underline" />`;

  deepEqual(camadas(bom), { cobre: 0, porCima: 10 });
  equal(camadas(semCamada).porCima, null, "não viu o link do perfil ficar sem camada");
  const i = camadas(invertido);
  ok(i.porCima! < i.cobre!, "não viu a camada da gira passar por cima do perfil");
});
