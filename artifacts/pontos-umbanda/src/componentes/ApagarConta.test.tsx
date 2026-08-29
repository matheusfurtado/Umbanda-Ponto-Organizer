/**
 * Apagar a conta — a ação mais irreversível do app.
 *
 * A LGPD dá o direito de eliminação, e aqui ele pesa mais que o normal: a
 * simples existência da conta revela convicção religiosa. Então a tela precisa
 * das duas coisas ao mesmo tempo — deixar a pessoa sumir, e não deixar
 * ninguém sumir sem querer.
 */

import { equal, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { act } from "react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { ApagarConta } from "@/componentes/ApagarConta";
import { AuthProvider } from "@/auth/AuthContext";

/**
 * O `AuthProvider` hidrata `user` de forma SÍNCRONA do `localStorage`
 * (`useState(() => lembrado())`) — é o que faz o app abrir sem piscar "Entrar"
 * para quem já estava logada. Num processo de teste, isso significa que a
 * pessoa do teste anterior continua logada no seguinte.
 *
 * Custou uma mutação sobrevivente no `MenuUsuario`: o cenário "ainda não sei
 * quem é" nunca acontecia, porque o usuário do teste de cima já estava lá.
 */
beforeEach(() => localStorage.clear());


const EU = {
  id: "u1", email: "m@e.com", email_verificado: true,
  apelido: "m", admin: false, foto: null, favoritos_publicos: false,
};

function servidor(resposta?: { status: number; corpo?: unknown }) {
  const tentativas: unknown[] = [];
  const rede = fingirRede((url, init) => {
    if (url.includes("/auth/eu") && init?.method === "DELETE") {
      tentativas.push(JSON.parse(String(init.body)));
      return resposta ?? { status: 204 };
    }
    if (url.includes("/auth/eu")) return { corpo: EU };
    if (url.includes("/auth/sair")) return { status: 204 };
    return { corpo: {} };
  });
  return { tentativas, rede };
}

async function abrir() {
  const { hook } = memoryLocation({ path: "/conta" });
  let fechou = 0;
  const tela = await renderizar(
    <Router hook={hook}>
      <AuthProvider>
        <ApagarConta aberto onFechar={() => { fechou += 1; }} />
      </AuthProvider>
    </Router>,
  );
  await assentar();
  return { tela, fechadas: () => fechou };
}

const campoSenha = (tela: Tela) =>
  tela.todosNaPagina('input[type="password"]')[0];
const botao = (tela: Tela, rotulo: RegExp) =>
  tela.todosNaPagina("button").find((b) => rotulo.test(b.textContent ?? ""))!;

async function digitar(el: Element, texto: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")
      ?.set?.call(el, texto);
    el.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
}

test("o que some e o que FICA vem antes do campo de senha", async () => {
  // "Quem lê 'isto não tem volta' já com a senha digitada lê tarde demais."
  // E dizer o que fica importa: quem teme "levar o acervo junto" acaba não
  // exercendo um direito que é dela.
  const s = servidor();
  try {
    const { tela } = await abrir();
    const texto = tela.textoNaPagina();
    match(texto, /Isto não tem volta/);
    match(texto, /Os pontos que você enviou ficam/);
    match(texto, /nome público fica reservado/i);
    ok(
      texto.indexOf("Isto não tem volta") < texto.indexOf("Confirme com a sua senha"),
      "a senha veio antes do aviso",
    );
    await tela.desmontar();
  } finally {
    s.rede.restaurar();
  }
});

test("sem senha o botão não arma", async () => {
  const s = servidor();
  try {
    const { tela } = await abrir();
    equal(botao(tela, /Apagar para sempre/).hasAttribute("disabled"), true);
    await tela.desmontar();
  } finally {
    s.rede.restaurar();
  }
});

test("com a senha, apaga — e a senha é o que sobe", async () => {
  const s = servidor();
  try {
    const { tela } = await abrir();
    await digitar(campoSenha(tela), "minha-senha-secreta");
    await assentar();
    await tela.clicar(botao(tela, /Apagar para sempre/));
    await assentar();
    equal(s.tentativas.length, 1);
    equal((s.tentativas[0] as { senha: string }).senha, "minha-senha-secreta");
    await tela.desmontar();
  } finally {
    s.rede.restaurar();
  }
});

test("cancelar NÃO deixa o botão armado para a próxima vez", async () => {
  // O `onOpenChange` limpava a senha; o botão "Cancelar" não. Quem digitava,
  // desistia e reabria encontrava o campo cheio e "Apagar para sempre" ACESO —
  // armado antes de a pessoa ter lido uma linha do aviso, que é exatamente o
  // que o desenho desta tela existe para impedir.
  const s = servidor();
  try {
    const { tela, fechadas } = await abrir();
    await digitar(campoSenha(tela), "minha-senha-secreta");
    await assentar();
    await tela.clicar(botao(tela, /^Cancelar$/));
    await assentar();
    equal(fechadas(), 1, "cancelar não fechou");
    equal(
      botao(tela, /Apagar para sempre/).hasAttribute("disabled"),
      true,
      "a senha sobreviveu ao cancelar, e o botão de apagar ficou armado",
    );
    equal((campoSenha(tela) as HTMLInputElement).value, "", "a senha ficou na memória da tela");
    equal(s.tentativas.length, 0);
    await tela.desmontar();
  } finally {
    s.rede.restaurar();
  }
});

test("senha errada explica, e a conta continua de pé", async () => {
  const s = servidor({ status: 403, corpo: { detail: "Senha incorreta." } });
  try {
    const { tela } = await abrir();
    await digitar(campoSenha(tela), "errada");
    await assentar();
    await tela.clicar(botao(tela, /Apagar para sempre/));
    await assentar();
    const aviso = tela.todosNaPagina('[role="alert"]')[0];
    equal(aviso?.textContent, "Senha incorreta.");
    // E dá para tentar de novo: o botão volta.
    equal(botao(tela, /Apagar para sempre/).hasAttribute("disabled"), false);
    await tela.desmontar();
  } finally {
    s.rede.restaurar();
  }
});
