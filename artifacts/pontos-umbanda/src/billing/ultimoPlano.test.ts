/**
 * O plano lembrado — para a tela não mentir para quem pagou.
 *
 * O contexto fazia `.catch(() => setEnt(ENTITLEMENTS_GRATIS))`. Uma oscilação
 * de rede — a do terreiro, que é onde este app vive — tirava de quem paga a
 * hierarquia, os links de vídeo e as giras, sem uma palavra na tela.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  CHAVE_ULTIMO_PLANO,
  esquecerPlano,
  lembrarPlano,
  planoLembrado,
} from "./ultimoPlano.ts";

function fingirStorage(inicial: Record<string, string> = {}) {
  const caixa: Record<string, string> = { ...inicial };
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (c: string) => caixa[c] ?? null,
    setItem: (c: string, v: string) => {
      caixa[c] = v;
    },
    removeItem: (c: string) => {
      delete caixa[c];
    },
  };
  return caixa;
}

test("o plano volta como foi guardado", () => {
  fingirStorage();
  lembrarPlano({ plano: "mensal", sync: true, offline: true });
  assert.equal(planoLembrado()?.plano, "mensal");
  assert.equal(planoLembrado()?.sync, true);
});

test("sem nada guardado, devolve nulo", () => {
  fingirStorage();
  assert.equal(planoLembrado(), null);
});

test("JSON quebrado no disco não impede o app de abrir", () => {
  // Um valor corrompido — aba fechada no meio da escrita, cota estourada —
  // não pode virar exceção no primeiro render.
  fingirStorage({ [CHAVE_ULTIMO_PLANO]: "{isto não é json" });
  assert.equal(planoLembrado(), null);
});

test("objeto sem `plano` não conta como plano lembrado", () => {
  // JSON válido e conteúdo errado é o caso que passa despercebido: sem esta
  // conferência, `ent.plano` viraria `undefined` e toda comparação de plano
  // daria falso em silêncio.
  fingirStorage({ [CHAVE_ULTIMO_PLANO]: JSON.stringify({ qualquer: "coisa" }) });
  assert.equal(planoLembrado(), null);
});

test("esquecer apaga de verdade", () => {
  // É o que roda no logout: o tablet do terreiro é de todos, e qual plano o
  // anterior assinava é informação sobre ele.
  const caixa = fingirStorage();
  lembrarPlano({ plano: "anual" });
  esquecerPlano();
  assert.equal(caixa[CHAVE_ULTIMO_PLANO], undefined);
  assert.equal(planoLembrado(), null);
});

test("sem localStorage nada estoura", () => {
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem() {
      throw new Error("aba anônima restrita");
    },
    setItem() {
      throw new Error("aba anônima restrita");
    },
    removeItem() {
      throw new Error("aba anônima restrita");
    },
  };
  assert.doesNotThrow(() => lembrarPlano({ plano: "mensal" }));
  assert.equal(planoLembrado(), null);
  assert.doesNotThrow(() => esquecerPlano());
});
