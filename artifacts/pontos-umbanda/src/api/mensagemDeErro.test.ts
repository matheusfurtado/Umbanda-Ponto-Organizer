/**
 * O que a pessoa lê quando uma chamada falha.
 *
 * `ErroApi.message` traz `"API 409: "` na frente — bom para o log, péssimo na
 * tela: quem lê isso no terreiro não sabe o que é 409, e o número faz a
 * resposta inteira parecer defeito. Vinte telas mostravam exatamente isso.
 */

import { equal } from "node:assert/strict";
import { test } from "node:test";
import { ErroApi, ErroRede, mensagemDeErro } from "@/api/cliente";

test("o texto do servidor sai SEM o prefixo de status", () => {
  const erro = new ErroApi(409, "Você já sugeriu um autor para este ponto.");
  equal(erro.message, "API 409: Você já sugeriu um autor para este ponto.");
  equal(
    mensagemDeErro(erro, "Não consegui enviar."),
    "Você já sugeriu um autor para este ponto.",
  );
});

test("resposta sem detalhe cai no texto de quem chamou", () => {
  equal(mensagemDeErro(new ErroApi(500, ""), "Não consegui salvar."), "Não consegui salvar.");
});

test("falha de rede tem texto próprio, e a tela pode trocá-lo", () => {
  const caiu = new ErroRede(new TypeError("Failed to fetch"));
  equal(mensagemDeErro(caiu, "Não consegui salvar."), "Sem conexão. Verifique a internet e tente de novo.");
  equal(
    mensagemDeErro(caiu, "Não consegui salvar.", "Sem conexão. Apagar precisa de internet."),
    "Sem conexão. Apagar precisa de internet.",
  );
});

test("erro que é defeito NOSSO não vira texto de tela", () => {
  // `chamar` embrulha rede em `ErroRede` e resposta ruim em `ErroApi`. Um
  // `TypeError` que chega aqui é bug nosso, e o texto dele nomeia uma variável
  // para quem está esperando para cantar.
  equal(
    mensagemDeErro(new TypeError("x is not a function"), "Não consegui enviar."),
    "Não consegui enviar.",
  );
  equal(mensagemDeErro("string solta", "Não consegui enviar."), "Não consegui enviar.");
  equal(mensagemDeErro(null, "Não consegui enviar."), "Não consegui enviar.");
});

test("reconhece o erro mesmo com duas cópias do módulo", () => {
  // Mesma precaução do `ehErroDeApi`: `instanceof` compara identidade de
  // classe, e fronteira de chunk produz duas. Um objeto com o `name` certo
  // precisa ser reconhecido.
  const forasteiro = Object.assign(new Error("API 402: Seu plano não inclui isso."), {
    name: "ErroApi",
    status: 402,
    detalhe: "Seu plano não inclui isso.",
  });
  equal(mensagemDeErro(forasteiro, "padrão"), "Seu plano não inclui isso.");
});
