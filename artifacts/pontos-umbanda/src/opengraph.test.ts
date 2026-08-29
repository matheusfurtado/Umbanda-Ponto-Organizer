/**
 * A prévia do link — que é como este app circula.
 *
 * O canal deste produto é o link colado no grupo do terreiro. Sem OpenGraph o
 * WhatsApp mostrava a URL crua, e URL crua num grupo é o que ninguém abre.
 *
 * O que se prende aqui é a decisão difícil: **sem endereço público, a imagem
 * NÃO sai.** A tentação é publicar `/opengraph.png` e torcer para o crawler
 * resolver — ele não resolve, e o erro é caro porque o WhatsApp cacheia o
 * resultado: um link já compartilhado continua com a prévia quebrada mesmo
 * depois do conserto.
 */

import { equal, match, ok, throws } from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import { ALTURA, IMAGEM, LARGURA, tagsComEndereco } from "../scripts/opengraph.ts";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

test("sem endereço, nenhuma tag de imagem — e o motivo fica escrito", () => {
  for (const vazio of [undefined, "", "   "]) {
    const saida = tagsComEndereco(vazio);
    ok(
      !/<meta[^>]+og:image/.test(saida),
      `gerou tag de imagem sem endereço absoluto: ${saida}`,
    );
    ok(!/<meta[^>]+og:url/.test(saida), "gerou og:url sem endereço");
    // Um comentário no lugar, para quem for procurar por que a prévia não tem
    // imagem não concluir que alguém esqueceu.
    match(saida, /PONTOS_URL_APP/);
  }
});

test("com endereço, a URL da imagem é absoluta", () => {
  const saida = tagsComEndereco("https://pontos.exemplo.com.br");
  match(saida, /property="og:image" content="https:\/\/pontos\.exemplo\.com\.br\/opengraph\.png"/);
  match(saida, /property="og:url" content="https:\/\/pontos\.exemplo\.com\.br\/"/);
  match(saida, /og:image:width" content="1200"/);
  match(saida, /og:image:height" content="630"/);
  match(saida, /og:image:alt"/, "imagem sem texto alternativo");
});

test("barra sobrando no fim não vira barra dobrada", () => {
  // `PONTOS_URL_APP=https://x/` é o jeito que muita gente escreve, e
  // `https://x//opengraph.png` é 404 em vários servidores.
  const saida = tagsComEndereco("https://pontos.exemplo.com.br///");
  ok(!saida.includes(".br//opengraph"), `barra dobrada: ${saida}`);
  match(saida, /content="https:\/\/pontos\.exemplo\.com\.br\/opengraph\.png"/);
});

test("endereço sem esquema derruba o build em vez de gerar tag inválida", () => {
  // Mesma checagem que o `config.py` da API faz, pelo mesmo motivo: sem
  // `https://` a URL não é absoluta, e a prévia não monta. Falhar no build é
  // barato; descobrir depois que o link não abre prévia, não.
  throws(() => tagsComEndereco("pontos.exemplo.com.br"), /não tem esquema/);
});

test("`twitter:card` grande só existe quando há imagem", () => {
  ok(!tagsComEndereco(undefined).includes("summary_large_image"));
  ok(tagsComEndereco("https://x.com.br").includes("summary_large_image"));
});

test("o index.html traz as tags de TEXTO, que não dependem de endereço", () => {
  // Elas sozinhas já transformam a URL crua numa prévia com título e frase.
  const html = readFileSync(join(RAIZ, "index.html"), "utf8");
  for (const tag of ["og:type", "og:site_name", "og:locale", "og:title", "og:description"]) {
    ok(new RegExp(`property="${tag}"`).test(html), `falta ${tag} no index.html`);
  }
  // E NÃO traz as que dependem: se alguém as escrever à mão aqui, elas vão
  // relativas e a prévia quebra.
  ok(
    !/<meta[^>]+property="og:image"/.test(html),
    "og:image escrito à mão no index.html: ele precisa ser absoluto, e quem " +
      "monta isso é o plugin do build",
  );
});

test("a imagem que as tags apontam existe de verdade", () => {
  const bytes = readFileSync(join(RAIZ, "public", IMAGEM.replace(/^\//, "")));
  ok(bytes.length > 5000, `${IMAGEM} tem ${bytes.length} bytes: parece vazio`);
  // As dimensões declaradas têm de bater com o arquivo — declarar tamanho
  // errado faz o crawler reservar o espaço errado e a prévia sair torta. PNG:
  // largura e altura são big-endian nos bytes 16..24.
  equal(bytes.readUInt32BE(16), LARGURA, "a largura declarada não é a do arquivo");
  equal(bytes.readUInt32BE(20), ALTURA, "a altura declarada não é a do arquivo");
});
