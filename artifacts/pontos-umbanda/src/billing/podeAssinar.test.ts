/**
 * O funil: quem consegue clicar em "Assinar".
 *
 * Estes testes existem por causa de um defeito que passou por toda a suíte:
 * `disabled={... || ent.plano !== "gratis"}` no meio do botão, e um 409 do
 * lado do servidor. Quem estava no teste de 15 dias — o único momento em que a
 * decisão de pagar acontece — não conseguia pagar. O lançamento inteiro estava
 * travado, com verde dos dois lados.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { avisoDoPlano, estadoDoPlano, podeAssinar } from "./podeAssinar.ts";

test("quem está no teste PODE assinar", () => {
  assert.equal(podeAssinar("teste"), true);
});

test("quem não tem plano pode assinar", () => {
  assert.equal(podeAssinar("gratis"), true);
});

test("quem já paga não pode assinar de novo", () => {
  // Sem isto, dois cliques viram duas assinaturas no provedor e a segunda
  // ninguém pediu.
  assert.equal(podeAssinar("mensal"), false);
  assert.equal(podeAssinar("anual"), false);
});

test("plano desconhecido conta como pago, não como grátis", () => {
  // Errar para "não pode" custa um clique; errar para "pode" custa uma
  // cobrança dupla em alguém que já paga.
  assert.equal(estadoDoPlano("plano-que-inventarem"), "pago");
  assert.equal(podeAssinar("plano-que-inventarem"), false);
});

test("o aviso do teste diz que o que sobra não se perde", () => {
  const aviso = avisoDoPlano("teste", 12);
  assert.match(aviso ?? "", /12 dias/);
  assert.match(aviso ?? "", /não se perde/);
});

test("sem dias restantes, o aviso do teste ainda diz o essencial", () => {
  // `diasRestantes` é opcional na resposta; um `undefined` não pode virar
  // "faltam undefined dias" na tela.
  for (const valor of [null, undefined, 0]) {
    const aviso = avisoDoPlano("teste", valor);
    assert.ok(aviso && !aviso.includes("undefined") && !aviso.includes("null"), aviso ?? "");
    assert.match(aviso ?? "", /entra no plano/);
  }
});

test("quem já paga vê o plano que tem, e quem é grátis não vê aviso", () => {
  assert.equal(avisoDoPlano("mensal", null), "Você já tem o plano mensal ativo.");
  assert.equal(avisoDoPlano("gratis", null), null);
});


test("quem CANCELOU pode assinar de novo", () => {
  // O plano dela continua valendo até a data paga — é o que o cancelamento
  // promete —, então `ent.plano` diz "mensal" e a regra antiga barrava. Botão
  // desabilitado contra um servidor que aceitaria, e aviso falso na tela.
  assert.equal(podeAssinar("mensal", "cancelada"), true);
  assert.equal(podeAssinar("anual", "cancelada"), true);
});

test("quem paga e NÃO cancelou continua barrado", () => {
  // O contrapeso: sem ele, dois cliques viram duas assinaturas no provedor.
  assert.equal(podeAssinar("mensal", "ativa"), false);
  // Sem status (ainda carregando) trata como ativo — errar para "não pode"
  // custa um clique; errar para "pode" custa cobrança dupla.
  assert.equal(podeAssinar("mensal", undefined), false);
  assert.equal(podeAssinar("mensal", null), false);
});

test("o aviso de quem cancelou diz até quando vale, e não 'já tem ativo'", () => {
  // "Você já tem o plano mensal ativo" é a frase que faz a pessoa achar que
  // não precisa fazer nada — e no dia da virada ela perde o acesso sem ter
  // sido avisada.
  const aviso = avisoDoPlano("mensal", null, "cancelada");
  assert.match(aviso ?? "", /cancelado/);
  assert.match(aviso ?? "", /assinar de novo/);
  assert.doesNotMatch(aviso ?? "", /já tem o plano/);
});

test("o teste de cortesia não é confundido com cancelamento", () => {
  // `status` de uma cortesia cancelada existe, e ela continua sendo teste.
  assert.equal(podeAssinar("teste", "ativa"), true);
  assert.match(avisoDoPlano("teste", 12, "ativa") ?? "", /12 dias/);
});
