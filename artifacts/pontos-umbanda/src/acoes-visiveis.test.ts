/**
 * Nenhuma ação some no celular.
 *
 * `opacity-0` revelado por `group-hover` é invisível em tela de toque — não
 * existe hover ali. Favoritar, adicionar à gira e sugerir autor sumiam assim,
 * e apagar uma gira também. Pior que sumir: o botão continuava ocupando espaço
 * e respondendo ao toque, então dava para acertar um que não se vê.
 *
 * O conserto é `[@media(hover:hover)]:opacity-0` — esconde só onde há mouse.
 * Esta cerca existe porque o padrão errado é o que se digita sem pensar: quem
 * copiar a classe de um botão vizinho reintroduz o defeito, e ele não aparece
 * em nenhum teste de comportamento nem no navegador de quem escreveu.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const RAIZ = new URL(".", import.meta.url).pathname;

function arquivos(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const caminho = join(dir, e.name);
    if (e.isDirectory()) return arquivos(caminho);
    return /\.tsx$/.test(e.name) ? [caminho] : [];
  });
}

test("nenhum `opacity-0` fica escondido atrás de hover no celular", () => {
  const fontes = arquivos(RAIZ);
  assert.ok(fontes.length > 30, `só ${fontes.length} arquivos varridos — o caminho mudou`);

  const culpados: string[] = [];
  for (const caminho of fontes) {
    const texto = readFileSync(caminho, "utf8");
    // O regex antigo era `/className=[{"`]([^"`]*)["`]/g`, e ele era CEGO à
    // forma que mais importa. Com `className={`…`}`, o `[{"`]` casa a chave,
    // o próximo caractere é a crase, `[^"`]*` casa VAZIO e o `["`]` fecha nela
    // mesma: captura string vazia.
    //
    // Medido em `LinhaPonto.tsx`: 31 capturas e só duas continham o conserto —
    // as dos botões escritos com aspas. A do FAVORITAR, que é template literal
    // porque alterna cor por estado, nunca era lida. Desfazer o conserto só
    // nela deixava a suíte inteira verde e o botão sumia no celular de novo.
    //
    // Agora a crase é um delimitador de primeira classe, e o conteúdo pode
    // conter aspas (que aparecem dentro de `${cond ? "a" : "b"}`).
    for (const [, comCrase, comAspas] of texto.matchAll(
      /className=\{`([^`]*)`\}|className="([^"]*)"/g,
    )) {
      const classes = comCrase ?? comAspas ?? "";
      const revelaNoHover = /group-hover:opacity-100|hover:opacity-100/.test(classes);
      // `opacity-0` cru, sem o `[@media(hover:hover)]:` na frente.
      const escondeSempre = /(?<![\w:\]])opacity-0(?![\w-])/.test(classes);
      if (revelaNoHover && escondeSempre) {
        culpados.push(`${caminho.replace(RAIZ, "")}: ${classes.slice(0, 80)}`);
      }
    }
  }

  assert.deepEqual(
    culpados,
    [],
    "estas ações somem em tela de toque. Troque `opacity-0` por " +
      "`[@media(hover:hover)]:opacity-0`:\n  " + culpados.join("\n  "),
  );
});

test("a varredura enxerga o padrão que ela cobra", () => {
  // Guarda de completude: se o `className` mudar de forma (helper, `cn(...)`
  // com várias linhas), o regex para de casar e a cerca passa a aprovar tudo
  // em silêncio. Este teste falha antes disso acontecer.
  const linha = readFileSync(join(RAIZ, "componentes/LinhaPonto.tsx"), "utf8");
  assert.match(
    linha,
    /\[@media\(hover:hover\)\]:opacity-0/,
    "LinhaPonto não tem mais o padrão consertado — ou mudou de forma, e este teste ficou cego",
  );
  // A guarda de completude que faltava: não basta achar `className`, é preciso
  // achar o TEMPLATE LITERAL. Era exatamente essa forma que escapava, e uma
  // guarda que só conta capturas aprovava o regex cego (ele achava 31).
  const comCrase = [...linha.matchAll(/className=\{`([^`]*)`\}/g)];
  assert.ok(
    comCrase.length > 0,
    "a varredura não achou nenhum `className={`…`}` em LinhaPonto — era essa " +
      "forma que ela era cega, e sem ela a cerca volta a aprovar o defeito",
  );
  assert.ok(
    comCrase.some((m) => m[1].includes("opacity-0")),
    "nenhum template literal de LinhaPonto tem `opacity-0` — o botão de " +
      "favoritar mudou de forma e esta cerca ficou sem alvo",
  );
});
