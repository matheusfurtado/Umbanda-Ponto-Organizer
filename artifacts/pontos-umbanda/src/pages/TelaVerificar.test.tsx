/**
 * A tela de confirmação: o que ela pode prometer.
 *
 * O achado #10 já tem cerca na regra (`billing/boasVindas.test.ts`), mas a
 * regra certa dentro de uma tela que não a usa continua sendo o defeito
 * original. Isto aqui é a outra metade: a tela pergunta antes de prometer, e
 * cala quando não sabe.
 */

import { doesNotMatch, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { janela } from "../../testes/dom.ts";
import { AuthProvider } from "@/auth/AuthContext";
import { TelaVerificar } from "@/pages/TelaVerificar";

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
  id: "u1", email: "maria@exemplo.com", email_verificado: true,
  apelido: "maria", admin: false, foto: null, favoritos_publicos: false,
};

/**
 * As três chamadas que esta tela provoca, com o plano escolhido pelo teste.
 *
 * URL não prevista **estoura**. Um 404 mudo faria a tela mostrar erro como se
 * fosse o cenário, e o teste passaria a medir outra coisa sem avisar.
 */
function rede(plano: { plano: string; diasRestantes?: number } | "falha", tokenOk = true) {
  return fingirRede((url) => {
    if (url.includes("/auth/verificar")) {
      return tokenOk
        ? { corpo: EU }
        : { status: 400, corpo: { detail: "Link inválido ou expirado. Peça um novo." } };
    }
    if (url.includes("/auth/eu")) return { corpo: EU };
    if (url.includes("/meus-direitos")) {
      if (plano === "falha") return { status: 500, corpo: {} };
      return { corpo: plano };
    }
    throw new Error(`chamada não prevista: ${url}`);
  });
}

async function abrirComToken(token = "abc") {
  janela.location.hash = `#token=${token}`;
  const { hook } = memoryLocation({ path: "/verificar" });
  const tela = await renderizar(
    <Router hook={hook}>
      <AuthProvider>
        <TelaVerificar />
      </AuthProvider>
    </Router>,
  );
  // Duas chamadas em sequência: confirmar, e só então perguntar o plano.
  await assentar();
  return tela;
}

test("quem GANHOU o teste é informado dos dias", async () => {
  const r = rede({ plano: "teste", diasRestantes: 15 });
  try {
    const tela = await abrirComToken();
    match(tela.texto(), /Conta confirmada/);
    match(tela.texto(), /15 dias de teste/);
    await tela.desmontar();
  } finally {
    r.restaurar();
  }
});

test("quem NÃO ganhou teste não lê que ganhou — e sabe para onde ir", async () => {
  // O defeito: `conceder` devolve nada quando a caixa de entrada já usou o
  // teste, a rota responde igual, e a tela prometia 15 dias a todo mundo. A
  // pessoa caía no plano grátis logo depois de ler que tinha 15 dias.
  const r = rede({ plano: "gratis" });
  try {
    const tela = await abrirComToken();
    match(tela.texto(), /Conta confirmada/);
    doesNotMatch(
      tela.texto(),
      /dias de teste começam/,
      "prometeu teste a quem entrou no plano grátis",
    );
    match(tela.texto(), /já foi usado por esta caixa de entrada/);
    ok(
      tela.todos("a").some((a) => a.getAttribute("href") === "/planos"),
      "contou a má notícia sem oferecer saída",
    );
    await tela.desmontar();
  } finally {
    r.restaurar();
  }
});

test("sem saber o plano, a tela confirma e CALA sobre plano", async () => {
  const r = rede("falha");
  try {
    const tela = await abrirComToken();
    match(tela.texto(), /Conta confirmada/, "engoliu a confirmação por causa do plano");
    doesNotMatch(tela.texto(), /dias de teste/);
    doesNotMatch(tela.texto(), /plano grátis/);
    ok(
      tela.todos("a").some((a) => a.getAttribute("href") === "/"),
      "sem caminho para o app",
    );
    await tela.desmontar();
  } finally {
    r.restaurar();
  }
});

test("link gasto explica e oferece o caminho de pedir outro", async () => {
  const r = rede({ plano: "teste" }, false);
  try {
    const tela = await abrirComToken();
    match(tela.texto(), /Não deu para confirmar/);
    match(tela.texto(), /Link inválido ou expirado/);
    ok(
      tela.todos("a").some((a) => a.getAttribute("href") === "/conta"),
      "beco sem saída: o caminho de pedir link novo é a tela de conta",
    );
    await tela.desmontar();
  } finally {
    r.restaurar();
  }
});

test("link ausente é dito, e não confundido com link gasto", async () => {
  const r = rede({ plano: "teste" });
  try {
    janela.location.hash = "";
    const { hook } = memoryLocation({ path: "/verificar" });
    const tela = await renderizar(
      <Router hook={hook}>
        <AuthProvider>
          <TelaVerificar />
        </AuthProvider>
      </Router>,
    );
    await assentar();
    match(tela.texto(), /Abra o link exatamente como veio no e-mail/);
    await tela.desmontar();
  } finally {
    r.restaurar();
  }
});
