/**
 * O consentimento de quem voltou do Google.
 *
 * O que se prende aqui é o motivo de a tela existir: "entrar com Google"
 * costuma criar a conta num clique, e aqui a existência de uma conta revela
 * convicção religiosa. Um botão que cria conta sem passar por isto não é
 * atalho — é o app deixando de colher o que a LGPD exige.
 */

import { match, ok } from "node:assert/strict";
import { test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaConsentimentoGoogle } from "@/pages/TelaConsentimentoGoogle";

async function abrir(caminho = "/entrar/consentimento?t=token-de-teste") {
  const enviados: Array<{ url: string; corpo: unknown }> = [];
  const rede = fingirRede((url, init) => {
    if (url.includes("/auth/google/consentir")) {
      enviados.push({ url, corpo: JSON.parse(String(init?.body ?? "{}")) });
      return { corpo: { ok: true } };
    }
    throw new Error(`chamada não prevista: ${url}`);
  });
  const { hook } = memoryLocation({ path: caminho });
  const tela = await renderizar(
    <Router hook={hook}>
      <TelaConsentimentoGoogle />
    </Router>,
  );
  await assentar();
  return {
    tela, enviados,
    limpar: async () => { await tela.desmontar(); rede.restaurar(); },
  };
}

const botao = (tela: Tela, texto: RegExp) =>
  tela.todos("button").filter((b) => texto.test(b.textContent ?? ""))[0];

/** O de enviar é achado pelo TIPO, como no teste do login: clicar num botão
 *  achado por texto não sobe o `submit` até o `<form>` neste ambiente. */
const enviar = (tela: Tela) =>
  tela.todos("button").find((b) => b.getAttribute("type") === "submit")!;

test("o botão só liga depois do consentimento", async () => {
  const { tela, limpar } = await abrir();
  try {
    const criar = botao(tela, /Criar minha conta/);
    ok(criar, "não há botão de criar conta");
    ok(
      (criar as HTMLButtonElement).disabled,
      "dá para criar conta sem consentir — é colher dado sensível sem permissão",
    );
    await tela.clicar(tela.todos("input[type=checkbox]")[0]);
    ok(
      !(botao(tela, /Criar minha conta/) as HTMLButtonElement).disabled,
      "consentiu e o botão continuou travado",
    );
  } finally {
    await limpar();
  }
});

test("o consentimento vai no corpo, e o de comunicação é separado", async () => {
  // Dado sensível exige consentimento ESPECÍFICO: juntar as duas coisas numa
  // caixa só faria a pessoa autorizar e-mail de propaganda para poder ter conta.
  const { tela, enviados, limpar } = await abrir();
  try {
    await tela.clicar(tela.todos("input[type=checkbox]")[0]);
    // O `assentar` entre marcar e enviar não é cerimônia: sem ele o botão
    // ainda está desabilitado no instante do clique, e o envio não acontece.
    await assentar();
    await tela.clicar(enviar(tela));
    await assentar();
    ok(enviados.length === 1, `mandou ${enviados.length} vezes`);
    const corpo = enviados[0].corpo as Record<string, unknown>;
    ok(corpo.consinto_dado_religioso === true, `não mandou o consentimento: ${JSON.stringify(corpo)}`);
    ok(corpo.consinto_comunicacao === false, "marcou comunicação que ninguém pediu");
    ok(corpo.token === "token-de-teste", "não levou o token do cadastro pendente");
  } finally {
    await limpar();
  }
});

test("sem token a tela diz que expirou em vez de oferecer um formulário", async () => {
  // Um formulário que vai falhar no envio é pior que a verdade: a pessoa
  // preenche, consente, e leva um erro no fim.
  const { tela, limpar } = await abrir("/entrar/consentimento");
  try {
    match(tela.texto(), /expirou/i);
    ok(!botao(tela, /Criar minha conta/), "desenhou formulário sem ter token");
  } finally {
    await limpar();
  }
});

test("a autorização diz as DUAS finalidades, como no cadastro por e-mail", async () => {
  // As duas portas para a mesma conta não podem descrever diferentemente o que
  // se autoriza — a diferença faria uma delas parecer o caminho fácil.
  const { tela, limpar } = await abrir();
  try {
    match(tela.texto(), /dado sensível sobre minha religião/);
    match(tela.texto(), /sincronizar meus pontos/);
    match(tela.texto(), /mostrar meu apelido junto/);
  } finally {
    await limpar();
  }
});

test("o erro do SERVIDOR aparece com as palavras dele", async () => {
  // "Este cadastro expirou. Comece de novo." é a única frase que diz o que
  // fazer. Trocá-la por texto genérico faz a pessoa recomeçar sem saber por
  // quê — e foi por pouco: eu tinha escrito `problema.mensagem`, e o campo
  // chama `detalhe`. Renderizaria "undefined".
  const rede = fingirRede(() => ({
    status: 400, corpo: { detail: "Este cadastro expirou. Comece de novo." },
  }));
  const { hook } = memoryLocation({ path: "/entrar/consentimento?t=tok" });
  const tela = await renderizar(
    <Router hook={hook}><TelaConsentimentoGoogle /></Router>,
  );
  await assentar();
  try {
    await tela.clicar(tela.todos("input[type=checkbox]")[0]);
    await assentar();
    await tela.clicar(enviar(tela));
    await assentar();
    const aviso = tela.todos('[role="alert"]')[0];
    ok(aviso, "o erro não apareceu");
    match(aviso.textContent ?? "", /Este cadastro expirou/);
    ok(
      !/undefined/.test(aviso.textContent ?? ""),
      `mostrou "undefined" no lugar da mensagem: ${aviso.textContent}`,
    );
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});

test("nunca inventa um consentimento que a pessoa não deu", async () => {
  // O botão desabilitado é a primeira guarda, e ela tem teste próprio. Esta é a
  // segunda: se ele ficasse alcançável por qualquer motivo, o que sobe tem de
  // ser o que a pessoa marcou — nunca `true` fixo.
  //
  // Sem este caso, trocar `consentiu` por `true` no corpo passa por todos os
  // outros testes, porque todos eles marcam a caixa antes de enviar.
  const enviados: unknown[] = [];
  const rede = fingirRede((_url, init) => {
    enviados.push(JSON.parse(String(init?.body ?? "{}")));
    return { corpo: { ok: true } };
  });
  const { hook } = memoryLocation({ path: "/entrar/consentimento?t=tok" });
  const tela = await renderizar(
    <Router hook={hook}><TelaConsentimentoGoogle /></Router>,
  );
  await assentar();
  try {
    // Sem marcar nada, força o envio pelo formulário.
    (tela.todos("form")[0] as HTMLFormElement).dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
    await assentar();
    if (enviados.length) {
      const corpo = enviados[0] as Record<string, unknown>;
      ok(
        corpo.consinto_dado_religioso === false,
        `mandou consentimento que ninguém deu: ${JSON.stringify(corpo)}`,
      );
    }
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});
