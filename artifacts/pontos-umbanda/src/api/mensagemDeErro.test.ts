/**
 * O que a pessoa lê quando uma chamada falha.
 *
 * `ErroApi.message` traz `"API 409: "` na frente — bom para o log, péssimo na
 * tela: quem lê isso no terreiro não sabe o que é 409, e o número faz a
 * resposta inteira parecer defeito. Vinte telas mostravam exatamente isso.
 */

import { equal, ok } from "node:assert/strict";
import { test } from "node:test";
import { chamarApi, ErroApi, ErroRede, mensagemDeErro } from "@/api/cliente";
import { fingirRede } from "../../testes/rede.ts";

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

// ------------------------------- e quem PRODUZ o erro, que é a outra metade

test("o 422 do Pydantic vem em LISTA, e a tela precisa de frase", async () => {
  // O nosso 422 vem como frase; o do Pydantic vem como
  // `[{loc, msg, type}]`. Sem tratar, `String(detail)` vira "[object Object]"
  // — que é pior que não mostrar nada, porque parece defeito do app.
  //
  // Isto vivia só no `api/pedidoArtista.ts`, então valia só naquela tela.
  const rede = fingirRede(() => ({
    status: 422,
    corpo: { detail: [{ loc: ["body", "titulo"], msg: "String should have at most 200 characters", type: "string_too_long" }] },
  }));
  try {
    await chamarApi("/qualquer", { method: "POST" }).then(
      () => { throw new Error("devia ter falhado"); },
      (problema: unknown) => {
        ok(problema instanceof ErroApi, "não é ErroApi");
        equal(problema.status, 422);
        equal(problema.detalhe, "String should have at most 200 characters");
        equal(
          mensagemDeErro(problema, "Não consegui enviar."),
          "String should have at most 200 characters",
        );
      },
    );
  } finally {
    rede.restaurar();
  }
});

test("resposta ruim vira ErroApi; queda de rede vira ErroRede", async () => {
  const ruim = fingirRede(() => ({ status: 402, corpo: { detail: "Seu plano não inclui isso." } }));
  try {
    await chamarApi("/x").then(
      () => { throw new Error("devia ter falhado"); },
      (p: unknown) => {
        ok(ehErroDeApiLocal(p), "não caiu no vocabulário de API");
        equal(mensagemDeErro(p, "padrão"), "Seu plano não inclui isso.");
      },
    );
  } finally {
    ruim.restaurar();
  }

  const caiu = fingirRede(() => { throw new TypeError("Failed to fetch"); });
  try {
    await chamarApi("/x").then(
      () => { throw new Error("devia ter falhado"); },
      (p: unknown) => {
        ok(p instanceof ErroRede, "queda de rede não virou ErroRede");
      },
    );
  } finally {
    caiu.restaurar();
  }
});

function ehErroDeApiLocal(p: unknown): p is ErroApi {
  return p instanceof Error && p.name === "ErroApi";
}
