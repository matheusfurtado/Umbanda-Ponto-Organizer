/**
 * Publicar uma gira — a ação que expõe alguém a estranhos.
 *
 * Uma gira pública é uma lista de pontos de Umbanda ligada a uma pessoa: ela
 * revela **convicção religiosa**, que é dado sensível. Por isso a tela diz o
 * que fica visível e o que não fica ANTES de a pessoa confirmar —
 * consentimento que se dá sem saber do quê não é consentimento.
 *
 * E o apelido é escolhido AQUI, no momento em que passa a fazer diferença.
 * Isso é bom para quem publica e perigoso para quem desiste: o nome digitado
 * aqui vira o nome público da pessoa em todo o app.
 */

import { deepEqual, equal, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { act } from "react";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { PublicarGira } from "@/componentes/PublicarGira";
import { AuthProvider } from "@/auth/AuthContext";

beforeEach(() => localStorage.clear());

const GIRA = { id: "g1", nome: "Gira de sexta", ordem: 0, publico: false, itens: [] };

function servidor(user: Record<string, unknown>, falha?: { status: number; corpo?: unknown }) {
  const apelidos: string[] = [];
  const visibilidades: { id: string; publico: boolean }[] = [];
  const rede = fingirRede((url, init) => {
    if (url.includes("/auth/apelido")) {
      apelidos.push(JSON.parse(String(init?.body)).apelido);
      return { corpo: { ...user, apelido: JSON.parse(String(init?.body)).apelido } };
    }
    if (url.includes("/auth/eu")) return { corpo: user };
    if (/\/repertorios\/[^/]+$/.test(url) && init?.method === "PATCH") {
      const corpo = JSON.parse(String(init.body));
      visibilidades.push({ id: url.split("/").pop()!, publico: corpo.publico });
      return falha ?? { corpo: { ...GIRA, publico: corpo.publico } };
    }
    throw new Error(`chamada não prevista: ${init?.method ?? "GET"} ${url}`);
  });
  return { apelidos, visibilidades, rede };
}

const EU_SEM_APELIDO = {
  id: "u1", email: "maria@exemplo.com", email_verificado: true,
  apelido: null, admin: false, favoritos_publicos: false, foto: null,
};
const EU_COM_APELIDO = { ...EU_SEM_APELIDO, apelido: "Terreiro de Ogum" };

async function abrir(
  user: Record<string, unknown> = EU_COM_APELIDO,
  gira: typeof GIRA | null = GIRA,
  falha?: { status: number; corpo?: unknown },
) {
  const s = servidor(user, falha);
  const mudancas: unknown[] = [];
  let fechamentos = 0;
  const tela = await renderizar(
    <AuthProvider>
      <PublicarGira
        gira={gira}
        onFechar={() => { fechamentos += 1; }}
        onMudou={(r) => mudancas.push(r)}
      />
    </AuthProvider>,
  );
  await assentar();
  return {
    tela,
    apelidos: s.apelidos,
    visibilidades: s.visibilidades,
    mudancas,
    fechou: () => fechamentos,
    limpar: async () => {
      await tela.desmontar();
      s.rede.restaurar();
      localStorage.clear();
    },
  };
}

const botao = (tela: Tela, rotulo: RegExp) =>
  tela.todosNaPagina("button").find((b) => rotulo.test(b.textContent ?? ""));

async function digitar(tela: Tela, texto: string) {
  const campo = tela.todosNaPagina("input#apelido")[0];
  ok(campo, "não achei o campo de apelido");
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")
      ?.set?.call(campo, texto);
    campo.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
  await assentar();
  return campo as HTMLInputElement;
}

test("a tela diz o que expõe ANTES de a pessoa confirmar", async () => {
  const { tela, limpar } = await abrir();
  try {
    const texto = tela.textoNaPagina();
    match(texto, /O que fica visível/);
    match(texto, /O que nunca aparece/);
    match(texto, /Seu e-mail/, "não disse que o e-mail fica de fora");
    match(texto, /Suas outras playlists/);
    // O ponto que decide: dito sem rodeio.
    match(texto, /revela que você é de Umbanda/);
  } finally {
    await limpar();
  }
});

test("publicar manda o que a gira já era, com `publico` trocado", async () => {
  const { tela, visibilidades, mudancas, limpar } = await abrir();
  try {
    await tela.clicar(botao(tela, /^Publicar$/)!);
    await assentar();
    deepEqual(visibilidades, [{ id: "g1", publico: true }]);
    equal(mudancas.length, 1, "quem chamou não soube que mudou");
  } finally {
    await limpar();
  }
});

test("fechar a gira é reversível, e a tela diz o que NÃO se perde", async () => {
  const { tela, visibilidades, limpar } = await abrir(EU_COM_APELIDO, {
    ...GIRA, publico: true,
  });
  try {
    match(tela.textoNaPagina(), /não perde o que copiou/);
    await tela.clicar(botao(tela, /Fechar playlist/)!);
    await assentar();
    deepEqual(visibilidades, [{ id: "g1", publico: false }]);
  } finally {
    await limpar();
  }
});

test("sem apelido, ele é pedido aqui — e o botão espera por ele", async () => {
  // "Quem está publicando quer publicar; interromper para um passo em outro
  // lugar é onde a maioria desiste."
  const { tela, apelidos, limpar } = await abrir(EU_SEM_APELIDO);
  try {
    equal(botao(tela, /^Publicar$/)!.hasAttribute("disabled"), true);
    await digitar(tela, "Casa da Mata");
    equal(botao(tela, /^Publicar$/)!.hasAttribute("disabled"), false);
    await tela.clicar(botao(tela, /^Publicar$/)!);
    await assentar();
    deepEqual(apelidos, ["Casa da Mata"]);
  } finally {
    await limpar();
  }
});

test("quem já tem apelido não é perguntado de novo", async () => {
  const { tela, limpar } = await abrir(EU_COM_APELIDO);
  try {
    equal(tela.todosNaPagina("input#apelido").length, 0);
  } finally {
    await limpar();
  }
});

test("desistir NÃO deixa o nome abandonado pronto para virar público", async () => {
  // O diálogo fica MONTADO com `gira=null` — some da tela e guarda o estado.
  // Quem digitava um apelido, cancelava e reabria encontrava o campo cheio e
  // "Publicar" aceso. Um toque e aquele nome abandonado vira o nome público da
  // pessoa em todo o app, não só nesta gira.
  const { tela, apelidos, limpar } = await abrir(EU_SEM_APELIDO);
  try {
    await digitar(tela, "Nome que desisti");
    await tela.clicar(botao(tela, /^Cancelar$/)!);
    await assentar();

    // Reabre — é o que o pai faz ao pôr uma gira de novo em `publicando`.
    await tela.reRenderizar(
      <AuthProvider>
        <PublicarGira gira={GIRA} onFechar={() => {}} onMudou={() => {}} />
      </AuthProvider>,
    );
    await assentar();

    const campo = tela.todosNaPagina("input#apelido")[0] as HTMLInputElement;
    equal(campo?.value, "", "o nome abandonado ficou no campo");
    equal(
      botao(tela, /^Publicar$/)!.hasAttribute("disabled"),
      true,
      "o botão de publicar ficou armado com o nome que a pessoa descartou",
    );
    equal(apelidos.length, 0);
  } finally {
    await limpar();
  }
});

test("o erro de uma tentativa não persegue a próxima", async () => {
  const { tela, limpar } = await abrir(EU_COM_APELIDO, GIRA, {
    status: 402,
    corpo: {
      detail:
        "Montar playlists faz parte do plano pago. Suas letras continuam " +
        "disponíveis normalmente.",
    },
  });
  try {
    await tela.clicar(botao(tela, /^Publicar$/)!);
    await assentar();
    // A frase é do SERVIDOR, palavra por palavra — é isso que este teste
    // prende: o `mensagemDeErro` repassa o texto de lá para a pessoa ler o
    // motivo, e não um genérico.
    //
    // O texto do fixture abaixo é o `NEGADO` de `routers/repertorio.py`, que é
    // o que este 402 devolve de verdade. A primeira versão deste teste
    // inventou "Seu plano não inclui giras públicas" — frase que a API nunca
    // disse — e o comentário aqui afirmava que ela vinha de lá. Fixture
    // inventado que passa é teste que prende a própria invenção.
    match(tela.textoNaPagina(), /Montar playlists faz parte do plano pago/);

    await tela.clicar(botao(tela, /^Cancelar$/)!);
    await assentar();
    await tela.reRenderizar(
      <AuthProvider>
        <PublicarGira gira={GIRA} onFechar={() => {}} onMudou={() => {}} />
      </AuthProvider>,
    );
    await assentar();
    ok(
      !/não inclui giras públicas/.test(tela.textoNaPagina()),
      "o erro velho reapareceu numa tentativa que ainda não aconteceu",
    );
  } finally {
    await limpar();
  }
});
