/**
 * O token do link vem do fragmento, e só de lá.
 *
 * O terceiro teste é o que segura o conserto: ler `location.search` "como
 * reserva" desfaria tudo no front — o formato antigo voltaria a funcionar, e
 * voltar a funcionar é voltar a ser usado.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { tokenDoLink } from "./tokenDoLink.ts";

function fingirUrl(search: string, hash: string) {
  (globalThis as { window?: unknown }).window = { location: { search, hash } };
}

test("lê o token do fragmento", () => {
  fingirUrl("", "#token=abc123");
  assert.equal(tokenDoLink(), "abc123");
});

test("sem token no link, devolve nulo", () => {
  fingirUrl("", "");
  assert.equal(tokenDoLink(), null);
});

test("NÃO aceita o token na query string", () => {
  fingirUrl("?token=vazado", "");
  assert.equal(
    tokenDoLink(),
    null,
    "aceitar `?token=` mantém viva a forma que vaza para o log de acesso",
  );
});

test("o fragmento vence quando os dois aparecem", () => {
  fingirUrl("?token=vazado", "#token=certo");
  assert.equal(tokenDoLink(), "certo");
});
