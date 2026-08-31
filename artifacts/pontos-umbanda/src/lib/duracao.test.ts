/**
 * A duração de um vídeo, e a cerca contra a quinta cópia dela.
 *
 * Existiam QUATRO implementações — duas funções copiadas e duas escritas
 * direto no JSX —, e só uma tinha o ramo da hora. As outras três mostravam
 * "79:21" para um vídeo de 1h19.
 *
 * O conserto foi num arquivo só. Sem cerca, a quinta tela escreve a quinta
 * cópia, e o `Math.floor(seg / 60)` volta.
 */

import { equal, ok } from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { duracao } from "@/lib/duracao";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "..");

test("formata em minutos e segundos, com o zero à esquerda", () => {
  equal(duracao(125), "2:05");
  equal(duracao(5), "0:05");
  equal(duracao(59), "0:59");
  equal(duracao(600), "10:00");
});

test("passando da hora, muda de formato — ninguém lê '79:21'", () => {
  // O acervo tem um vídeo de 4761 s hoje, e vai ter mais: os canais que o
  // casamento encontra publicam gira inteira.
  equal(duracao(3600), "1:00:00");
  equal(duracao(3661), "1:01:01");
  equal(duracao(4761), "1:19:21");
});

test("nulo, zero e negativo não viram '0:00'", () => {
  // "0:00" não é informação, é ruído numa coluna lida de relance. E negativo
  // não existe — se aparecer, é dado sujo, e inventar um número para ele
  // esconderia o problema.
  for (const nada of [null, undefined, 0, -1] as const) {
    equal(duracao(nada), null, `${nada} devia sumir da coluna`);
  }
});

// ------------------------------------------------- a cerca contra a recópia

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return nome === "ui" ? [] : arquivos(caminho);
    if (!/\.tsx?$/.test(nome) || nome.includes(".test.")) return [];
    return [caminho];
  });
}

/**
 * Alguém está formatando segundos à mão?
 *
 * `% 60` seguido de `padStart` é a assinatura das quatro cópias que existiam —
 * tanto na versão em função quanto na escrita direto no JSX.
 */
function formataAMao(fonte: string): boolean {
  return /%\s*60/.test(fonte) && /padStart\(\s*2/.test(fonte);
}

test("ninguém reimplementa a formatação de duração", () => {
  const lista = arquivos(SRC);
  ok(lista.length > 60, `só ${lista.length} arquivos varridos: a varredura quebrou`);
  // Os quatro que motivaram a extração precisam estar na varredura.
  for (const obrigatorio of [
    "componentes/LinhaPonto.tsx",
    "components/LinkVideo.tsx",
    "pages/TelaGiraPublica.tsx",
    "pages/TelaRepertorios.tsx",
  ]) {
    ok(lista.some((c) => c.endsWith(obrigatorio)), `a varredura não alcança ${obrigatorio}`);
  }

  const culpados = lista
    .filter((c) => !c.endsWith(join("lib", "duracao.ts")))
    .filter((c) => formataAMao(readFileSync(c, "utf8")));
  equal(
    culpados.length,
    0,
    "estes arquivos formatam segundos à mão — use `duracao` de `@/lib/duracao`, " +
      "senão o ramo da hora fica de fora e um vídeo de 1h19 vira '79:21':\n" +
      culpados.map((c) => "  " + c.slice(SRC.length + 1)).join("\n"),
  );
});

test("e o detector reconhece o que diz reconhecer", () => {
  // Cerca de ausência não falha quando não há violação: enfraquecer o padrão
  // deixa a lista vazia do mesmo jeito. Então o instrumento é medido contra
  // fonte sintética — a lição que já custou uma mutação sobrevivente.
  ok(formataAMao('{Math.floor(s / 60)}:{String(s % 60).padStart(2, "0")}'));
  ok(formataAMao("const s = segundos % 60;\n  return `${m}:${String(s).padStart(2, '0')}`;"));

  ok(!formataAMao("const tempo = duracao(ponto.videoDuracaoSeg);"), "acusou o caminho certo");
  // `% 60` sozinho é aritmética comum; sem o `padStart` não é formatação.
  ok(!formataAMao("const restante = total % 60;"), "acusou aritmética que não formata nada");
  ok(!formataAMao('nome.padStart(2, "0")'), "acusou um `padStart` que não é de tempo");
});
