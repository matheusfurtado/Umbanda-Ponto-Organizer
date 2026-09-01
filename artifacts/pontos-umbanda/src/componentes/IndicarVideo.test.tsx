/**
 * Indicar o vídeo de onde a pessoa estiver.
 *
 * Quem sabe a gravação de um ponto quase nunca chegou por uma página chamada
 * "pontos sem vídeo": chegou procurando o ponto no orixá dele, para cantar. O
 * momento em que reconhece a letra é o momento em que lembra do vídeo.
 */

import { deepEqual, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { assentar, renderizar } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { IndicarVideo, idCanonico } from "@/componentes/IndicarVideo";
import type { Ponto } from "@/types";

beforeEach(() => localStorage.clear());

const PONTO = {
  id: "p1", subcategoriaId: "s1", titulo: "Ponto de Ogum", letra: "l",
  favorito: false, ordem: 0, criadoEm: 0,
} as Ponto;

async function abrir(ponto: Ponto = PONTO, resposta?: { status: number; corpo?: unknown }) {
  const chamadas: string[] = [];
  const rede = fingirRede((url, init) => {
    if (url.includes("/indicar-video")) {
      chamadas.push(url);
      return resposta ?? {
        status: 201,
        corpo: { videoId: "abcdefghijk", recado: "Obrigado!" },
      };
    }
    return { corpo: {} };
  });
  const tela = await renderizar(<IndicarVideo ponto={ponto} />);
  await assentar();
  return {
    tela, chamadas,
    limpar: async () => { await tela.desmontar(); rede.restaurar(); },
  };
}

test("o id que vai é o CANÔNICO, não o da cópia de quem organizou", () => {
  // Quem organiza o acervo tem cópia pessoal de cada ponto (ADR 0005), com id
  // prefixado — e é exatamente quem paga. A rota só aceita canônico: mandar
  // `ponto.id` faria a indicação responder 404 para o assinante e funcionar
  // para quem nunca organizou nada.
  deepEqual(idCanonico(PONTO), "p1");
  deepEqual(
    idCanonico({ ...PONTO, id: "abc12345:p1", origemId: "p1" } as Ponto),
    "p1",
  );
});

test("indicar manda o link para o ponto certo", async () => {
  const copia = { ...PONTO, id: "abc12345:p1", origemId: "p1" } as Ponto;
  const { tela, chamadas, limpar } = await abrir(copia);
  try {
    await tela.clicar(tela.exigir("button"));
    await assentar();
    const campo = tela.todosNaPagina("input[type=url]")[0];
    ok(campo, "o diálogo não abriu com o campo do link");
    await tela.mudar(campo, "https://youtu.be/abcdefghijk");
    const enviar = tela
      .todosNaPagina("button")
      .find((b) => /Indicar/.test(b.textContent ?? ""));
    await tela.clicar(enviar!);
    await assentar();

    deepEqual(chamadas.length, 1);
    ok(
      chamadas[0].includes("/pontos/p1/indicar-video"),
      `mandou para o id da cópia em vez do canônico: ${chamadas[0]}`,
    );
  } finally {
    await limpar();
  }
});

test("depois de indicar, a linha diz que está esperando conferência", async () => {
  // Sem sinal, a pessoa não sabe se o clique pegou e indica de novo — e a
  // segunda vez volta 409.
  const { tela, limpar } = await abrir();
  try {
    await tela.clicar(tela.exigir("button"));
    await assentar();
    await tela.mudar(tela.todosNaPagina("input[type=url]")[0], "https://youtu.be/abcdefghijk");
    await tela.clicar(
      tela.todosNaPagina("button").find((b) => /Indicar/.test(b.textContent ?? ""))!,
    );
    await assentar();
    // No `aria-label` e no `title`, não no texto: a linha do ponto é uma fila
    // de ícones, e uma frase ali empurraria o título para fora em telefone. O
    // que a pessoa vê é o ícone mudar de "sem vídeo" para "conferido"; o que
    // ela ouve, e lê ao parar o cursor, é a frase inteira.
    const marca = tela
      .todos("span")
      .find((s) => /esperando conferência/.test(s.getAttribute("aria-label") ?? ""));
    ok(marca, "a linha não avisa que a indicação foi enviada");
    ok(
      tela.naoTem("button"),
      "continuou oferecendo indicar depois de indicado — a segunda vez volta 409",
    );
  } finally {
    await limpar();
  }
});

test("o erro do servidor é dito com as palavras dele", async () => {
  const { tela, limpar } = await abrir(PONTO, {
    status: 409, corpo: { detail: "Esse vídeo já foi indicado para este ponto." },
  });
  try {
    await tela.clicar(tela.exigir("button"));
    await assentar();
    await tela.mudar(tela.todosNaPagina("input[type=url]")[0], "https://youtu.be/abcdefghijk");
    await tela.clicar(
      tela.todosNaPagina("button").find((b) => /Indicar/.test(b.textContent ?? ""))!,
    );
    await assentar();
    match(tela.textoNaPagina(), /já foi indicado/);
    ok(!/API 409/.test(tela.textoNaPagina()), "vazou o status para a tela");
  } finally {
    await limpar();
  }
});
