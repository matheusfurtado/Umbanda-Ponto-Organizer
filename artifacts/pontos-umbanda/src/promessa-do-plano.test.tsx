/**
 * O que o app promete que o PLANO entrega tem de ser verdade.
 *
 * ## Por que uma varredura, e não um teste por tela
 *
 * Em 03/09 o link do vídeo saiu do plano e passou a ser de todos (ADR 0002).
 * No mesmo dia, DUAS telas continuaram vendendo o vídeo como benefício pago: a
 * faixa do teste e o convite de repertório no Início. Nenhum teste pegou,
 * porque cada tela tinha o seu e nenhum perguntava "isto ainda é verdade?".
 *
 * O que envelhece aqui não é o código, é a FRASE — e frase envelhecida sobre
 * preço não quebra nada: ela só faz o app prometer o que não entrega, e quem
 * descobre já pagou ou já desistiu.
 *
 * Esta varredura é o contrapeso: qualquer tela que passe a vender algo, num
 * texto onde já se fala de plano, é comparada com o que o plano de fato tem.
 *
 * ## Como manter
 *
 * Quando algo mudar de lado no portão, mude `FORA_DO_PLANO` ou `NO_PLANO` — e o
 * teste dirá qual tela ficou para trás.
 */

import { ok } from "node:assert/strict";
import { test } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const RAIZ = new URL("./", import.meta.url).pathname;

/** O que NÃO é do plano — prometer isto é vender o que já é de graça. */
const FORA_DO_PLANO: Array<{ o_que: string; padrao: RegExp; desde: string }> = [
  {
    o_que: "o link do vídeo",
    // "com o vídeo", "o link do vídeo", "vídeo de cada ponto" — as formas de
    // oferecê-lo. Não casa "os vídeos continuam", que diz o contrário.
    padrao: /(com o v[ií]deo|link do v[ií]deo|v[ií]deo de cada ponto)/i,
    desde: "03/09/2026 — ADR 0002, ele protegia 10 de 1.134 pontos",
  },
  {
    o_que: "a letra do ponto",
    padrao: /(com o plano[^.]{0,40}\bletras?\b|letras? (é|são) do plano)/i,
    desde: "sempre — a letra é grátis, cobra-se a ferramenta",
  },
];

/** Onde se fala de plano. Só estes arquivos são varridos. */
function telasQueVendem(): string[] {
  const achados: string[] = [];
  const visitar = (dir: string) => {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      const caminho = join(dir, item.name);
      if (item.isDirectory()) {
        visitar(caminho);
      } else if (/\.tsx?$/.test(item.name) && !/\.test\./.test(item.name)) {
        const fonte = readFileSync(caminho, "utf8");
        if (/\/planos|Com o plano|do plano\b/i.test(fonte)) achados.push(caminho);
      }
    }
  };
  visitar(RAIZ);
  return achados;
}

test("nenhuma tela vende o que NÃO é do plano", () => {
  const telas = telasQueVendem();
  ok(telas.length > 0, "a varredura não achou tela nenhuma que fale de plano");

  const mentiras: string[] = [];
  for (const caminho of telas) {
    const fonte = readFileSync(caminho, "utf8");
    // Só o que a PESSOA lê: comentário de código conta a história e precisa
    // poder citar o que mudou.
    const semComentarios = fonte
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    for (const { o_que, padrao, desde } of FORA_DO_PLANO) {
      if (padrao.test(semComentarios)) {
        mentiras.push(
          `${caminho.replace(RAIZ, "")}: promete ${o_que}, que saiu do plano em ${desde}`,
        );
      }
    }
  }
  ok(mentiras.length === 0, `\n  ${mentiras.join("\n  ")}\n`);
});
