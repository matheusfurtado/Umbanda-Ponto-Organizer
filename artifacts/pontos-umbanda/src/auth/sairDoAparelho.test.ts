/**
 * Sair sem rede tem de limpar o aparelho do mesmo jeito.
 *
 * O defeito era `await sairDaApi()` fora do `try`: a chamada jogava e a função
 * morria antes de apagar acervo, giras e fila. No tablet do terreiro isso é a
 * próxima pessoa abrindo o app com o acervo de quem saiu — que é exatamente o
 * que a limpeza foi escrita para impedir.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { sairDoAparelho } from "./sairDoAparelho.ts";

test("limpa mesmo quando o servidor está fora", async () => {
  let limpou = false;
  await sairDoAparelho(
    () => Promise.reject(new TypeError("fetch failed")),
    () => {
      limpou = true;
    },
  );
  assert.equal(limpou, true, "a rede caiu e o aparelho ficou com os dados");
});

test("limpa quando o servidor responde erro, não só quando a rede cai", async () => {
  // 401 de sessão já expirada é o caso mais comum de todos: a pessoa volta
  // depois de dias, clica em sair, e o servidor diz que não há o que encerrar.
  let limpou = false;
  await sairDoAparelho(
    () => Promise.reject(Object.assign(new Error("401"), { status: 401 })),
    () => {
      limpou = true;
    },
  );
  assert.equal(limpou, true);
});

test("limpa no caminho feliz também", async () => {
  let limpou = false;
  await sairDoAparelho(() => Promise.resolve(null), () => {
    limpou = true;
  });
  assert.equal(limpou, true);
});

test("avisa o servidor ANTES de limpar", async () => {
  // A ordem importa: o `logout` precisa do cookie, e a limpeza local pode
  // derrubá-lo. Invertendo, o servidor deixaria a sessão viva no banco.
  const ordem: string[] = [];
  await sairDoAparelho(
    async () => {
      ordem.push("servidor");
    },
    () => ordem.push("local"),
  );
  assert.deepEqual(ordem, ["servidor", "local"]);
});

test("não propaga a falha para quem chamou", async () => {
  // `ApagarConta` chama isto depois de o servidor JÁ ter apagado a conta. Uma
  // exceção aqui deixaria a tela dizendo "não consegui apagar" sobre uma conta
  // que já não existe.
  await assert.doesNotReject(() =>
    sairDoAparelho(() => Promise.reject(new Error("qualquer")), () => {}),
  );
});
