/**
 * Sugerir quem compôs um ponto.
 *
 * "Autoria de obra religiosa atribuída errado circula e vira referência. Não é
 * erro que se conserta depois." Por isso a sugestão não muda o ponto na hora —
 * vai para revisão —, e por isso um envio acionado por engano custa caro.
 */

import { deepEqual, equal, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { act } from "react";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { SugerirAutor } from "@/componentes/SugerirAutor";
import type { Ponto } from "@/types";

beforeEach(() => localStorage.clear());

const PONTO: Ponto = {
  id: "og-1", subcategoriaId: "s1", titulo: "Ogum de Lei",
  letra: "l", favorito: false, ordem: 0, criadoEm: 0,
};

function servidor(resposta?: { status: number; corpo?: unknown }) {
  const enviados: { pontoId: string; autor: string }[] = [];
  const rede = fingirRede((url, init) => {
    if (url.includes("/submissoes/autor")) {
      enviados.push(JSON.parse(String(init?.body)));
      return resposta ?? { status: 201, corpo: { id: "s1" } };
    }
    throw new Error(`chamada não prevista: ${url}`);
  });
  return { enviados, rede };
}

async function abrir(ponto: Ponto | null = PONTO, resposta?: { status: number; corpo?: unknown }) {
  const s = servidor(resposta);
  const tela = await renderizar(<SugerirAutor ponto={ponto} onFechar={() => {}} />);
  await assentar();
  return {
    tela,
    enviados: s.enviados,
    limpar: async () => {
      await tela.desmontar();
      s.rede.restaurar();
    },
  };
}

const campo = (tela: Tela) => tela.todosNaPagina("input[aria-label='Autor']")[0] as HTMLInputElement;
const botao = (tela: Tela, r: RegExp) =>
  tela.todosNaPagina("button").find((b) => r.test(b.textContent ?? ""));

async function digitar(tela: Tela, texto: string) {
  const el = campo(tela);
  ok(el, "não achei o campo de autor");
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")
      ?.set?.call(el, texto);
    el.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
  await assentar();
}

test("a tela diz que passa por revisão ANTES de enviar", async () => {
  // "Em quase todo app, o que você escreve aparece." A expectativa contrária é
  // razoável, e desfazê-la depois é tarde.
  const { tela, limpar } = await abrir();
  try {
    match(tela.textoNaPagina(), /passa por revisão/);
    // E o conselho que evita a maior parte dos erros.
    match(tela.textoNaPagina(), /se não tiver certeza, é melhor não indicar/i);
  } finally {
    await limpar();
  }
});

test("campo vazio não sugere nada", async () => {
  const { tela, enviados, limpar } = await abrir();
  try {
    equal(botao(tela, /Sugerir autor/)!.hasAttribute("disabled"), true);
    await tela.clicar(botao(tela, /Sugerir autor/)!);
    await assentar();
    equal(enviados.length, 0);
  } finally {
    await limpar();
  }
});

test("o que sobe é o nome aparado, com o id do ponto", async () => {
  const { tela, enviados, limpar } = await abrir();
  try {
    await digitar(tela, "  Zé Pilintra  ");
    await tela.clicar(botao(tela, /Sugerir autor/)!);
    await assentar();
    deepEqual(enviados, [{ pontoId: "og-1", autor: "Zé Pilintra" }]);
  } finally {
    await limpar();
  }
});

test("desistir não deixa o nome pronto para virar sugestão", async () => {
  // O `useEffect` reseta quando o PONTO muda. Reabrir o MESMO ponto não
  // dispara efeito nenhum — e o nome descartado ficava lá, com o botão aceso.
  // Um toque manda para revisão uma autoria que a pessoa decidiu não sugerir,
  // sobre obra religiosa.
  const { tela, enviados, limpar } = await abrir();
  try {
    await digitar(tela, "Chute que apaguei da cabeça");
    // Fecha pelo `Dialog` (Esc / clique fora), que é o caminho de desistir.
    await act(async () => {
      tela
        .todosNaPagina("[role=dialog]")[0]
        ?.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    await assentar();
    // Reabre o MESMO ponto: mesma prop, nenhum efeito dispara.
    await tela.reRenderizar(<SugerirAutor ponto={PONTO} onFechar={() => {}} />);
    await assentar();

    equal(campo(tela)?.value, "", "o nome descartado ficou no campo");
    equal(botao(tela, /Sugerir autor/)!.hasAttribute("disabled"), true);
    equal(enviados.length, 0);
  } finally {
    await limpar();
  }
});

test("o ponto que já tem autor abre com ele — é 'corrigir', não 'inventar'", async () => {
  const { tela, limpar } = await abrir({ ...PONTO, autor: "Autor atual" });
  try {
    equal(campo(tela)?.value, "Autor atual");
  } finally {
    await limpar();
  }
});

test("sugestão repetida é dita com as palavras do servidor", async () => {
  const { tela, limpar } = await abrir(PONTO, {
    status: 409, corpo: { detail: "Você já sugeriu um autor para este ponto. Aguarde a revisão." },
  });
  try {
    await digitar(tela, "Zé Pilintra");
    await tela.clicar(botao(tela, /Sugerir autor/)!);
    await assentar();
    match(tela.textoNaPagina(), /Aguarde a revisão/);
    ok(!/API 409/.test(tela.textoNaPagina()), "vazou o status");
  } finally {
    await limpar();
  }
});
