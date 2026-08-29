/**
 * As giras — e o único lugar do app onde apagar não perguntava nada.
 *
 * O docstring desta tela diz onde ela é usada: "celular na mão, luz baixa,
 * gente esperando. Por isso alvos grandes, e nada que exija precisão de mira."
 * A lixeira ficava a 16px do canto do cartão, colada no alvo principal, e
 * VISÍVEL no toque — `[@media(hover:hover)]:opacity-0` só a esconde onde há
 * mouse. Um toque e o `DELETE` saía.
 */

import { equal, match, ok } from "node:assert/strict";
import { test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaRepertorios } from "@/pages/TelaRepertorios";
import { AppProvider } from "@/context";
import { AuthProvider } from "@/auth/AuthContext";
import type { AppData } from "@/types";

const EU = {
  id: "u1", email: "m@e.com", email_verificado: true,
  apelido: "m", admin: false, foto: null, favoritos_publicos: false,
};

const ACERVO: AppData = {
  orixas: [{ id: "ogum", nome: "Ogum", cor: "#c00", emoji: "⚔️", ordem: 0 }] as AppData["orixas"],
  subcategorias: [],
  pontos: [{
    id: "p1", subcategoriaId: "", orixaId: "ogum", titulo: "Ogum de Lei",
    letra: "l", favorito: false, ordem: 0, criadoEm: 0,
  }],
};

const GIRAS = [
  { id: "g1", nome: "Gira de sexta", ordem: 0, versao: "v1",
    itens: [{ pontoId: "p1", secao: null, ordem: 0 }] },
  { id: "g2", nome: "Festa de Exu", ordem: 1, versao: "v1", itens: [] },
];

interface Cenario {
  /** O que o DELETE responde. */
  delete?: { status: number; corpo?: unknown } | "rede";
}

async function abrir(c: Cenario = {}) {
  localStorage.clear();
  localStorage.setItem("pontos-umbanda-data", JSON.stringify(ACERVO));
  const apagados: string[] = [];
  const rede = fingirRede((url, init) => {
    if (url.includes("/auth/eu")) return { corpo: EU };
    if (url.includes("/meus-direitos")) return { corpo: { plano: "mensal", repertorios: true, sync: true } };
    if (url.includes("/acervo")) return { corpo: { ...ACERVO, acesso: { acervoOrganizado: true }, versao: "v1" } };
    if (init?.method === "DELETE" && /\/repertorios\/[^/]+$/.test(url)) {
      apagados.push(url.split("/").pop()!);
      if (c.delete === "rede") throw new TypeError("Failed to fetch");
      return c.delete ?? { status: 204 };
    }
    if (/\/repertorios$/.test(url)) return { corpo: GIRAS };
    throw new Error(`chamada não prevista: ${init?.method ?? "GET"} ${url}`);
  });
  const { hook } = memoryLocation({ path: "/repertorios" });
  const tela = await renderizar(
    <Router hook={hook}>
      <AuthProvider>
        <AppProvider>
          <TelaRepertorios />
        </AppProvider>
      </AuthProvider>
    </Router>,
  );
  await assentar();
  return {
    tela,
    apagados,
    limpar: async () => {
      await tela.desmontar();
      rede.restaurar();
      localStorage.clear();
    },
  };
}

const lixeiraDe = (tela: Tela, nome: string) =>
  tela.todosNaPagina("button").find((b) => b.getAttribute("aria-label") === `Apagar ${nome}`);

const botaoDoDialogo = (tela: Tela, rotulo: RegExp) =>
  tela.todosNaPagina("button").find((b) => rotulo.test(b.textContent ?? ""));

test("a lixeira PERGUNTA antes de apagar, e diz o que se perde", async () => {
  const { tela, apagados, limpar } = await abrir();
  try {
    const lixeira = lixeiraDe(tela, "Gira de sexta");
    ok(lixeira, `sem lixeira em: ${tela.texto().slice(0, 200)}`);
    await tela.clicar(lixeira);
    await assentar();

    equal(apagados.length, 0, "apagou antes de perguntar");
    match(tela.textoNaPagina(), /Apagar “Gira de sexta”\?/);
    match(tela.textoNaPagina(), /não pode ser desfeito/i);
    // O que NÃO se perde importa tanto quanto o que se perde.
    match(tela.textoNaPagina(), /os pontos continuam no acervo/i);
    match(tela.textoNaPagina(), /1 ponto\b/, "não disse o tamanho da gira");
  } finally {
    await limpar();
  }
});

test("cancelar não apaga, e a gira continua na lista", async () => {
  const { tela, apagados, limpar } = await abrir();
  try {
    await tela.clicar(lixeiraDe(tela, "Gira de sexta")!);
    await assentar();
    await tela.clicar(botaoDoDialogo(tela, /^Cancelar$/)!);
    await assentar();
    equal(apagados.length, 0, "cancelar apagou mesmo assim");
    match(tela.texto(), /Gira de sexta/);
  } finally {
    await limpar();
  }
});

test("confirmar apaga a ESCOLHIDA, e não a primeira da lista", async () => {
  // As duas posições, de propósito. A primeira versão só apagava a gira do
  // topo, e a mutação "apaga sempre `lista[0]`" sobrevivia — o teste estava
  // concordando com o código em vez de interrogá-lo. É a mesma armadilha da
  // fixture já ordenada do `CardPonto`.
  for (const [nome, id, sobrevivente] of [
    ["Festa de Exu", "g2", "Gira de sexta"],
    ["Gira de sexta", "g1", "Festa de Exu"],
  ] as const) {
    const { tela, apagados, limpar } = await abrir();
    try {
      await tela.clicar(lixeiraDe(tela, nome)!);
      await assentar();
      await tela.clicar(botaoDoDialogo(tela, /^Excluir$/)!);
      await assentar();
      equal(apagados.join(","), id, `mandou apagar ${nome} e o servidor recebeu outro id`);
      ok(!tela.texto().includes(nome), "apagou no servidor e deixou na tela");
      match(tela.texto(), new RegExp(sobrevivente), "levou junto a que ninguém mandou apagar");
    } finally {
      await limpar();
    }
  }
});

test("apagar sem rede: a gira FICA, e a mensagem diz por quê", async () => {
  const { tela, limpar } = await abrir({ delete: "rede" });
  try {
    await tela.clicar(lixeiraDe(tela, "Gira de sexta")!);
    await assentar();
    await tela.clicar(botaoDoDialogo(tela, /^Excluir$/)!);
    await assentar();
    match(tela.texto(), /Apagar um repertório precisa de internet/);
    match(tela.texto(), /Gira de sexta/, "sumiu da tela sem ter sumido do servidor");
  } finally {
    await limpar();
  }
});

test("a lixeira não depende de hover para existir — é onde ela é usada", async () => {
  // Mesma armadilha do `LinhaPonto`: `opacity-0` cru some no toque, e some
  // continuando clicável.
  const { tela, limpar } = await abrir();
  try {
    const classe = lixeiraDe(tela, "Gira de sexta")!.getAttribute("class") ?? "";
    ok(
      !classe.split(/\s+/).includes("opacity-0"),
      "a lixeira some no celular, que é onde esta tela é usada",
    );
  } finally {
    await limpar();
  }
});
