/**
 * Guardar um orixá ou uma playlist — o botão de seguir, com outro alvo.
 *
 * ADR 0009: guardar é REFERÊNCIA, não cópia. Ninguém copia o artista que segue.
 */

import { deepEqual, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { BotaoGuardar } from "@/componentes/BotaoGuardar";
import { AuthProvider } from "@/auth/AuthContext";

beforeEach(() => localStorage.clear());

const EU = {
  id: "u1", email: "m@e.com", email_verificado: true,
  apelido: "maria", admin: false, favoritos_publicos: false, foto: null,
};

async function abrir({ logado = true, jaGuardado = false } = {}) {
  const chamadas: string[] = [];
  const rede = fingirRede((url, init) => {
    if (url.includes("/auth/eu")) {
      return logado ? { corpo: EU } : { status: 401, corpo: {} };
    }
    if (url.includes("/eu/biblioteca")) {
      const metodo = init?.method ?? "GET";
      chamadas.push(`${metodo} ${url}`);
      if (metodo === "GET") {
        return {
          corpo: jaGuardado
            ? [{ alvoTipo: "orixa", alvoId: "ogum", nome: "Ogum", pontos: 3, de: null, ordem: 0 }]
            : [],
        };
      }
      return metodo === "PUT" ? { status: 201, corpo: { guardado: true } } : { status: 204 };
    }
    return { corpo: {} };
  });
  const tela = await renderizar(
    <AuthProvider>
      <BotaoGuardar alvoTipo="orixa" alvoId="ogum" nome="Ogum" />
    </AuthProvider>,
  );
  await assentar();
  return {
    tela, chamadas,
    limpar: async () => { await tela.desmontar(); rede.restaurar(); },
  };
}

const oBotao = (tela: Tela) => tela.todos("button")[0] as HTMLButtonElement | undefined;

test("sem conta o botão não aparece", async () => {
  // Estante é de quem tem onde guardar. Oferecer e mandar para o login depois
  // do clique seria pedir duas vezes — mesma escolha do indicar vídeo.
  const { tela, limpar } = await abrir({ logado: false });
  try {
    ok(tela.naoTem("button"), "ofereceu guardar a quem não entrou");
  } finally {
    await limpar();
  }
});

test("guardar chama a rota e o botão passa a dizer que está guardado", async () => {
  const { tela, chamadas, limpar } = await abrir();
  try {
    const b = oBotao(tela);
    ok(b, "sem botão");
    match(b!.textContent ?? "", /Guardar/);
    await tela.clicar(b!);
    await assentar();
    ok(
      chamadas.some((c) => c.startsWith("PUT")),
      `não chamou a rota de guardar: ${chamadas.join(" | ")}`,
    );
    match(oBotao(tela)!.textContent ?? "", /Guardado/);
    deepEqual(oBotao(tela)!.getAttribute("aria-pressed"), "true");
  } finally {
    await limpar();
  }
});

test("o que já está guardado abre dizendo isso, e tirar desfaz", async () => {
  // Um botão que diz "Guardar" antes de saber que já está guardado faz a pessoa
  // clicar e ver o rótulo mudar sem nada ter acontecido.
  const { tela, chamadas, limpar } = await abrir({ jaGuardado: true });
  try {
    match(oBotao(tela)!.textContent ?? "", /Guardado/);
    await tela.clicar(oBotao(tela)!);
    await assentar();
    ok(
      chamadas.some((c) => c.startsWith("DELETE")),
      `não chamou a rota de tirar: ${chamadas.join(" | ")}`,
    );
    match(oBotao(tela)!.textContent ?? "", /Guardar/);
  } finally {
    await limpar();
  }
});

test("o erro do servidor é dito com as palavras dele", async () => {
  const rede = fingirRede((url, init) => {
    if (url.includes("/auth/eu")) return { corpo: EU };
    if (url.includes("/eu/biblioteca") && (init?.method ?? "GET") === "GET") {
      return { corpo: [] };
    }
    return { status: 409, corpo: { detail: "Sua biblioteca chegou a 200 itens." } };
  });
  const tela = await renderizar(
    <AuthProvider>
      <BotaoGuardar alvoTipo="orixa" alvoId="ogum" nome="Ogum" />
    </AuthProvider>,
  );
  await assentar();
  try {
    await tela.clicar(tela.todos("button")[0]);
    await assentar();
    match(tela.texto(), /chegou a 200 itens/);
    ok(!/API 409/.test(tela.texto()), "vazou o status para a tela");
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});
