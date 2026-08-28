/**
 * Sair da conta tira os dados do aparelho — e a lista não pode envelhecer.
 *
 * O segundo teste é o que importa mais. Uma lista de chaves escrita à mão
 * apodrece em silêncio: alguém acrescenta um cache daqui a dois meses, ele não
 * entra aqui, e o logout deixa de limpá-lo. Ninguém descobre, porque o defeito
 * só aparece para a próxima pessoa que pegar o tablet — e ela não sabe que
 * está vendo o que não devia.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { CHAVES_PESSOAIS, CHAVES_QUE_FICAM, esquecerDoAparelho } from "./esquecer.ts";

/** `localStorage` de mentira, que este runtime não tem. */
function fingirStorage(inicial: Record<string, string>) {
  const caixa = { ...inicial };
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

test("sair leva o acervo, as giras e a fila embora", () => {
  const caixa = fingirStorage({
    "pontos-umbanda-data": '{"orixas":[]}',
    "pontos-umbanda-repertorios": "[]",
    "pontos-umbanda-repertorios-fila": "[]",
    "pontos-umbanda-pendente": "{}",
    "pontos-umbanda-usuario": '{"id":"x"}',
    "pagamento-pendente": "ref-123",
    "migracao-oferecida": "1",
    paleta: "terra",
  });

  esquecerDoAparelho();

  for (const chave of CHAVES_PESSOAIS) {
    assert.equal(caixa[chave], undefined, `${chave} ficou no aparelho depois de sair`);
  }
  assert.equal(caixa.paleta, "terra", "a preferência de tela não devia sumir");
});

test("sair funciona mesmo sem localStorage", () => {
  (globalThis as { localStorage?: unknown }).localStorage = {
    removeItem() {
      throw new Error("aba anônima restrita");
    },
  };
  // Sair não pode depender de gravar funcionar.
  assert.doesNotThrow(() => esquecerDoAparelho());
});

test("toda chave de localStorage do app está decidida", () => {
  const RAIZ = new URL("..", import.meta.url).pathname;

  function arquivos(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const caminho = join(dir, e.name);
      if (e.isDirectory()) return arquivos(caminho);
      return /\.tsx?$/.test(e.name) && !e.name.endsWith(".test.ts") ? [caminho] : [];
    });
  }

  const fontes = arquivos(RAIZ);
  assert.ok(fontes.length > 30, `só ${fontes.length} arquivos varridos — o caminho mudou`);

  const achadas = new Set<string>();
  for (const caminho of fontes) {
    const texto = readFileSync(caminho, "utf8");
    for (const [, chave] of texto.matchAll(
      /localStorage\.(?:getItem|setItem|removeItem)\(\s*"([^"]+)"/g,
    )) {
      achadas.add(chave);
    }
    // As chaves costumam morar numa constante, e é por ela que o código chama.
    for (const [, chave] of texto.matchAll(/^const CHAVE[A-Z_]* = "([^"]+)";/gm)) {
      achadas.add(chave);
    }
    for (const [, chave] of texto.matchAll(/^const STORAGE_KEY = "([^"]+)";/gm)) {
      achadas.add(chave);
    }
  }

  // Guarda de COMPLETUDE, não de quantidade: se a varredura parar de achar as
  // duas chaves que sabidamente existem, ela virou decoração.
  for (const obrigatoria of ["pontos-umbanda-data", "paleta"]) {
    assert.ok(
      achadas.has(obrigatoria),
      `a varredura não achou ${obrigatoria} — o formato mudou e este teste parou de ler`,
    );
  }

  const decididas = new Set<string>([...CHAVES_PESSOAIS, ...Object.keys(CHAVES_QUE_FICAM)]);
  const orfas = [...achadas].filter((c) => !decididas.has(c));
  assert.deepEqual(
    orfas,
    [],
    `chave de localStorage sem decisão: ${orfas.join(", ")}. Ou entra em ` +
      "CHAVES_PESSOAIS (sai ao deslogar), ou em CHAVES_QUE_FICAM com o motivo.",
  );
});
