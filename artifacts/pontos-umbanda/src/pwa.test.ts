/**
 * O que o app promete ao navegador, e se o arquivo está lá.
 *
 * Duas invariantes de arquivo, das que somem em silêncio: nada quebra em
 * desenvolvimento, nenhum teste de comportamento percebe, e o defeito só
 * aparece no celular de quem instalou.
 */

import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const RAIZ = join(new URL("..", import.meta.url).pathname);

test("os ícones que o manifest promete existem de verdade", () => {
  // Eles NÃO existiam: a pasta tinha um `icon-192.svg`, e o manifest pedia
  // `icon-192.png` e `icon-512.png`. O Chrome exige um 192 e um 512 em PNG
  // para considerar o app instalável, então o PWA não instalava — e no iPhone
  // o ícone da tela de início ficava em branco, porque o `apple-touch-icon`
  // apontava para o mesmo arquivo ausente.
  const config = readFileSync(join(RAIZ, "vite.config.ts"), "utf8");
  const html = readFileSync(join(RAIZ, "index.html"), "utf8");

  const pedidos = new Set<string>();
  for (const [, src] of config.matchAll(/src:\s*"([^"]+\.(?:png|svg|ico))"/g)) {
    pedidos.add(src.replace(/^\//, ""));
  }
  for (const [, href] of html.matchAll(/href="\/([^"]+\.(?:png|svg|ico))"/g)) {
    pedidos.add(href);
  }

  // Guarda de completude: se a varredura parar de achar o 512, ela virou
  // decoração e passaria a aprovar qualquer coisa.
  assert.ok(
    pedidos.has("icons/icon-512.png"),
    `a varredura não achou o ícone de 512 — leu ${[...pedidos].join(", ")}`,
  );

  const faltando = [...pedidos].filter((p) => !existsSync(join(RAIZ, "public", p)));
  assert.deepEqual(
    faltando,
    [],
    `o manifest/index apontam para arquivo que não existe em public/: ${faltando.join(", ")}. ` +
      "Rode `python scripts/gerar-icones.py` dentro do container.",
  );
});

test("o viewport não bloqueia o zoom", () => {
  // `maximum-scale=1` barrava ampliar a página. Este app é lido cantando, em
  // luz baixa, e boa parte de quem canta tem mais de cinquenta anos — a WCAG
  // 1.4.4 pede 200%.
  const html = readFileSync(join(RAIZ, "index.html"), "utf8");
  const viewport = /<meta name="viewport" content="([^"]+)"/.exec(html)?.[1];
  assert.ok(viewport, "não achei a meta viewport — este teste parou de ler o arquivo");
  assert.doesNotMatch(viewport, /maximum-scale/);
  assert.doesNotMatch(viewport, /user-scalable\s*=\s*no/);
});
