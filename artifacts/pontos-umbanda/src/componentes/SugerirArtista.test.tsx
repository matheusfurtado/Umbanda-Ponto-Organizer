/**
 * "Falta fulano aqui" — o convite, e o que ele NÃO promete.
 *
 * O acervo de artistas nasce do casamento automático com o YouTube: só entra
 * quem já tem pontos casados. Isso deixa de fora o canal pequeno, e quem
 * conhece o canal pequeno é a comunidade, não o cron.
 *
 * O que precisa estar preso aqui é a expectativa: a sugestão NÃO publica a
 * página. Publicar alguém como "de Umbanda" sem essa pessoa ter pedido é o que
 * o pedido de remoção existe para desfazer.
 */

import { deepEqual, match, ok } from "node:assert/strict";
import { act } from "react";
import { beforeEach, test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { SugerirArtista } from "@/componentes/SugerirArtista";
import { AuthProvider } from "@/auth/AuthContext";

beforeEach(() => localStorage.clear());

const EU = {
  id: "u1", email: "m@e.com", email_verificado: true,
  apelido: "maria", admin: false, foto: null, favoritos_publicos: false,
};

async function abrir(
  { logado = true, resposta = { status: 201, corpo: { id: "s1" } } }:
  { logado?: boolean; resposta?: { status?: number; corpo?: unknown } } = {},
) {
  const enviados: unknown[] = [];
  const rede = fingirRede((url, init) => {
    if (url.includes("/auth/eu")) return logado ? { corpo: EU } : { status: 401, corpo: {} };
    if (url.includes("/artistas/sugestoes")) {
      enviados.push(JSON.parse(String(init?.body ?? "{}")));
      return resposta;
    }
    throw new Error(`chamada não prevista: ${url}`);
  });
  const tela = await renderizar(
    <Router hook={memoryLocation({ path: "/artistas" }).hook}>
      <AuthProvider>
        <SugerirArtista />
      </AuthProvider>
    </Router>,
  );
  await assentar();
  return {
    tela,
    enviados,
    limpar: async () => {
      await tela.desmontar();
      rede.restaurar();
      localStorage.clear();
    },
  };
}

const botao = (tela: Tela, texto: RegExp) =>
  tela.todosNaPagina("button").find((b) => texto.test(b.textContent ?? ""));

async function digitar(seletor: string, valor: string) {
  const campo = document.querySelector(seletor);
  ok(campo, `campo ${seletor} não existe`);
  await act(async () => {
    const proto = campo.tagName === "TEXTAREA"
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(campo, valor);
    campo.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
  await assentar();
}

test("sem conta, o convite leva ao login — e diz por quê lá", async () => {
  // Sem conta não há para onde responder nem freio de spam. O convite fica na
  // tela de propósito: é vendo o que ele oferece que alguém decide entrar.
  const { tela, limpar } = await abrir({ logado: false });
  try {
    match(tela.texto(), /Está faltando algum canal/);
    ok(tela.achar('a[href="/login?motivo=sugerir-artista"]'), "o convite não leva a lugar nenhum");
    ok(!botao(tela, /Sugerir um artista/), "abriu o formulário para quem não pode enviar");
  } finally {
    await limpar();
  }
});

test("o diálogo avisa que a sugestão NÃO publica sozinha", async () => {
  // É a expectativa que precisa estar certa antes do envio. Sem isto, a pessoa
  // sai esperando ver a página aparecer.
  const { tela, limpar } = await abrir();
  try {
    await tela.clicar(botao(tela, /Sugerir um artista/)!);
    await assentar();
    match(tela.textoNaPagina(), /não publica a página sozinha/i);
  } finally {
    await limpar();
  }
});

test("só o nome basta, e o que vai vazio vira null", async () => {
  // Quem lembra do canal nem sempre tem o link à mão. E string vazia e "não
  // sei" divergem no primeiro `===` — quem modera precisa da diferença.
  const { tela, enviados, limpar } = await abrir();
  try {
    await tela.clicar(botao(tela, /Sugerir um artista/)!);
    await assentar();
    await digitar("#sug-nome", "  Canal do Terreiro  ");
    await tela.clicar(botao(tela, /Enviar sugestão/)!);
    await assentar();
    deepEqual(enviados, [{ nomeDoCanal: "Canal do Terreiro", canalUrl: null, recado: null }]);
  } finally {
    await limpar();
  }
});

test("sem nome, o botão de enviar não liga", async () => {
  const { tela, enviados, limpar } = await abrir();
  try {
    await tela.clicar(botao(tela, /Sugerir um artista/)!);
    await assentar();
    ok(
      botao(tela, /Enviar sugestão/)?.hasAttribute("disabled"),
      "deixou enviar uma sugestão sem canal nenhum",
    );
    deepEqual(enviados, []);
  } finally {
    await limpar();
  }
});

test("enviado, a tela diz o que vai acontecer — e não some", async () => {
  const { tela, limpar } = await abrir();
  try {
    await tela.clicar(botao(tela, /Sugerir um artista/)!);
    await assentar();
    await digitar("#sug-nome", "Canal Novo");
    await tela.clicar(botao(tela, /Enviar sugestão/)!);
    await assentar();
    match(tela.textoNaPagina(), /está na fila/i);
    ok(botao(tela, /^Pronto$/), "não deu saída depois de enviar");
  } finally {
    await limpar();
  }
});

test("o servidor recusando fala com as palavras dele", async () => {
  // O 409 de "esse artista já está no acervo" traz o caminho junto. Trocar por
  // um texto genérico esconderia justamente a resposta útil.
  const { tela, limpar } = await abrir({
    resposta: { status: 409, corpo: { detail: "Esse artista já está no acervo: /artista/canal-x" } },
  });
  try {
    await tela.clicar(botao(tela, /Sugerir um artista/)!);
    await assentar();
    await digitar("#sug-nome", "Canal X");
    await tela.clicar(botao(tela, /Enviar sugestão/)!);
    await assentar();
    match(tela.textoNaPagina(), /já está no acervo/);
    ok(!/API 409/.test(tela.textoNaPagina()), "vazou o status para a tela");
  } finally {
    await limpar();
  }
});

test("fechar depois de enviar apaga o resultado — reabrir não repete", async () => {
  // O diálogo fica montado: sem o reset, reabrir mostrava "está na fila" para
  // uma sugestão que não aconteceu agora. É o defeito de outros seis diálogos.
  const { tela, limpar } = await abrir();
  try {
    await tela.clicar(botao(tela, /Sugerir um artista/)!);
    await assentar();
    await digitar("#sug-nome", "Canal Novo");
    await tela.clicar(botao(tela, /Enviar sugestão/)!);
    await assentar();
    await tela.clicar(botao(tela, /^Pronto$/)!);
    await assentar();

    await tela.clicar(botao(tela, /Sugerir um artista/)!);
    await assentar();
    ok(
      !/está na fila/i.test(tela.textoNaPagina()),
      `o resultado anterior voltou: ${tela.textoNaPagina()}`,
    );
    ok(
      (document.querySelector("#sug-nome") as HTMLInputElement | null)?.value === "",
      "o nome digitado antes sobreviveu ao fechar",
    );
  } finally {
    await limpar();
  }
});
