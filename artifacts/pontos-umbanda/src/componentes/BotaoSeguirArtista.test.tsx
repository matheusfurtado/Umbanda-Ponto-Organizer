/**
 * Seguir um artista — o clique que muda antes da resposta.
 *
 * "`void promessa` num `onClick` engole falha de rede: o botão não muda, nada
 * aparece, e a pessoa não sabe se aconteceu." O botão é otimista de propósito,
 * e o que precisa estar preso é a VOLTA: se a chamada falhar, ele desfaz E diz
 * o que houve. Mostrar "Seguindo" para quem não está seguindo é o pior dos
 * mundos — a pessoa fecha o app achando que tem o artista na biblioteca.
 */

import { deepEqual, equal, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { BotaoSeguirArtista } from "@/componentes/BotaoSeguirArtista";

beforeEach(() => localStorage.clear());

async function abrir(
  seguindo: boolean | null,
  resposta: { status?: number; corpo?: unknown } = { status: 204 },
) {
  const mudancas: boolean[] = [];
  // Mutável: um teste precisa FALHAR e depois dar certo, para ver se a
  // mensagem velha some.
  let proxima = resposta;
  const rede = fingirRede((url) => {
    if (url.includes("/seguir")) return proxima;
    throw new Error(`chamada não prevista: ${url}`);
  });
  const tela = await renderizar(
    <BotaoSeguirArtista
      artistaId="a1"
      seguindo={seguindo}
      onMudou={(s) => mudancas.push(s)}
    />,
  );
  await assentar();
  return {
    tela,
    mudancas,
    rede,
    responderCom: (r: { status?: number; corpo?: unknown }) => { proxima = r; },
    limpar: async () => {
      await tela.desmontar();
      rede.restaurar();
    },
  };
}

const oBotao = (tela: Tela) => tela.achar("button");

test("visitante não vê botão — vê o caminho de entrar", async () => {
  // `seguindo === null` é "não sei quem é você". Um botão que não pode
  // funcionar seria pior que a frase que explica por quê.
  const { tela, limpar } = await abrir(null);
  try {
    ok(tela.naoTem("button"), "ofereceu seguir a quem não tem conta");
    match(tela.texto(), /Entre/);
    // Com o MOTIVO junto: chegar numa tela de login sem uma palavra sobre o
    // que aconteceu é o beco que o convite existe para não ser.
    ok(
      tela.achar('a[href="/login?motivo=seguir-artista"]'),
      "a frase não leva a lugar nenhum",
    );
  } finally {
    await limpar();
  }
});

test("seguir muda o botão na hora, sem esperar a ida e volta", async () => {
  const { tela, mudancas, rede, limpar } = await abrir(false);
  try {
    match(oBotao(tela)!.textContent ?? "", /Seguir/);
    await tela.clicar("button");
    // A primeira mudança é o otimismo: ela sai antes de o servidor responder.
    deepEqual(mudancas, [true]);
    await assentar();
    deepEqual(mudancas, [true], "avisou duas vezes a mesma coisa");
    // E o SENTIDO chega ao servidor: seguir é PUT.
    deepEqual(rede.chamadas.map((c) => c.metodo), ["PUT"]);
  } finally {
    await limpar();
  }
});

test("deixar de seguir também é otimista, e no sentido certo", async () => {
  const { tela, mudancas, rede, limpar } = await abrir(true);
  try {
    match(oBotao(tela)!.textContent ?? "", /Seguindo/);
    await tela.clicar("button");
    await assentar();
    deepEqual(mudancas, [false]);
    deepEqual(rede.chamadas.map((c) => c.metodo), ["DELETE"]);
  } finally {
    await limpar();
  }
});

test("falhou: o botão VOLTA ao que era, e diz o que houve", async () => {
  // O rollback sozinho não basta: sem mensagem, o botão pisca e volta, e a
  // pessoa conclui que o clique não pegou.
  const { tela, mudancas, limpar } = await abrir(false, {
    status: 503, corpo: { detail: "O servidor de artistas está fora do ar." },
  });
  try {
    await tela.clicar("button");
    await assentar();
    deepEqual(mudancas, [true, false], "não desfez o otimismo depois da falha");
    match(tela.texto(), /fora do ar/);
    ok(tela.achar('[role="alert"]'), "o erro não é anunciado a leitor de tela");
  } finally {
    await limpar();
  }
});

test("tentar de novo apaga a mensagem da tentativa anterior", async () => {
  // Erro que sobrevive à tentativa seguinte é pior que erro nenhum: o botão
  // diz "Seguindo" e, logo abaixo, uma linha vermelha diz que não deu.
  const { tela, responderCom, limpar } = await abrir(false, {
    status: 503, corpo: { detail: "O servidor de artistas está fora do ar." },
  });
  try {
    await tela.clicar("button");
    await assentar();
    match(tela.texto(), /fora do ar/);

    responderCom({ status: 204 });
    await tela.clicar("button");
    await assentar();
    ok(
      !/fora do ar/.test(tela.texto()),
      `a mensagem da falha anterior ficou: ${tela.texto()}`,
    );
  } finally {
    await limpar();
  }
});

test("o estado de seguir é anunciado, e não só desenhado", async () => {
  // Um ícone de check trocando por um `+` não diz nada a quem não vê a tela.
  const { tela, limpar } = await abrir(true);
  try {
    ok(oBotao(tela)!.getAttribute("aria-pressed") === "true");
  } finally {
    await limpar();
  }
});

test("no cartão do diretório o convite cabe: vira botão, não parágrafo", async () => {
  // Na página do artista o convite é um parágrafo inteiro — ali há espaço e a
  // ação é a principal. Num cartão de lista, o mesmo parágrafo empurraria o
  // nome do terreiro para fora.
  const { tela, limpar } = await abrir(null);
  try {
    await tela.reRenderizar(
      <BotaoSeguirArtista artistaId="a1" seguindo={null} compacto onMudou={() => {}} />,
    );
    const convite = tela.exigir('a[href="/login?motivo=seguir-artista"]');
    match(convite.textContent ?? "", /Seguir/);
    equal(convite.getAttribute("aria-label"), "Entrar para seguir este artista");
    ok(tela.naoTem("p"), "sobrou o parágrafo da versão grande dentro do cartão");
  } finally {
    await limpar();
  }
});
