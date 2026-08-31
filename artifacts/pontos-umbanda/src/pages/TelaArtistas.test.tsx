/**
 * O diretório de artistas.
 *
 * Era uma coluna de 16 retângulos iguais: não dava para reconhecer ninguém sem
 * ler, nem para ver quem pesa mais no acervo sem comparar número por número —
 * que é justamente o que uma lista ordenada por quantidade deveria responder de
 * relance.
 */

import { deepEqual, equal, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaArtistas } from "@/pages/TelaArtistas";
import { AuthProvider } from "@/auth/AuthContext";

beforeEach(() => localStorage.clear());

const artista = (over: Record<string, unknown> = {}) => ({
  id: "a1", nome: "Canal do Terreiro", pontos: 10, seguidores: 0,
  curado: true, foto: null, ...over,
});

async function abrir(resposta: { status?: number; corpo?: unknown }) {
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) return { status: 401, corpo: {} };
    if (url.includes("/artistas")) return resposta;
    throw new Error(`chamada não prevista: ${url}`);
  });
  const tela = await renderizar(
    <Router hook={memoryLocation({ path: "/artistas" }).hook}>
      <AuthProvider>
        <TelaArtistas />
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

/** As barras, na ordem da lista. */
const barras = (tela: Tela) =>
  tela
    .todos("span[style]")
    .map((s) => s.getAttribute("style") ?? "")
    // Em POR CENTO: o avatar também tem `width` no estilo, em px. Filtrar por
    // "width" pegava os dois e a asserção comparava outra coisa.
    .map((s) => /width:\s*([\d.]+)%/.exec(s)?.[1])
    .filter((v): v is string => v !== undefined);

test("cada artista leva à página dele, com o nome inteiro", async () => {
  // Truncar no meio apaga justamente o que identifica o terreiro.
  const nome = "Tenda Espírita S. Jorge Pai Joaquim D'Angola";
  const { tela, limpar } = await abrir({ corpo: [artista({ nome: `${nome} ` })] });
  try {
    // Só os links de ARTISTA: o convite para sugerir mora no fim da mesma
    // tela e leva ao login quando não há sessão.
    deepEqual(
      tela.todos("a").map((a) => a.getAttribute("href"))
        .filter((h) => h?.startsWith("/artista/")),
      ["/artista/a1"],
    );
    // Medido no ELEMENTO do nome, e não no texto da tela: `tela.texto()` cola
    // tudo, e a asserção antiga passava mesmo com o espaço sobrando porque não
    // dava para distinguir. A mutação mostrou.
    const titulo = tela
      .todos("span")
      .find((s) => (s.getAttribute("class") ?? "").includes("line-clamp"));
    ok(titulo, "o nome do artista sumiu do cartão");
    equal(titulo.textContent, nome, `não aparou: ${JSON.stringify(titulo.textContent)}`);
  } finally {
    await limpar();
  }
});

test("a barra é proporcional ao MAIOR do acervo, não a um teto fixo", async () => {
  // Com teto fixo, as barras encolheriam todas juntas no dia em que o acervo
  // crescer — e a comparação, que é a única coisa que a barra dá, sumiria.
  const { tela, limpar } = await abrir({
    corpo: [artista({ id: "a1", pontos: 44 }), artista({ id: "a2", pontos: 11 })],
  });
  try {
    deepEqual(barras(tela), ["100", "25"]);
  } finally {
    await limpar();
  }
});

test("a barra NÃO é anunciada — ela repete o número que está acima", async () => {
  const { tela, limpar } = await abrir({ corpo: [artista({ pontos: 20 })] });
  try {
    const barra = tela.todos("span").find((s) =>
      (s.getAttribute("class") ?? "").includes("rounded-full bg-muted"));
    ok(barra, "sumiu a barra");
    equal(barra.getAttribute("aria-hidden"), "true", "o leitor de tela vai dizer o número duas vezes");
  } finally {
    await limpar();
  }
});

test("sem foto, o avatar é a inicial sobre a cor do nome", async () => {
  const { tela, limpar } = await abrir({ corpo: [artista()] });
  try {
    const avatar = tela.todos("span").find((s) => /hsl\(/.test(s.getAttribute("style") ?? ""));
    ok(avatar, "o avatar saiu sem cor");
    equal(avatar.textContent, "C");
    ok(tela.naoTem("img"), "inventou uma imagem para quem não tem foto");
  } finally {
    await limpar();
  }
});

test("com foto, a foto VENCE a inicial — rosto reconhece melhor que letra", async () => {
  const { tela, limpar } = await abrir({
    corpo: [artista({ foto: "/api/v1/artistas/a1/foto?v=abc" })],
  });
  try {
    const img = tela.achar("img");
    ok(img, "a lista ignorou a foto do artista");
    equal(img.getAttribute("src"), "/api/v1/artistas/a1/foto?v=abc");
    // `alt` vazio: o nome está do lado, em texto. Repeti-lo faria o leitor de
    // tela dizer duas vezes.
    equal(img.getAttribute("alt"), "");
  } finally {
    await limpar();
  }
});

test("seguidores só aparecem quando existem", async () => {
  // São zero em todos hoje. "0 seguindo" em 16 cartões é ruído em toda linha.
  // Contando a LINHA de metadados, e não procurando "0" no texto da tela: com
  // `pontos: 10` na mesma linha, qualquer regex de dígito solto passava dos
  // dois jeitos. Medido por mutação.
  // Pela CLASSE da linha de metadados, e não pelo primeiro span que contém
  // "pontos": o cartão inteiro também contém, e a busca casava com o
  // embrulho (nome + dados juntos).
  const linhaDeDados = (tela: Tela) =>
    tela
      .todos("span")
      .find((s) => (s.getAttribute("class") ?? "").includes("text-xs text-muted-foreground"))
      ?.textContent ?? "(não achei a linha de dados)";

  const zero = await abrir({ corpo: [artista({ pontos: 10, seguidores: 0 })] });
  try {
    equal(linhaDeDados(zero.tela).trim(), "10 pontos", "mostrou zero seguidores");
  } finally {
    await zero.limpar();
  }
  const alguns = await abrir({ corpo: [artista({ pontos: 10, seguidores: 3 })] });
  try {
    match(linhaDeDados(alguns.tela), /10 pontos\s*3/);
  } finally {
    await alguns.limpar();
  }
});

test("carregando, erro e vazio, cada um com a sua cara", async () => {
  const vazio = await abrir({ corpo: [] });
  try {
    match(vazio.tela.texto(), /Nenhum artista no acervo ainda/);
    ok(vazio.tela.naoTem('[aria-busy="true"]'), "continuou carregando sobre resposta vazia");
    // E o vazio não é beco: o convite para sugerir fica ali.
    match(vazio.tela.texto(), /Está faltando algum canal/);
  } finally {
    await vazio.limpar();
  }
  const ruim = await abrir({ status: 503, corpo: { detail: "O acervo está em manutenção." } });
  try {
    match(ruim.tela.texto(), /em manutenção/);
    ok(ruim.tela.naoTem('[aria-busy="true"]'), "mostrou o erro e continuou girando");
  } finally {
    await ruim.limpar();
  }
});

test("o botão de seguir NÃO está dentro do link do cartão", async () => {
  // Botão dentro de link é HTML inválido: o navegador desfaz o aninhamento e o
  // de dentro deixa de funcionar, sem erro nenhum. Mesma armadilha do
  // `CartaoGira` — e aqui o que morreria é justamente a ação nova.
  const { tela, limpar } = await abrir({ corpo: [artista({ seguindo: false })] });
  try {
    ok(tela.naoTem("a a"), "o convite de seguir voltou para dentro do link do cartão");
    ok(tela.naoTem("a button"), "o botão de seguir voltou para dentro do link do cartão");
  } finally {
    await limpar();
  }
});

test("o botão de seguir fica ACIMA da camada que cobre o cartão", async () => {
  // Sem o `z-10`, a camada do link cobre o botão e o clique abre a página em
  // vez de seguir. Não dá para prender isso pelo DOM — happy-dom não tem motor
  // de layout —, então a checagem é sobre a ordem das camadas na fonte, e o
  // teste de ausência de aninhamento acima cobre a outra metade.
  const { tela, limpar } = await abrir({ corpo: [artista({ seguindo: false })] });
  try {
    const cobre = tela.exigir('a[href="/artista/a1"]').getAttribute("class") ?? "";
    ok(/\babsolute\b/.test(cobre) && /\bz-0\b/.test(cobre), `a camada mudou: ${cobre}`);
    const acima = tela
      .todos("span")
      .find((s) => /\brelative\b/.test(s.getAttribute("class") ?? "")
        && /\bz-10\b/.test(s.getAttribute("class") ?? ""));
    ok(acima, "o botão de seguir perdeu a camada de cima — o clique vai abrir a página");
    ok(acima.querySelector("button, a"), "a camada de cima ficou vazia");
  } finally {
    await limpar();
  }
});

test("visitante vê o convite de seguir, e ele leva ao login", async () => {
  const { tela, limpar } = await abrir({ corpo: [artista({ seguindo: null })] });
  try {
    ok(
      tela.achar('a[href="/login?motivo=seguir-artista"]'),
      "quem não entrou ficou sem caminho para seguir",
    );
  } finally {
    await limpar();
  }
});
