/**
 * Os dois ícones da mesma coisa, e o convite que some sem avisar.
 *
 * Publicado o TWA, o Chrome no Android continua oferecendo instalar o PWA — e
 * quem instalou pela loja acaba com dois atalhos idênticos na tela inicial.
 * `related_applications` resolve isso.
 *
 * Só que `prefer_related_applications: true` **cala o convite de instalar o
 * PWA**. Se ele for para o ar antes de o app existir na Play, o Chrome deixa
 * de oferecer a instalação e não oferece nada no lugar: o único canal de
 * distribuição que este produto tem hoje morre em silêncio, sem erro, sem log,
 * e sem ninguém notar até alguém perguntar por que não dá mais para instalar.
 *
 * É por isso que este arquivo existe: o campo perigoso tem de estar amarrado à
 * prova de que o app está mesmo na loja.
 */

import { deepEqual, equal, ok } from "node:assert/strict";
import { test } from "node:test";
import { naPlay, pacote, relacionados } from "../scripts/lojaAndroid.ts";

const PACOTE = "br.com.exemplo.pontos";
const IMPRESSAO = "AA:BB:CC:DD";

test("sem os fatos da Play, o manifest não ganha campo nenhum", () => {
  deepEqual(relacionados({}), {});
  deepEqual(relacionados({ PONTOS_ANDROID_PACOTE: "  " }), {});
});

test("só o nome do pacote NÃO basta — e este é o caso perigoso", () => {
  // Escolher um `applicationId` é de graça e acontece meses antes de publicar.
  // A impressão da chave só sai do Play Console DEPOIS do primeiro envio, e é
  // por isso que ela é a prova. Sem essa distinção, alguém anota o nome do
  // pacote num `.env` e derruba a instalação do PWA sem tocar em código.
  equal(naPlay({ PONTOS_ANDROID_PACOTE: PACOTE }), false);
  deepEqual(relacionados({ PONTOS_ANDROID_PACOTE: PACOTE }), {});
});

test("com os dois, aponta para o app e prefere ele", () => {
  const env = {
    PONTOS_ANDROID_PACOTE: PACOTE,
    PONTOS_ANDROID_FINGERPRINTS: IMPRESSAO,
  };
  const saida = relacionados(env) as {
    related_applications: { platform: string; id: string; url: string }[];
    prefer_related_applications: boolean;
  };
  equal(saida.prefer_related_applications, true);
  deepEqual(saida.related_applications, [
    {
      platform: "play",
      id: PACOTE,
      url: `https://play.google.com/store/apps/details?id=${PACOTE}`,
    },
  ]);
});

test("`prefer_related_applications` nunca aparece sozinho", () => {
  // `true` sem a lista cala o convite do PWA e não aponta para lugar nenhum —
  // o pior dos dois mundos, e é um erro fácil de cometer editando o manifest
  // à mão.
  for (const env of [
    {},
    { PONTOS_ANDROID_PACOTE: PACOTE },
    { PONTOS_ANDROID_FINGERPRINTS: IMPRESSAO },
    { PONTOS_ANDROID_PACOTE: PACOTE, PONTOS_ANDROID_FINGERPRINTS: IMPRESSAO },
  ]) {
    const saida = relacionados(env);
    if ("prefer_related_applications" in saida) {
      ok(
        Array.isArray(saida.related_applications) &&
          (saida.related_applications as unknown[]).length > 0,
        `preferiu um app relacionado sem dizer qual: ${JSON.stringify(saida)}`,
      );
    }
  }
});

test("o id do pacote é escapado na URL da loja", () => {
  const saida = relacionados({
    PONTOS_ANDROID_PACOTE: "br.com.exemplo.pontos&x=1",
    PONTOS_ANDROID_FINGERPRINTS: IMPRESSAO,
  }) as { related_applications: { url: string }[] };
  ok(
    !saida.related_applications[0].url.includes("&x=1"),
    "o id entrou cru na query da Play",
  );
});

test("espaço em volta do valor não conta como valor", () => {
  // `PONTOS_ANDROID_PACOTE=" "` num `.env` mal editado não pode valer como
  // "o app está na Play".
  equal(pacote({ PONTOS_ANDROID_PACOTE: "  " }), "");
  equal(
    naPlay({ PONTOS_ANDROID_PACOTE: PACOTE, PONTOS_ANDROID_FINGERPRINTS: "   " }),
    false,
  );
});

test("é a MESMA variável que a API usa para o assetlinks", () => {
  // Um fato, um nome. Dois nomes para o mesmo pacote é como um dos dois fica
  // desatualizado sem ninguém ver — e aqui o sintoma seria o TWA abrindo com
  // a barra de endereço, que é falha silenciosa.
  const fonte = relacionados.toString() + naPlay.toString() + pacote.toString();
  ok(fonte.includes("PONTOS_ANDROID_PACOTE"));
  ok(fonte.includes("PONTOS_ANDROID_FINGERPRINTS"));
});
