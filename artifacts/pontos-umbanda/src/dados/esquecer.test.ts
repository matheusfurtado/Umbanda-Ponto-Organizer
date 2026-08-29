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

  const decididasBrutas = new Set<string>([
    ...CHAVES_PESSOAIS,
    ...Object.keys(CHAVES_QUE_FICAM),
  ]);
  const achadas = new Set<string>();
  for (const caminho of fontes) {
    const texto = readFileSync(caminho, "utf8");
    for (const [, chave] of texto.matchAll(
      /localStorage\.(?:getItem|setItem|removeItem)\(\s*"([^"]+)"/g,
    )) {
      achadas.add(chave);
    }
    // As chaves costumam morar numa constante, e é por ela que o código chama.
    //
    // O `export ` opcional não é detalhe: sem ele esta varredura tinha um furo
    // que eu mesmo achei por mutação. `billing/ultimoPlano.ts` declara
    // `export const CHAVE_ULTIMO_PLANO = "pontos-umbanda-plano"`, e como o
    // resto do arquivo chama `localStorage.setItem(CHAVE_ULTIMO_PLANO)` — pela
    // constante, não por literal —, a chave era invisível para o teste.
    //
    // Tirar aquela chave de `CHAVES_PESSOAIS` deixava tudo verde. Uma cerca
    // com furo é pior que nenhuma: ela dá a garantia sem cumprir.
    // QUALQUER constante de módulo com string, e não só as que se chamam
    // CHAVE/STORAGE_KEY.
    //
    // O regex antigo exigia o nome no padrão, e `const FLAG_MIGRACAO =
    // "migracao-oferecida"` (App.tsx) não casava — o uso é pela constante,
    // então o scan literal também não a via. A chave era invisível: tirá-la de
    // `CHAVES_PESSOAIS` deixava a suíte verde e o logout parava de apagá-la.
    //
    // Cobrar o NOME é cobrar convenção; o que interessa é o VALOR. Casar toda
    // constante de string traz ruído (rota, rótulo), e é por isso que o filtro
    // logo abaixo é pelo formato da chave, não pelo nome da constante.
    for (const [, valor] of texto.matchAll(
      /^(?:export )?const [A-Z_][A-Z0-9_]* = "([^"]+)";/gm,
    )) {
      // Só o que PARECE chave de armazenamento: ou o prefixo do app, ou um
      // nome sem barra nem espaço que já esteja declarado. Sem isto, toda
      // constante de texto do app entraria na conta.
      if (valor.startsWith("pontos-umbanda") || decididasBrutas.has(valor)) {
        achadas.add(valor);
      }
    }
  }

  // Guarda de COMPLETUDE, não de quantidade: se a varredura parar de achar as
  // duas chaves que sabidamente existem, ela virou decoração.
  // Uma de cada FORMA de declarar, e não só duas chaves quaisquer: literal
  // solto no `localStorage.getItem` (paleta), `const` de módulo
  // (pontos-umbanda-data) e `export const` (pontos-umbanda-plano) — que foi
  // justamente a forma que escapou.
  // Uma de cada FORMA de declarar: literal solto (`paleta`), `const` de módulo
  // (`pontos-umbanda-data`), `export const` (`pontos-umbanda-plano`) e
  // constante com nome FORA da convenção CHAVE/STORAGE_KEY
  // (`migracao-oferecida`, em `FLAG_MIGRACAO`) — que foi a que escapou.
  for (const obrigatoria of [
    "pontos-umbanda-data",
    "paleta",
    "pontos-umbanda-plano",
    "migracao-oferecida",
  ]) {
    assert.ok(
      achadas.has(obrigatoria),
      `a varredura não achou ${obrigatoria} — o formato mudou e este teste parou de ler`,
    );
  }

  const decididas = decididasBrutas;
  const orfas = [...achadas].filter((c) => !decididas.has(c));
  assert.deepEqual(
    orfas,
    [],
    `chave de localStorage sem decisão: ${orfas.join(", ")}. Ou entra em ` +
      "CHAVES_PESSOAIS (sai ao deslogar), ou em CHAVES_QUE_FICAM com o motivo.",
  );
});
