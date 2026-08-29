/**
 * A porta de entrada — e o que ela tem o cuidado de NÃO dizer.
 *
 * Este app trata convicção religiosa: ter conta aqui já é o dado sensível.
 * Por isso o servidor foi desenhado para não contar se um endereço tem conta
 * (`test_cadastro_nao_conta_quem_tem_conta.py`), e a tela não pode desfazer
 * isso escrevendo "esse e-mail já existe" por conta própria.
 *
 * A outra metade é o contrário: quando o servidor MANDA um texto — apelido
 * repetido, muitas tentativas, senha curta — é o dele que sai, porque só ele
 * sabe em qual campo a pessoa precisa mexer.
 */

import { equal, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { act } from "react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaLogin } from "@/pages/TelaLogin";
import { AuthProvider } from "@/auth/AuthContext";

beforeEach(() => localStorage.clear());

type Resposta = { status: number; corpo?: unknown };

function servidor(respostas: { login?: Resposta; cadastro?: Resposta } = {}) {
  const enviados: { url: string; corpo: unknown }[] = [];
  const rede = fingirRede((url, init) => {
    if (url.includes("/auth/login")) {
      enviados.push({ url, corpo: JSON.parse(String(init?.body)) });
      return respostas.login ?? { corpo: { id: "u1", email: "m@e.com" } };
    }
    if (url.includes("/auth/cadastro")) {
      enviados.push({ url, corpo: JSON.parse(String(init?.body)) });
      return (
        respostas.cadastro ?? {
          status: 202,
          corpo: {
            mensagem:
              "Se este endereço puder receber, mandamos um link para ele agora.",
          },
        }
      );
    }
    if (url.includes("/auth/eu")) return { status: 401, corpo: {} };
    throw new Error(`chamada não prevista: ${url}`);
  });
  return { enviados, rede };
}

async function abrir(respostas: Parameters<typeof servidor>[0] = {}) {
  const s = servidor(respostas);
  const { hook } = memoryLocation({ path: "/login" });
  const tela = await renderizar(
    <Router hook={hook}>
      <AuthProvider>
        <TelaLogin />
      </AuthProvider>
    </Router>,
  );
  await assentar();
  return {
    tela,
    enviados: s.enviados,
    limpar: async () => {
      await tela.desmontar();
      s.rede.restaurar();
      localStorage.clear();
    },
  };
}

async function preencher(el: Element, texto: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")
      ?.set?.call(el, texto);
    el.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
}

const campo = (tela: Tela, id: string) => tela.exigir(`#${id}`);
const enviar = (tela: Tela) =>
  tela.todos("button").find((b) => b.getAttribute("type") === "submit")!;

async function irParaCriar(tela: Tela) {
  const trocar = tela.todos("button").find((b) => /Criar uma conta/.test(b.textContent ?? ""));
  ok(trocar, `não achei como criar conta: ${tela.texto().slice(0, 200)}`);
  await tela.clicar(trocar);
  await assentar();
}

test("senha errada NÃO conta se o e-mail existe", async () => {
  // O 401 é o mesmo para senha errada e para e-mail que não tem conta. Se a
  // tela escrevesse "esse e-mail não existe", desfaria em uma linha o cuidado
  // que o servidor tem em toda rota de auth — e num app de Umbanda saber quem
  // tem conta é saber quem é de Umbanda.
  const { tela, limpar } = await abrir({ login: { status: 401, corpo: { detail: "x" } } });
  try {
    await preencher(campo(tela, "email"), "maria@exemplo.com");
    await preencher(campo(tela, "senha"), "seja-la-o-que-for");
    await tela.clicar(enviar(tela));
    await assentar();
    const aviso = tela.exigir('[role="alert"]');
    equal(aviso.textContent, "E-mail ou senha incorretos.");
    ok(
      !/não existe|não encontrad|não cadastrad/i.test(tela.texto()),
      "a tela contou se o endereço tem conta",
    );
  } finally {
    await limpar();
  }
});

test("apelido repetido sai com as palavras do servidor", async () => {
  // "409 agora tem DOIS motivos: e-mail repetido e apelido repetido. O
  // servidor manda qual dos dois; escrever 'esse e-mail já existe' aqui
  // mandaria a pessoa mexer no campo errado."
  const { tela, limpar } = await abrir({
    cadastro: { status: 409, corpo: { detail: "Este apelido já está em uso." } },
  });
  try {
    await irParaCriar(tela);
    await preencher(campo(tela, "email"), "maria@exemplo.com");
    await preencher(campo(tela, "apelido"), "Pai João");
    await preencher(campo(tela, "senha"), "uma-senha-bem-longa");
    await tela.clicar(tela.exigir('input[type="checkbox"]'));
    await assentar();
    await tela.clicar(enviar(tela));
    await assentar();
    equal(tela.exigir('[role="alert"]').textContent, "Este apelido já está em uso.");
  } finally {
    await limpar();
  }
});

test("muitas tentativas repassa o tempo que o servidor calculou", async () => {
  const { tela, limpar } = await abrir({
    login: { status: 429, corpo: { detail: "Muitas tentativas. Tente de novo em 12 minutos." } },
  });
  try {
    await preencher(campo(tela, "email"), "maria@exemplo.com");
    await preencher(campo(tela, "senha"), "qualquer");
    await tela.clicar(enviar(tela));
    await assentar();
    match(tela.texto(), /Tente de novo em 12 minutos/);
  } finally {
    await limpar();
  }
});

test("erro do servidor não vira texto de servidor na cara da pessoa", async () => {
  const { tela, limpar } = await abrir({
    login: { status: 500, corpo: { detail: "psycopg.OperationalError: connection refused" } },
  });
  try {
    await preencher(campo(tela, "email"), "maria@exemplo.com");
    await preencher(campo(tela, "senha"), "qualquer");
    await tela.clicar(enviar(tela));
    await assentar();
    match(tela.texto(), /O servidor teve um problema/);
    ok(!/psycopg/.test(tela.texto()), "vazou o erro do banco para a tela");
  } finally {
    await limpar();
  }
});

test("criar conta NÃO loga — leva ao 'confira seu e-mail'", async () => {
  // O cadastro deixou de abrir sessão de propósito: logar já contaria que o
  // e-mail estava livre. A tela troca o formulário pelo recado do servidor, e
  // esse recado é o MESMO para endereço livre e para endereço que já tem conta.
  const { tela, limpar } = await abrir();
  try {
    await irParaCriar(tela);
    await preencher(campo(tela, "email"), "maria@exemplo.com");
    await preencher(campo(tela, "apelido"), "Pai João");
    await preencher(campo(tela, "senha"), "uma-senha-bem-longa");
    await tela.clicar(tela.exigir('input[type="checkbox"]'));
    await assentar();
    await tela.clicar(enviar(tela));
    await assentar();

    match(tela.texto(), /Confira seu e-mail/);
    match(tela.texto(), /mandamos um link/);
    match(tela.texto(), /vale por 24 horas/, "não disse o prazo do link");
    // A saída continua existindo: o app funciona sem conta.
    ok(tela.todos("a").some((a) => a.getAttribute("href") === "/"));
  } finally {
    await limpar();
  }
});

test("sem o consentimento do dado religioso, não cria", async () => {
  // O consentimento é o que torna legítimo guardar que esta pessoa é de
  // Umbanda. Começa desmarcado, e é ele que solta o botão.
  const { tela, enviados, limpar } = await abrir();
  try {
    await irParaCriar(tela);
    await preencher(campo(tela, "email"), "maria@exemplo.com");
    await preencher(campo(tela, "apelido"), "Pai João");
    await preencher(campo(tela, "senha"), "uma-senha-bem-longa");
    await assentar();
    equal(enviar(tela).hasAttribute("disabled"), true, "o botão soltou sem consentimento");
    await tela.clicar(enviar(tela));
    await assentar();
    equal(enviados.filter((e) => e.url.includes("cadastro")).length, 0);
  } finally {
    await limpar();
  }
});

test("senha curta não cria conta, mas ENTRA — são regras diferentes", async () => {
  // Exigir 10 no cadastro protege a conta nova. Exigir no login barraria quem
  // tem conta antiga com senha curta, sem nada que ela possa fazer na tela.
  const { tela, enviados, limpar } = await abrir();
  try {
    await irParaCriar(tela);
    await preencher(campo(tela, "email"), "maria@exemplo.com");
    await preencher(campo(tela, "apelido"), "Pai João");
    await preencher(campo(tela, "senha"), "curta");
    await tela.clicar(tela.exigir('input[type="checkbox"]'));
    await assentar();
    equal(enviar(tela).hasAttribute("disabled"), true, "aceitou senha curta no cadastro");

    const voltar = tela.todos("button").find((b) => /Já tenho conta/.test(b.textContent ?? ""));
    ok(voltar, "não achei como voltar para entrar");
    await tela.clicar(voltar);
    await assentar();
    await preencher(campo(tela, "email"), "maria@exemplo.com");
    await preencher(campo(tela, "senha"), "curta");
    await assentar();
    equal(enviar(tela).hasAttribute("disabled"), false, "barrou quem já tem senha curta");
    await tela.clicar(enviar(tela));
    await assentar();
    equal(enviados.filter((e) => e.url.includes("login")).length, 1);
  } finally {
    await limpar();
  }
});

test("sem conexão, a tela diz isso — e não 'senha incorreta'", async () => {
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) return { status: 401, corpo: {} };
    throw new TypeError("Failed to fetch");
  });
  const { hook } = memoryLocation({ path: "/login" });
  const tela = await renderizar(
    <Router hook={hook}>
      <AuthProvider>
        <TelaLogin />
      </AuthProvider>
    </Router>,
  );
  await assentar();
  try {
    await preencher(campo(tela, "email"), "maria@exemplo.com");
    await preencher(campo(tela, "senha"), "qualquer");
    await tela.clicar(enviar(tela));
    await assentar();
    match(tela.texto(), /Sem conexão/);
    ok(
      !/senha incorret/i.test(tela.texto()),
      "culpou a senha por uma falha de rede — e a pessoa vai trocar a senha à toa",
    );
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});
