/**
 * Quem a pessoa vê no cabeçalho — e qual dos dois nomes dela aparece.
 *
 * Este app guarda duas coisas que identificam quem usa: o **e-mail**, que
 * identifica a pessoa e que o produto promete não mostrar a ninguém, e o
 * **apelido público**, que ela escolheu e que aparece embaixo dos pontos que
 * envia. Confundir os dois é o risco central do app, e o cabeçalho — que
 * aparece em TODA tela, inclusive no tablet compartilhado do terreiro —
 * mostrava o errado.
 */

import { equal, match, ok } from "node:assert/strict";
import { test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { MenuUsuario } from "@/components/MenuUsuario";
import { AuthProvider } from "@/auth/AuthContext";

const BASE = {
  id: "u1", email: "maria.silva@exemplo.com", email_verificado: true,
  admin: false, favoritos_publicos: false,
};

/**
 * O `localStorage` é limpo em TODO cenário, e isso não é higiene: é correção.
 *
 * `AuthProvider` hidrata `user` de forma SÍNCRONA a partir do que ficou
 * guardado (`useState(() => lembrado())`) — é o que faz o app abrir sem piscar
 * "Entrar" para quem já estava logada. Num processo de teste, isso significa
 * que a pessoa do teste anterior continua logada no seguinte.
 *
 * Custou uma mutação sobrevivente: apagar o guarda de `isPending` não quebrava
 * nada, porque o cenário "ainda não sei quem é" nunca acontecia — o usuário do
 * teste de cima já estava lá.
 */
async function abrir(user: Record<string, unknown> | null) {
  localStorage.clear();
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) {
      return user ? { corpo: user } : { status: 401, corpo: {} };
    }
    throw new Error(`chamada não prevista: ${url}`);
  });
  const { hook } = memoryLocation({ path: "/" });
  const tela = await renderizar(
    <Router hook={hook}>
      <AuthProvider>
        <MenuUsuario />
      </AuthProvider>
    </Router>,
  );
  await assentar();
  return {
    tela,
    limpar: async () => {
      await tela.desmontar();
      rede.restaurar();
      localStorage.clear();
    },
  };
}

const link = (tela: Tela, href: string) =>
  tela.todos("a").find((a) => a.getAttribute("href") === href);

test("sem conta, o convite é entrar — e não um avatar vazio", async () => {
  const { tela, limpar } = await abrir(null);
  try {
    match(tela.texto(), /Entrar/);
    ok(link(tela, "/login"), "o convite não leva ao login");
  } finally {
    await limpar();
  }
});

test("com apelido escolhido, é o APELIDO que aparece — nunca o e-mail", async () => {
  // O defeito: o cabeçalho escrevia a parte local do e-mail ("maria.silva")
  // e desenhava um círculo com a inicial dele. Num aparelho compartilhado,
  // quem olha de lado lê o e-mail em vez do nome que ela pôs no lugar dele.
  const { tela, limpar } = await abrir({
    ...BASE, apelido: "Terreiro do Pai João", foto: null,
  });
  try {
    match(tela.texto(), /Terreiro do Pai João/);
    ok(
      !tela.texto().includes("maria"),
      `vazou o e-mail no cabeçalho: ${tela.texto()}`,
    );
    ok(!tela.html().includes("maria.silva@"), "o e-mail inteiro apareceu no HTML");
  } finally {
    await limpar();
  }
});

test("sem apelido, o rótulo do e-mail é o RECUO, e continua valendo", async () => {
  // Quem ainda não escolheu precisa reconhecer em que conta está. O recuo não
  // some junto com o conserto.
  const { tela, limpar } = await abrir({ ...BASE, apelido: null, foto: null });
  try {
    match(tela.texto(), /maria\.silva/);
  } finally {
    await limpar();
  }
});

test("a foto do perfil aparece no cabeçalho, como na barra lateral", async () => {
  // A barra lateral já mostrava `<Avatar apelido foto />`. O cabeçalho
  // desenhava um círculo próprio com uma letra, então a mesma pessoa tinha
  // duas identidades na mesma tela.
  const { tela, limpar } = await abrir({
    ...BASE, apelido: "Pai João", foto: "/api/v1/perfis/pai-joao/foto?v=abc",
  });
  try {
    const img = tela.achar("img");
    ok(img, `sem imagem no cabeçalho: ${tela.html()}`);
    equal(img.getAttribute("src"), "/api/v1/perfis/pai-joao/foto?v=abc");
  } finally {
    await limpar();
  }
});

test("o cabeçalho leva à conta", async () => {
  const { tela, limpar } = await abrir({ ...BASE, apelido: "Pai João", foto: null });
  try {
    ok(link(tela, "/conta"), "o cabeçalho não leva a lugar nenhum");
  } finally {
    await limpar();
  }
});

test("enquanto não se sabe quem é, não pisca 'Entrar'", async () => {
  // `isPending` reserva o espaço. Sem isso o cabeçalho mostra "Entrar" por um
  // instante a cada abertura para quem JÁ está logada — e num app que trata
  // convicção religiosa, "você não está logada" pisca como se a sessão tivesse
  // caído.
  localStorage.clear();
  const rede = fingirRede(async (url) => {
    if (url.includes("/auth/eu")) {
      await new Promise((r) => setTimeout(r, 50));
      return { corpo: { ...BASE, apelido: "Pai João", foto: null } };
    }
    throw new Error(url);
  });
  const { hook } = memoryLocation({ path: "/" });
  const tela = await renderizar(
    <Router hook={hook}>
      <AuthProvider>
        <MenuUsuario />
      </AuthProvider>
    </Router>,
  );
  try {
    ok(!tela.texto().includes("Entrar"), "piscou 'Entrar' antes de saber quem é");
  } finally {
    await tela.desmontar();
    rede.restaurar();
    localStorage.clear();
  }
});
