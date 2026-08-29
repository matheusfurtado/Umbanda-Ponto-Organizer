/**
 * "Todos os pontos" é uma abstração até a pessoa saber que são 47.
 *
 * A lição veio da gira: aquele diálogo diz o tamanho e diz o que sobrevive. As
 * três exclusões do acervo organizado diziam só "isso também excluirá todas as
 * subcategorias e pontos deste Orixá" — e aqui não há volta, porque são as
 * cópias DELA.
 */

import { equal, match, ok } from "node:assert/strict";
import { test } from "node:test";
import { apagarOrixa, apagarSubcategoria } from "@/dominio/quantoSePerde";

test("o número aparece, e é o que a pessoa não vê na tela de onde apaga", () => {
  const frase = apagarOrixa(3, 47);
  match(frase, /3 subcategorias/);
  match(frase, /47 pontos/);
});

test("o singular não vira '1 pontos'", () => {
  // A tela é lida em voz baixa, na gira. Concordância errada é ruído barato de
  // evitar e caro de deixar.
  match(apagarOrixa(1, 1), /1 subcategoria e 1 ponto\b/);
  match(apagarSubcategoria(1), /1 ponto\b/);
});

test("apagar coisa VAZIA não inventa perda", () => {
  // Assustar quem está limpando um orixá que criou por engano é o mesmo erro
  // de avisar sobre link quebrado a quem nunca teve link.
  match(apagarOrixa(0, 0), /Ele está vazio/);
  ok(!/Vai junto/.test(apagarOrixa(0, 0)));
  match(apagarSubcategoria(0), /Ela está vazia/);
});

test("orixá só com subcategorias vazias não fala de pontos", () => {
  const frase = apagarOrixa(2, 0);
  match(frase, /2 subcategorias/);
  ok(!/ponto/.test(frase), `falou de pontos que não existem: ${frase}`);
});

test("as três frases dizem que NÃO volta, e por quê", () => {
  // O par da gira: lá o alívio é "os pontos continuam no acervo". Aqui não há
  // alívio, e a frase não pode fingir que há — é o acervo organizado da
  // pessoa, e ele não volta sozinho.
  for (const frase of [apagarOrixa(1, 1), apagarOrixa(0, 0), apagarSubcategoria(9)]) {
    match(frase, /não pode ser desfeito/);
    match(frase, /não volta sozinho/);
  }
});

test("a frase é a MESMA nas duas telas", () => {
  // Já divergiu antes: uma escrevia `Excluir Exu?` e a outra
  // `Excluir "Chegada"?`. Duas frases para a mesma decisão é como uma delas
  // deixa de dizer o que importa.
  const fim = "Isto não pode ser desfeito — é o seu acervo organizado, e ele não volta sozinho.";
  equal(apagarOrixa(2, 5).endsWith(fim), true);
  equal(apagarSubcategoria(5).endsWith(fim), true);
});
