/**
 * A busca com destaque — a que a fase 1 diz que não se pode perder.
 *
 * Este arquivo é `.tsx` e por isso jamais esteve ao alcance de um teste: até o
 * renderizador existir, importar `.tsx` morria em `ERR_UNKNOWN_FILE_EXTENSION`.
 * Quatro telas realçam com ele, inclusive a do plano grátis.
 *
 * O primeiro teste escrito aqui achou um defeito de verdade — ver
 * "emoji não desloca o realce" lá embaixo.
 */

import { deepEqual, equal, ok } from "node:assert/strict";
import { test } from "node:test";
import { renderizar } from "../../testes/renderizar.ts";
import { destacar, semAcento } from "@/lib/destacar";

const marcas = (tela: { todos: (s: string) => Element[] }) =>
  tela.todos("mark").map((m) => m.textContent);

test("marca o trecho e devolve a grafia de verdade, com acento", async () => {
  // Quem digita "louvacao" encontra "louvação" — e precisa VER por quê.
  const tela = await renderizar(<p>{destacar("Ponto de louvação", "louvacao")}</p>);
  deepEqual(marcas(tela), ["louvação"]);
  equal(tela.texto(), "Ponto de louvação", "o realce alterou o texto");
  await tela.desmontar();
});

test("marca todas as ocorrências, não só a primeira", async () => {
  const tela = await renderizar(<p>{destacar("Ogum, Ogum, meu pai Ogum", "ogum")}</p>);
  deepEqual(marcas(tela), ["Ogum", "Ogum", "Ogum"]);
  await tela.desmontar();
});

test("busca vazia não marca nada — e não quebra a tela", async () => {
  for (const vazio of ["", "   "]) {
    const tela = await renderizar(<p>{destacar("Ogum de Lei", vazio)}</p>);
    deepEqual(marcas(tela), []);
    equal(tela.texto(), "Ogum de Lei");
    await tela.desmontar();
  }
});

test("termo que não existe deixa o texto inteiro em paz", async () => {
  const tela = await renderizar(<p>{destacar("Ogum de Lei", "xangô")}</p>);
  deepEqual(marcas(tela), []);
  equal(tela.texto(), "Ogum de Lei");
  await tela.desmontar();
});

test("emoji não desloca o realce", async () => {
  // O DEFEITO que este arquivo achou. `for...of` anda por ponto de código, mas
  // `.length` conta unidades UTF-16: o emoji ocupa duas. `NFD[0]` devolvia
  // metade do par substituto, e a partir dali toda posição saía adiantada —
  // o realce marcava as letras erradas.
  //
  // Nome de gira e ponto da comunidade são texto que a pessoa digita, e
  // `TelaRepertorios` realça exatamente esses campos.
  const tela = await renderizar(<p>{destacar("🙏 Gira de Exu", "exu")}</p>);
  deepEqual(marcas(tela), ["Exu"], "o realce saiu deslocado pelo emoji");
  equal(tela.texto(), "🙏 Gira de Exu", "o texto foi corrompido ao fatiar");
  await tela.desmontar();
});

test("o comprimento dobrado é sempre igual ao original", async () => {
  // O invariante em que TODO o resto se apoia: as posições achadas no texto
  // dobrado fatiam a string ORIGINAL. Se os tamanhos divergirem, o realce
  // desliza — e nada mais neste arquivo consegue estar certo.
  const casos = [
    "louvação", "Iemanjá", "coração", "OGUM", "Xangô Aganjú",
    "🙏 Gira", "𝓐lgo", "İstanbul", "ﬁm", "ß e ẞ", "Ọ̀ṣun", "á",
  ];
  for (const caso of casos) {
    equal(semAcento(caso).length, caso.length, `dobrou ${JSON.stringify(caso)} de tamanho`);
  }
});

test("a mesma função dobra a busca e o realce", async () => {
  // Três telas já tiveram cada uma o seu `normalizar`. Quando a busca dobra o
  // acento de um jeito e o destaque de outro, o ponto aparece na lista com
  // nada marcado — e a pessoa não entende por que ele foi devolvido.
  const titulo = "Louvação a Oxalá";
  const digitado = "oxala";
  ok(
    semAcento(titulo).includes(semAcento(digitado)),
    "a busca não acharia este ponto",
  );
  const tela = await renderizar(<p>{destacar(titulo, digitado)}</p>);
  deepEqual(marcas(tela), ["Oxalá"], "a busca acha e o realce não marca");
  await tela.desmontar();
});

test("o cedilha e o til dobram, e a caixa não importa", async () => {
  const tela = await renderizar(<p>{destacar("Doçura de Oxum", "DOCURA")}</p>);
  deepEqual(marcas(tela), ["Doçura"]);
  await tela.desmontar();
});
