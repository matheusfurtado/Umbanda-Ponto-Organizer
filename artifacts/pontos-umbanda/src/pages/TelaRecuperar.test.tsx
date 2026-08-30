/**
 * Pedir o link de senha nova — e o que a tela não pode contar.
 *
 * Num app de Umbanda, saber quem tem conta é saber quem é de Umbanda. O
 * servidor responde **204 sempre**, exista o e-mail ou não, e igualou até o
 * relógio (o envio do e-mail foi para depois da resposta, senão o tempo do
 * handshake SMTP dizia quem existe). A tela pode desfazer isso com uma frase.
 */

import { equal, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { act } from "react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaRecuperar } from "@/pages/TelaRecuperar";

beforeEach(() => localStorage.clear());

async function abrir(resposta: { status: number; corpo?: unknown } | "rede" = { status: 204 }) {
  const pedidos: unknown[] = [];
  const rede = fingirRede((url, init) => {
    if (url.includes("/auth/recuperar")) {
      pedidos.push(JSON.parse(String(init?.body)));
      if (resposta === "rede") throw new TypeError("Failed to fetch");
      return resposta;
    }
    throw new Error(`chamada não prevista: ${url}`);
  });
  const { hook } = memoryLocation({ path: "/recuperar" });
  const tela = await renderizar(
    <Router hook={hook}>
      <TelaRecuperar />
    </Router>,
  );
  await assentar();
  return {
    tela,
    pedidos,
    limpar: async () => {
      await tela.desmontar();
      rede.restaurar();
    },
  };
}

async function pedirPara(tela: Tela, email: string) {
  const campo = tela.exigir("#email");
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")
      ?.set?.call(campo, email);
    campo.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
  await tela.clicar(tela.todos("button").find((b) => b.getAttribute("type") === "submit")!);
  await assentar();
}

test("a confirmação diz SE EXISTIR — nunca que existe", async () => {
  // Confirmar contaria a quem só quer saber se a pessoa usa o app.
  const { tela, limpar } = await abrir();
  try {
    await pedirPara(tela, "maria@exemplo.com");
    match(tela.texto(), /Se existir uma conta/);
    ok(
      !/enviamos para|conta encontrada|e-mail cadastrado/i.test(tela.texto()),
      "a tela confirmou que a conta existe",
    );
    // E o que a pessoa precisa saber sobre o link.
    match(tela.texto(), /vale por 1 hora/);
    match(tela.texto(), /só\s+funciona uma vez/);
  } finally {
    await limpar();
  }
});

test("o e-mail sobe sem espaço em volta", async () => {
  // ESTE TESTE NÃO DISTINGUE O `.trim()` DO CÓDIGO, e está registrado assim de
  // propósito: tirar o `.trim()` de `pedirRecuperacao(email.trim())` não o
  // derruba. O motivo é o `type="email"` do campo — o próprio HTML apara
  // espaço em volta na sanitização do valor, então o espaço nunca chega ao
  // estado do React.
  //
  // Ele fica porque o que importa é o CONTRATO observável (espaço não vai para
  // o servidor), e porque a garantia mudaria de dono em silêncio se alguém
  // trocasse o campo para `type="text"`. O `.trim()` do código continua sendo
  // o cinto que sobra quando o suspensório sai.
  const { tela, pedidos, limpar } = await abrir();
  try {
    await pedirPara(tela, "  maria@exemplo.com  ");
    equal((pedidos[0] as { email: string }).email, "maria@exemplo.com");
  } finally {
    await limpar();
  }
});

test("muitas tentativas DIZ quanto falta esperar", async () => {
  // O defeito. O servidor calcula "Tente de novo em 47 minutos" e a tela
  // engolia num "Algo deu errado. Tente de novo em instantes." — no lugar mais
  // errado possível, porque quem chega aqui já está trancada fora. Ela tenta
  // de novo, falha de novo, e conclui que o app quebrou.
  //
  // Repassar não abre oráculo: o limite roda para qualquer endereço, exista
  // conta ou não. O tempo fala de quantas vezes ESTE pedido foi feito, não de
  // quem tem conta.
  const { tela, limpar } = await abrir({
    status: 429, corpo: { detail: "Muitas tentativas. Tente de novo em 47 minutos." },
  });
  try {
    await pedirPara(tela, "maria@exemplo.com");
    const aviso = tela.exigir('[role="alert"]');
    equal(aviso.textContent, "Muitas tentativas. Tente de novo em 47 minutos.");
    ok(!/API 429/.test(tela.texto()), "vazou o status");
  } finally {
    await limpar();
  }
});

test("fora do 429, o erro continua genérico — e isso é o cuidado", async () => {
  // O servidor responde 204 exista o e-mail ou não. Texto específico para
  // outro status seria texto sobre um caso que não existe, e cada frase nova
  // aqui é uma chance de contar algo sem querer.
  const { tela, limpar } = await abrir({ status: 500, corpo: { detail: "usuario nao encontrado" } });
  try {
    await pedirPara(tela, "maria@exemplo.com");
    match(tela.texto(), /Algo deu errado/);
    ok(
      !/não encontrado/i.test(tela.texto()),
      "repassou um detalhe do servidor que fala sobre a existência da conta",
    );
  } finally {
    await limpar();
  }
});

test("sem conexão é dito como sem conexão", async () => {
  const { tela, limpar } = await abrir("rede");
  try {
    await pedirPara(tela, "maria@exemplo.com");
    match(tela.texto(), /Sem conexão/);
  } finally {
    await limpar();
  }
});

test("campo vazio não manda pedido", async () => {
  const { tela, pedidos, limpar } = await abrir();
  try {
    const enviar = tela.todos("button").find((b) => b.getAttribute("type") === "submit")!;
    equal(enviar.hasAttribute("disabled"), true);
    await tela.clicar(enviar);
    await assentar();
    equal(pedidos.length, 0);
  } finally {
    await limpar();
  }
});

test("a saída para o login existe nos dois estados", async () => {
  const { tela, limpar } = await abrir();
  try {
    ok(tela.todos("a").some((a) => a.getAttribute("href") === "/login"), "antes de pedir");
    await pedirPara(tela, "maria@exemplo.com");
    ok(tela.todos("a").some((a) => a.getAttribute("href") === "/login"), "depois de pedir");
  } finally {
    await limpar();
  }
});
