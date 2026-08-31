/**
 * Criar um ponto — e o autor que se perdia no caminho.
 *
 * O `ModalPonto` sempre teve o campo "Autor (se você souber)" e sempre chamou
 * `onSalvar(titulo, letra, autor)`. Editar preservava (`CardPonto.tsx:197`);
 * CRIAR descartava: o handler daqui recebia só `(titulo, letra)` e a própria
 * assinatura de `adicionarPonto` no `context` não tinha o terceiro parâmetro.
 * O TypeScript não pega — callback com menos parâmetros é legal.
 *
 * Cópia divergente clássica, e o que divergia é autoria de obra religiosa: a
 * pessoa digitava o nome de quem fez o ponto, o ponto nascia sem ele, e nada
 * avisava. Ela só descobriria reabrindo o ponto em Editar e achando o campo
 * vazio.
 */

import { match, ok } from "node:assert/strict";
import { act } from "react";
import { beforeEach, test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { descartarPendente } from "@/dados/repositorio";
import { TelaSubcategorias } from "@/pages/TelaSubcategorias";
import { AppProvider } from "@/context";
import { AuthProvider } from "@/auth/AuthContext";
import { EntitlementsProvider } from "@/billing/EntitlementsContext";
import type { AppData, Orixa } from "@/types";

beforeEach(() => localStorage.clear());

const EU = {
  id: "u1", email: "m@e.com", email_verificado: true,
  apelido: "m", admin: false, foto: null, favoritos_publicos: false,
};

const OGUM = {
  id: "ogum", nome: "Ogum", cor: "#c00", emoji: "⚔️", ordem: 0,
} as unknown as Orixa;

/** Uma seção VAZIA: é ela que oferece o "+ Adicionar ponto" direto na lista. */
const ACERVO: AppData = {
  orixas: [OGUM] as AppData["orixas"],
  subcategorias: [{ id: "s1", orixaId: "ogum", nome: "Chegada", ordem: 0, criadoEm: 0 }],
  pontos: [],
};

async function abrir() {
  localStorage.setItem("pontos-umbanda-data", JSON.stringify(ACERVO));
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) return { corpo: EU };
    if (url.includes("/meus-direitos")) return { corpo: { plano: "pago", repertorios: true } };
    if (url.includes("/acervo")) {
      return { corpo: { ...ACERVO, acesso: { acervoOrganizado: true }, versao: "v1" } };
    }
    throw new Error(`chamada não prevista: ${url}`);
  });
  const tela = await renderizar(
    <Router hook={memoryLocation({ path: "/organizar" }).hook}>
      <AuthProvider>
        <EntitlementsProvider>
          <AppProvider>
            <TelaSubcategorias orixa={OGUM} onVoltar={() => {}} />
          </AppProvider>
        </EntitlementsProvider>
      </AuthProvider>
    </Router>,
  );
  await assentar();
  return {
    tela,
    limpar: async () => {
      await tela.desmontar();
      // A fila de envio é estado de MÓDULO e sobrevive à desmontagem: criar um
      // ponto agenda um `PUT` para daqui a 1,5 s, que dispararia depois de a
      // rede falsa ter saído — e aí o processo do teste não termina mais
      // ("Promise resolution is still pending but the event loop has already
      // resolved"). É a mesma limpeza que `dados/repositorio.test.ts` faz.
      descartarPendente();
      rede.restaurar();
      localStorage.clear();
    },
  };
}

/** O diálogo mora num portal — fora do container do render. */
const botao = (tela: Tela, texto: RegExp) =>
  tela.todosNaPagina("button").find((b) => texto.test(b.textContent ?? ""));

async function digitar(seletor: string, valor: string) {
  const campo = document.querySelector(seletor);
  ok(campo, `campo ${seletor} não existe no diálogo`);
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")
      ?.set?.call(campo, valor);
    campo.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
  await assentar();
}

test("o autor digitado ao CRIAR chega ao ponto", async () => {
  const { tela, limpar } = await abrir();
  try {
    await tela.clicar(botao(tela, /Adicionar ponto/)!);
    await assentar();
    await digitar("#titulo-ponto", "Ogum de Lei");
    await digitar("#autor-ponto", "Zé Pilintra");
    await tela.clicar(botao(tela, /^Criar$/)!);
    await assentar();

    match(tela.texto(), /Ogum de Lei/, "o ponto nem foi criado");
    match(tela.texto(), /Zé Pilintra/, "o autor foi descartado entre o modal e o context");
  } finally {
    await limpar();
  }
});

test("autor em branco não vira crédito vazio", async () => {
  // "Um 'Autor: desconhecido' fixo em 520 pontos é ruído em toda linha da
  // lista — e sugere lacuna a preencher onde não há lacuna: a tradição é
  // oral." Por isso `""` precisa virar `null`, e não string vazia.
  const { tela, limpar } = await abrir();
  try {
    await tela.clicar(botao(tela, /Adicionar ponto/)!);
    await assentar();
    await digitar("#titulo-ponto", "Ponto sem autoria");
    await tela.clicar(botao(tela, /^Criar$/)!);
    await assentar();

    match(tela.texto(), /Ponto sem autoria/);
    const guardado = JSON.parse(localStorage.getItem("pontos-umbanda-data") ?? "{}");
    const novo = guardado.pontos?.find((p: { titulo: string }) => p.titulo === "Ponto sem autoria");
    ok(novo, "o ponto não chegou ao acervo guardado");
    ok(
      novo.autor === null,
      `autor em branco virou ${JSON.stringify(novo.autor)} em vez de null`,
    );
  } finally {
    await limpar();
  }
});

test("o autor sobrevive ao acervo guardado, e não só à tela", async () => {
  // O que a tela mostra pode vir do estado em memória; o que importa é o que
  // fica no aparelho, porque é o que sobe para a conta.
  const { tela, limpar } = await abrir();
  try {
    await tela.clicar(botao(tela, /Adicionar ponto/)!);
    await assentar();
    await digitar("#titulo-ponto", "Ponto com autoria");
    await digitar("#autor-ponto", "  Mãe Menininha  ");
    await tela.clicar(botao(tela, /^Criar$/)!);
    await assentar();

    const guardado = JSON.parse(localStorage.getItem("pontos-umbanda-data") ?? "{}");
    const novo = guardado.pontos?.find((p: { titulo: string }) => p.titulo === "Ponto com autoria");
    ok(novo, "o ponto não chegou ao acervo guardado");
    // Aparado nas duas pontas: " Mãe Menininha " e "Mãe Menininha" divergem no
    // primeiro `===`, e crédito é campo de comparação.
    ok(novo.autor === "Mãe Menininha", `autor guardado como ${JSON.stringify(novo.autor)}`);
  } finally {
    await limpar();
  }
});
