/**
 * O nome público — que é também o endereço do perfil.
 *
 * Trocar não é mudar um rótulo: é MOVER a página. O link que a pessoa colou no
 * grupo do terreiro para de abrir. Por isso a tela avisa antes, e por isso um
 * "Trocar" acionado por engano custa caro.
 */

import { equal, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { act } from "react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TrocarApelido } from "@/componentes/TrocarApelido";
import { AuthProvider } from "@/auth/AuthContext";

beforeEach(() => localStorage.clear());

const EU = {
  id: "u1", email: "maria@exemplo.com", email_verificado: true,
  admin: false, favoritos_publicos: false, foto: null,
};

function servidor(apelidoAtual: string | null, resposta?: { status: number; corpo?: unknown }) {
  const enviados: string[] = [];
  const rede = fingirRede((url, init) => {
    if (url.includes("/auth/apelido")) {
      enviados.push(JSON.parse(String(init?.body)).apelido);
      return resposta ?? { corpo: { ...EU, apelido: JSON.parse(String(init?.body)).apelido } };
    }
    if (url.includes("/auth/eu")) return { corpo: { ...EU, apelido: apelidoAtual } };
    throw new Error(`chamada não prevista: ${url}`);
  });
  return { enviados, rede };
}

async function abrir(apelidoAtual: string | null, resposta?: { status: number; corpo?: unknown }) {
  const s = servidor(apelidoAtual, resposta);
  const { hook } = memoryLocation({ path: "/conta" });
  const fechamentos: (string | undefined)[] = [];
  const tela = await renderizar(
    <Router hook={hook}>
      <AuthProvider>
        <TrocarApelido aberto onFechar={(novo) => fechamentos.push(novo)} />
      </AuthProvider>
    </Router>,
  );
  await assentar();
  return {
    tela,
    enviados: s.enviados,
    fechamentos,
    limpar: async () => {
      await tela.desmontar();
      s.rede.restaurar();
      localStorage.clear();
    },
  };
}

const campo = (tela: Tela) =>
  tela.todosNaPagina("input#apelido-novo")[0] as HTMLInputElement;
const botao = (tela: Tela, rotulo: RegExp) =>
  tela.todosNaPagina("button").find((b) => rotulo.test(b.textContent ?? ""));

async function digitar(el: Element, texto: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")
      ?.set?.call(el, texto);
    el.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
}

test("quem nunca escolheu não é assustado com aviso de link quebrado", async () => {
  // "Avisar sobre trocar de nome a quem está escolhendo o primeiro é assustar
  // sem motivo."
  const { tela, limpar } = await abrir(null);
  try {
    await digitar(campo(tela), "Terreiro de Ogum");
    await assentar();
    ok(!/Links antigos param de abrir/.test(tela.textoNaPagina()));
    ok(botao(tela, /^Escolher$/), "o botão devia dizer Escolher na primeira vez");
  } finally {
    await limpar();
  }
});

test("quem já tem nome é avisado de que a URL muda ANTES de trocar", async () => {
  const { tela, limpar } = await abrir("Pai João");
  try {
    await digitar(campo(tela), "Terreiro de Ogum");
    await assentar();
    const texto = tela.textoNaPagina();
    match(texto, /Links antigos param de abrir/);
    match(texto, /\/perfil\/Pai João/, "não mostrou de onde sai");
    match(texto, /\/perfil\/Terreiro de Ogum/, "não mostrou para onde vai");
    // E a boa notícia junto: é a pergunta que a pessoa faz ao hesitar.
    match(texto, /fica reservado para você/);
  } finally {
    await limpar();
  }
});

test("só mudar a caixa não conta como troca", async () => {
  const { tela, limpar } = await abrir("Pai João");
  try {
    await digitar(campo(tela), "pai joão");
    await assentar();
    ok(
      !/Links antigos param de abrir/.test(tela.textoNaPagina()),
      "assustou por uma mudança que o servidor trata como a mesma pessoa",
    );
  } finally {
    await limpar();
  }
});

test("cancelar devolve o campo ao nome atual — e desarma o Trocar", async () => {
  // O defeito. O X e o Esc limpavam; o botão "Cancelar" não. Quem digitava,
  // desistia e reabria encontrava o nome abandonado no campo, o aviso amarelo
  // dizendo que a URL ia mudar, e "Trocar" aceso. Um toque e o endereço
  // público virava um nome que ela decidiu não usar.
  const { tela, enviados, fechamentos, limpar } = await abrir("Pai João");
  try {
    await digitar(campo(tela), "Nome que desisti");
    await assentar();
    await tela.clicar(botao(tela, /^Cancelar$/)!);
    await assentar();

    equal(fechamentos.length, 1);
    equal(fechamentos[0], undefined, "cancelar avisou como se tivesse trocado");
    equal(campo(tela).value, "Pai João", "o nome abandonado ficou no campo");
    ok(
      !/Links antigos param de abrir/.test(tela.textoNaPagina()),
      "o aviso de troca sobreviveu ao cancelar",
    );
    equal(enviados.length, 0);
  } finally {
    await limpar();
  }
});

test("nome curto demais não sobe", async () => {
  const { tela, enviados, limpar } = await abrir(null);
  try {
    await digitar(campo(tela), "a");
    await assentar();
    equal(botao(tela, /^Escolher$/)!.hasAttribute("disabled"), true);
    equal(enviados.length, 0);
  } finally {
    await limpar();
  }
});

test("o que sobe é o nome sem espaço em volta", async () => {
  const { tela, enviados, fechamentos, limpar } = await abrir(null);
  try {
    await digitar(campo(tela), "  Terreiro de Ogum  ");
    await assentar();
    await tela.clicar(botao(tela, /^Escolher$/)!);
    await assentar();
    equal(enviados[0], "Terreiro de Ogum");
    equal(fechamentos[0], "Terreiro de Ogum", "quem chamou não soube o nome novo");
  } finally {
    await limpar();
  }
});

test("apelido em uso é dito com as palavras do servidor", async () => {
  const { tela, limpar } = await abrir("Pai João", {
    status: 409, corpo: { detail: "Este apelido já está em uso." },
  });
  try {
    await digitar(campo(tela), "Terreiro de Ogum");
    await assentar();
    await tela.clicar(botao(tela, /^Trocar$/)!);
    await assentar();
    const aviso = tela.todosNaPagina('[role="alert"]')[0];
    equal(aviso?.textContent, "Este apelido já está em uso.");
    ok(!/API 409/.test(tela.textoNaPagina()), "vazou o status para a tela");
  } finally {
    await limpar();
  }
});
