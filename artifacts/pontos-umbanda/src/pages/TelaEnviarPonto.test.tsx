/**
 * Mandar um ponto para a comunidade — e o que a tela promete sobre o destino.
 *
 * Duas coisas precisam ser verdade aqui, e as duas são sobre expectativa, não
 * sobre código: o ponto **não** entra no acervo de todos na hora, e a
 * declaração de direito é consentimento, não formalidade. Errar a primeira faz
 * a pessoa achar que já publicou; errar a segunda põe obra religiosa alheia no
 * acervo com o nome de quem a mandou.
 */

import { deepEqual, equal, match, ok } from "node:assert/strict";
import { test } from "node:test";
import { act } from "react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaEnviarPonto } from "@/pages/TelaEnviarPonto";
import { AppProvider } from "@/context";
import { AuthProvider } from "@/auth/AuthContext";
import type { AppData } from "@/types";

const EU = {
  id: "u1", email: "m@e.com", email_verificado: true,
  apelido: "m", admin: false, foto: null, favoritos_publicos: false,
};

const ACERVO: AppData = {
  orixas: [
    { id: "exu", nome: "Exu", cor: "#000", emoji: "🔱", ordem: 0 },
    { id: "ogum", nome: "Ogum", cor: "#c00", emoji: "⚔️", ordem: 1 },
  ] as AppData["orixas"],
  subcategorias: [],
  pontos: [],
};

async function abrir(resposta?: { status: number; corpo?: unknown }) {
  localStorage.clear();
  localStorage.setItem("pontos-umbanda-data", JSON.stringify(ACERVO));
  const enviados: Record<string, unknown>[] = [];
  const rede = fingirRede((url, init) => {
    if (url.includes("/auth/eu")) return { corpo: EU };
    if (url.includes("/submissoes/ponto")) {
      enviados.push(JSON.parse(String(init?.body)));
      return resposta ?? { status: 201, corpo: { id: "s1" } };
    }
    if (url.includes("/acervo")) {
      return { corpo: { ...ACERVO, acesso: { acervoOrganizado: true }, versao: "v1" } };
    }
    throw new Error(`chamada não prevista: ${init?.method ?? "GET"} ${url}`);
  });
  const { hook } = memoryLocation({ path: "/enviar-ponto" });
  const tela = await renderizar(
    <Router hook={hook}>
      <AuthProvider>
        <AppProvider>
          <TelaEnviarPonto />
        </AppProvider>
      </AuthProvider>
    </Router>,
  );
  await assentar();
  return {
    tela,
    enviados,
    limpar: async () => {
      await tela.desmontar();
      rede.restaurar();
      localStorage.clear();
    },
  };
}

async function preencher(el: Element, texto: string) {
  const proto = el.tagName === "TEXTAREA"
    ? window.HTMLTextAreaElement.prototype
    : window.HTMLInputElement.prototype;
  await act(async () => {
    Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(el, texto);
    el.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
}

async function escolher(el: Element, valor: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value")
      ?.set?.call(el, valor);
    el.dispatchEvent(new window.Event("change", { bubbles: true }));
  });
}

const botaoEnviar = (tela: Tela) =>
  tela.todos("button").find((b) => /Enviar para revisão/.test(b.textContent ?? ""))!;

async function preencherTudo(tela: Tela, { declarar = true } = {}) {
  const campos = tela.todos("input, textarea");
  await preencher(campos[0], "Ponto novo de Ogum");
  const letra = tela.todos("textarea")[0];
  if (letra) await preencher(letra, "a letra inteira");
  const select = tela.todos("select")[0];
  if (select) await escolher(select, "ogum");
  if (declarar) {
    const caixa = tela.todos('input[type="checkbox"]')[0];
    await tela.clicar(caixa);
  }
  await assentar();
}

test("a tela diz ANTES de enviar que o ponto passa por revisão", async () => {
  // "Descobrir depois que não publicou é a pior hora." A frase não pode
  // aparecer só na tela de sucesso.
  const { tela, limpar } = await abrir();
  try {
    match(tela.texto(), /passa antes por revisão/i);
    match(tela.texto(), /aparece no seu acervo imediatamente/i);
  } finally {
    await limpar();
  }
});

test("sem a declaração de direito, o botão não envia", async () => {
  // Consentimento, não formalidade: começa desmarcada e é ela que solta o
  // botão. Sem isso, obra religiosa alheia entra no acervo com o nome de quem
  // a mandou.
  const { tela, enviados, limpar } = await abrir();
  try {
    await preencherTudo(tela, { declarar: false });
    equal(botaoEnviar(tela).hasAttribute("disabled"), true, "o botão soltou sem a declaração");
    await tela.clicar(botaoEnviar(tela));
    await assentar();
    equal(enviados.length, 0, "enviou sem a declaração de direito");
  } finally {
    await limpar();
  }
});

test("sem título ou sem orixá também não envia", async () => {
  const { tela, enviados, limpar } = await abrir();
  try {
    // Só a declaração marcada: falta o resto.
    await tela.clicar(tela.todos('input[type="checkbox"]')[0]);
    await assentar();
    equal(botaoEnviar(tela).hasAttribute("disabled"), true);
    equal(enviados.length, 0);
  } finally {
    await limpar();
  }
});

test("o que sobe é o que ela escreveu, com a declaração junto", async () => {
  const { tela, enviados, limpar } = await abrir();
  try {
    await preencherTudo(tela);
    await tela.clicar(botaoEnviar(tela));
    await assentar();
    equal(enviados.length, 1, `não enviou: ${tela.texto().slice(0, 200)}`);
    deepEqual(
      { titulo: enviados[0].titulo, orixaId: enviados[0].orixaId, declaroDireito: enviados[0].declaroDireito },
      { titulo: "Ponto novo de Ogum", orixaId: "ogum", declaroDireito: true },
    );
  } finally {
    await limpar();
  }
});

test("depois de enviar, a tela repete onde o ponto está e onde ainda não está", async () => {
  const { tela, limpar } = await abrir();
  try {
    await preencherTudo(tela);
    await tela.clicar(botaoEnviar(tela));
    await assentar();
    match(tela.texto(), /em aprovação/i, "não disse que ainda está esperando");
    match(tela.texto(), /entra para todo mundo/i);
  } finally {
    await limpar();
  }
});

test("recusa do servidor sai SEM o 'API <status>' na frente", async () => {
  const { tela, limpar } = await abrir({
    status: 409, corpo: { detail: "Você já enviou este ponto. Aguarde a revisão." },
  });
  try {
    await preencherTudo(tela);
    await tela.clicar(botaoEnviar(tela));
    await assentar();
    const aviso = tela.exigir('[role="alert"]');
    equal(aviso.textContent, "Você já enviou este ponto. Aguarde a revisão.");
    ok(!/API 409/.test(tela.texto()), "vazou o status para quem está no terreiro");
  } finally {
    await limpar();
  }
});
