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
    o_que: "o uso sem internet",
    // "usar offline" / "uso sem internet" / "sem depender de sinal" oferecidos
    // como vantagem. Não casa "continua funcionando sem internet", que diz o
    // contrário — por isso a exigência de vir perto de "plano" ou de uma lista
    // de vantagens é feita pelo filtro de arquivos, e aqui só a OFERTA.
    padrao: /(usar (o app )?(offline|sem internet)|uso (offline|sem internet)|sem depender de sinal)/i,
    desde: "03/09/2026 — ADR 0002 opção (A). O app SEMPRE funcionou offline "
      + "para todos; o que o plano muda é O QUE se leva",
  },
  {
    o_que: "a letra do ponto",
    padrao: /(com o plano[^.]{0,40}\bletras?\b|letras? (é|são) do plano)/i,
    desde: "sempre — a letra é grátis, cobra-se a ferramenta",
  },
];

/**
 * O que o plano TEM, e que a tela de venda precisa dizer.
 *
 * A varredura acima só proíbe. Faltava o outro lado, e o cabeçalho deste
 * arquivo já prometia um `NO_PLANO` que nunca foi escrito: uma tela de venda
 * pode perder o argumento principal em silêncio, e nada quebra — que é o mesmo
 * defeito de cima, só que ao contrário.
 *
 * Em 03/09 o plano ficou com "hierarquia, ordem litúrgica e sync" depois que
 * vídeo e offline saíram, e o dono resumiu assim: *"tô achando muito pobre e
 * sem nenhuma vantagem o plano pago"*. Playlists e artistas entraram (ADR
 * 0012), e é isso que a tela precisa continuar dizendo.
 */
const NO_PLANO: Array<{ o_que: string; padrao: RegExp }> = [
  { o_que: "montar playlists", padrao: /playlists?/i },
  { o_que: "seguir artistas", padrao: /artistas?/i },
  { o_que: "compartilhar por link", padrao: /\blink\b/i },
];

/**
 * TODO arquivo de código que a pessoa lê. **Sem filtro de assunto.**
 *
 * A primeira versão varria só quem mencionasse `/planos`, "Com o plano" ou "do
 * plano". Parecia esperto e era um buraco: `TelaPlanos.tsx` — a TELA DE VENDA —
 * não contém nenhuma das três, e ficava de fora. `TelaRetornoPagamento` também.
 * Uma mutação minha devolvendo "Usar offline, sem depender de sinal" à lista de
 * vantagens **passou**, e eu li o verde como prova.
 *
 * Cerca que decide sozinha o que vale a pena olhar não é cerca. O custo de
 * varrer tudo é ter de reescrever a frase honesta que casa por acidente — foi o
 * que aconteceu com `TelaTermos`, e reescrever custou uma linha.
 */
function telasQueVendem(): string[] {
  const achados: string[] = [];
  const visitar = (dir: string) => {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      const caminho = join(dir, item.name);
      if (item.isDirectory()) {
        visitar(caminho);
      } else if (/\.tsx?$/.test(item.name) && !/\.test\./.test(item.name)) {
        achados.push(caminho);
      }
    }
  };
  visitar(RAIZ);
  return achados;
}

test("nenhuma tela vende o que NÃO é do plano", () => {
  const telas = telasQueVendem();
  // Guarda de completude: uma varredura que não achou nada passa em silêncio, e
  // "0 mentiras em 0 arquivos" é o verde mais perigoso que existe. O número é
  // baixo de propósito — prende a ordem de grandeza, não a contagem do dia.
  ok(telas.length > 100,
     `a varredura só achou ${telas.length} arquivos — o caminho quebrou`);
  ok(telas.some((c) => c.endsWith("TelaPlanos.tsx")),
     "a TELA DE VENDA ficou de fora da varredura — foi o buraco de 03/09");

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


test("a TELA DE VENDA diz o que o plano tem", () => {
  // O contrapeso da varredura de cima. Sem ele, a lista de vantagens podia
  // perder as playlists numa refatoração e o app continuaria verde, vendendo um
  // plano cujo argumento principal ficou de fora.
  const fonte = readFileSync(join(RAIZ, "pages/TelaPlanos.tsx"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

  const faltando = NO_PLANO
    .filter(({ padrao }) => !padrao.test(fonte))
    .map(({ o_que }) => o_que);

  ok(
    faltando.length === 0,
    `a tela de planos não fala de: ${faltando.join(", ")} — ver ADR 0012`,
  );
});
