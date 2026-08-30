/**
 * A senha nova, pelo link do e-mail — e o aviso que precisa vir antes.
 *
 * Redefinir **derruba todas as sessões** no servidor. É assim que quem perdeu
 * a conta expulsa quem a tomou, e é por isso que a tela avisa ANTES: a pessoa
 * vai ser deslogada nos outros aparelhos, e descobrir isso depois — no tablet
 * do terreiro, no meio de uma gira — seria assustador sem motivo.
 */

import { equal, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { act } from "react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { janela } from "../../testes/dom.ts";
import { TelaRedefinir } from "@/pages/TelaRedefinir";
import { AuthProvider } from "@/auth/AuthContext";

beforeEach(() => localStorage.clear());

const EU = {
  id: "u1", email: "maria@exemplo.com", email_verificado: true,
  apelido: "pai-joao", admin: false, favoritos_publicos: false, foto: null,
};

async function abrir(
  hashDoLink: string,
  resposta: { status: number; corpo?: unknown } | "rede" = { corpo: EU, status: 200 },
) {
  const enviados: { token: string; senha: string }[] = [];
  const rede = fingirRede((url, init) => {
    if (url.includes("/auth/redefinir")) {
      enviados.push(JSON.parse(String(init?.body)));
      if (resposta === "rede") throw new TypeError("Failed to fetch");
      return resposta;
    }
    if (url.includes("/auth/eu")) return { corpo: EU };
    throw new Error(`chamada não prevista: ${url}`);
  });
  janela.location.hash = hashDoLink;
  const { hook, navigate } = memoryLocation({ path: "/redefinir", record: true });
  const tela = await renderizar(
    <Router hook={hook}>
      <AuthProvider>
        <TelaRedefinir />
      </AuthProvider>
    </Router>,
  );
  await assentar();
  return {
    tela,
    enviados,
    navigate,
    limpar: async () => {
      await tela.desmontar();
      rede.restaurar();
      janela.location.hash = "";
      localStorage.clear();
    },
  };
}

async function digitarSenha(tela: Tela, senha: string) {
  const campo = tela.exigir("#senha");
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")
      ?.set?.call(campo, senha);
    campo.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
  await assentar();
}

const enviar = (tela: Tela) =>
  tela.todos("button").find((b) => b.getAttribute("type") === "submit")!;

test("o aviso de derrubar as outras sessões vem ANTES de salvar", async () => {
  const { tela, limpar } = await abrir("#token=abc123");
  try {
    match(tela.texto(), /sai da conta nos outros aparelhos/);
    // E diz POR QUE, senão parece efeito colateral em vez de proteção.
    match(tela.texto(), /protege quem perdeu o acesso/);
  } finally {
    await limpar();
  }
});

test("link sem token não mostra formulário — mostra como pedir outro", async () => {
  const { tela, limpar } = await abrir("");
  try {
    match(tela.texto(), /Link incompleto/);
    equal(tela.achar("#senha"), null, "ofereceu o campo de senha sem token");
    ok(
      tela.todos("a").some((a) => a.getAttribute("href") === "/recuperar"),
      "disse que o link está quebrado e não ofereceu outro",
    );
  } finally {
    await limpar();
  }
});

test("senha curta não sobe, e a tela diz o mínimo", async () => {
  const { tela, enviados, limpar } = await abrir("#token=abc123");
  try {
    match(tela.texto(), /Pelo menos 10 caracteres/);
    await digitarSenha(tela, "curta");
    equal(enviar(tela).hasAttribute("disabled"), true);
    await tela.clicar(enviar(tela));
    await assentar();
    equal(enviados.length, 0);
  } finally {
    await limpar();
  }
});

test("senha curta não sobe nem pelo ENTER, que passa por fora do botão", async () => {
  // O botão desabilitado é a primeira tranca, e ela é de APRESENTAÇÃO. Apertar
  // Enter dentro do formulário dispara `submit` sem passar por ele — e é o
  // gesto natural de quem acabou de digitar a senha.
  //
  // Sem esta segunda tranca, uma senha de 5 caracteres subiria, o servidor
  // recusaria com 422, e a pessoa leria uma mensagem de erro para uma regra
  // que a tela mostrou e não cobrou.
  const { tela, enviados, limpar } = await abrir("#token=abc123");
  try {
    await digitarSenha(tela, "curta");
    await act(async () => {
      tela.exigir("form").dispatchEvent(
        new window.Event("submit", { bubbles: true, cancelable: true }),
      );
    });
    await assentar();
    equal(enviados.length, 0, "o Enter passou por cima do mínimo de senha");
  } finally {
    await limpar();
  }
});

test("o token do link é o que sobe, junto com a senha", async () => {
  const { tela, enviados, limpar } = await abrir("#token=abc123");
  try {
    await digitarSenha(tela, "uma-frase-que-eu-lembro");
    await tela.clicar(enviar(tela));
    await assentar();
    equal(enviados.length, 1);
    equal(enviados[0].token, "abc123");
    equal(enviados[0].senha, "uma-frase-que-eu-lembro");
  } finally {
    await limpar();
  }
});

test("link gasto ou expirado é dito com as palavras do servidor", async () => {
  // É o servidor que sabe se o token expirou, se já foi usado, ou se nunca
  // existiu — e as três levam a ações diferentes de quem lê.
  const { tela, limpar } = await abrir("#token=velho", {
    status: 400, corpo: { detail: "Link inválido ou expirado. Peça um novo." },
  });
  try {
    await digitarSenha(tela, "uma-frase-que-eu-lembro");
    await tela.clicar(enviar(tela));
    await assentar();
    equal(tela.exigir('[role="alert"]').textContent, "Link inválido ou expirado. Peça um novo.");
    ok(!/API 400/.test(tela.texto()), "vazou o status");
  } finally {
    await limpar();
  }
});

test("sem conexão não vira 'link inválido'", async () => {
  // Culpar o link por uma falha de rede manda a pessoa pedir outro e-mail à
  // toa — e o link que ela tem continua bom.
  const { tela, limpar } = await abrir("#token=abc123", "rede");
  try {
    await digitarSenha(tela, "uma-frase-que-eu-lembro");
    await tela.clicar(enviar(tela));
    await assentar();
    match(tela.texto(), /Sem conexão/);
    ok(!/inválido|expirado/i.test(tela.texto()), "culpou o link por falta de rede");
  } finally {
    await limpar();
  }
});
