/**
 * "Novos do mês" — o que traz a pessoa de volta ao app.
 *
 * Sem portão: saber que o acervo cresceu é o que faz voltar, e o que se cobra
 * é a ferramenta, não a letra (ADR 0002).
 *
 * Duas coisas aqui têm história e por isso viram teste: o favorito NÃO vem
 * desta rota (é do acervo, e mora no contexto), e a lista é agrupada por
 * orixá — "ponto de Umbanda não se lê solto: saber que o ponto é de Omulu é
 * metade do que ele é".
 */

import { deepEqual, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaNovidades } from "@/pages/TelaNovidades";
import { AppProvider } from "@/context";
import { AuthProvider } from "@/auth/AuthContext";
import { EntitlementsProvider } from "@/billing/EntitlementsContext";
import type { AppData } from "@/types";

beforeEach(() => localStorage.clear());

const EU = {
  id: "u1", email: "m@e.com", email_verificado: true,
  apelido: "maria", admin: false, favoritos_publicos: false, foto: null,
};

/** A rota `/novidades` responde em snake_case — o schema dela não tem apelido. */
function novidade(id: string, titulo: string, orixa: { id: string; nome: string }) {
  return {
    id, titulo, letra: "l", ordem: 0,
    subcategoria_id: "s1",
    autor: null,
    aprovado_em: "2026-08-20T10:00:00Z",
    enviado_por: "Pai João",
    orixa: { ...orixa, cor: "#c00", emoji: "x" },
    video: null,
  };
}

const NOVIDADES = [
  novidade("n1", "Ponto de Omulu", { id: "omulu", nome: "Omulu" }),
  novidade("n2", "Outro de Omulu", { id: "omulu", nome: "Omulu" }),
  novidade("n3", "Ponto de Ogum", { id: "ogum", nome: "Ogum" }),
];

/** O acervo da pessoa, onde o favorito de verdade mora. */
const ACERVO: AppData = {
  orixas: [],
  subcategorias: [],
  pontos: [
    // A cópia pessoal do `n1`: id próprio, `origemId` apontando ao canônico.
    {
      id: "abc12345:n1", origemId: "n1", subcategoriaId: "s1", titulo: "Ponto de Omulu",
      letra: "l", favorito: true, ordem: 0, criadoEm: 0,
    },
  ],
};

async function abrir(resposta?: { status: number; corpo?: unknown }, acervo: AppData = ACERVO) {
  localStorage.setItem("pontos-umbanda-data", JSON.stringify(acervo));
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) return { corpo: EU };
    if (url.includes("/meus-direitos")) return { corpo: { plano: "gratis", repertorios: false } };
    if (url.includes("/novidades")) return resposta ?? { corpo: NOVIDADES };
    if (url.includes("/acervo")) {
      return { corpo: { ...acervo, acesso: { acervoOrganizado: false }, versao: "v1" } };
    }
    throw new Error(`chamada não prevista: ${url}`);
  });
  const { hook } = memoryLocation({ path: "/novidades" });
  const tela = await renderizar(
    <Router hook={hook}>
      <AuthProvider>
        <EntitlementsProvider>
          <AppProvider>
            <TelaNovidades />
          </AppProvider>
        </EntitlementsProvider>
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

const gruposNaTela = (tela: Tela) =>
  tela.todos("h2").map((h) => h.textContent?.trim());

test("agrupa por orixá, na ordem em que o servidor mandou", async () => {
  // "Uma fila de títulos sem esse rótulo obriga a abrir um por um para
  // descobrir onde cada um cai na gira." E a ordem dos grupos é a da
  // aprovação: o orixá que recebeu algo agora aparece primeiro.
  const { tela, limpar } = await abrir();
  try {
    deepEqual(gruposNaTela(tela), ["Omulu", "Ogum"]);
    match(tela.texto(), /3 pontos acrescentados/);
    match(tela.texto(), /2 orixás/);
  } finally {
    await limpar();
  }
});

test("o favorito vem do ACERVO, não desta rota", async () => {
  // O defeito que o comentário do arquivo registra: `favorito` vinha `false`
  // fixo, então clicar na estrela marcava de verdade no acervo e a estrela
  // continuava vazia — o botão parecia não funcionar justamente onde a pessoa
  // acabou de descobrir o ponto.
  //
  // E casa pelos DOIS ids: quem organizou o acervo tem cópia com id próprio, e
  // esta lista fala no id canônico.
  const { tela, limpar } = await abrir();
  try {
    const marcados = tela
      .todos("button[aria-label='Desfavoritar']")
      .length;
    ok(marcados === 1, `esperava 1 ponto marcado pelo acervo, achei ${marcados}`);
  } finally {
    await limpar();
  }
});

test("o ponto recém-aprovado é marcado como novo", async () => {
  // `aprovado_em` chega em ISO nesta rota (e em milissegundos no `/acervo`) —
  // a tradução mora no módulo de `api/`. Sem ela, `eNovo` recebe `null` e o
  // selo "novo" nunca aparece: a lista de novidades deixa de dizer o que é
  // novidade, e ninguém nota porque nada quebra.
  const { tela, limpar } = await abrir();
  try {
    // O SELO, não a palavra: `/novo/i` no texto da tela casa com o título
    // "Novos do mês", e passava mesmo com `aprovadoEm` nulo. A primeira versão
    // deste teste tinha esse furo, e a mutação o mostrou.
    const selos = tela
      .todos("span")
      .filter((s) => s.textContent?.trim().toLowerCase() === "novo");
    ok(selos.length === 3, `esperava 3 selos de novo, achei ${selos.length}`);
  } finally {
    await limpar();
  }
});

test("sem novidades, a tela diz isso em vez de ficar em branco", async () => {
  const { tela, limpar } = await abrir({ status: 200, corpo: [] });
  try {
    match(tela.texto(), /Pontos que a comunidade acrescentou/);
    ok(tela.naoTem('[aria-busy="true"]'), "ficou carregando sobre resposta vazia");
  } finally {
    await limpar();
  }
});

test("falha ao carregar é dita com as palavras do servidor", async () => {
  // Antes esta tela fazia `fetch` cru e rejeitava com `new Error("Falha ao
  // carregar.")` — o texto do servidor era descartado e queda de rede,
  // servidor fora e resposta ruim viravam a mesma frase.
  const { tela, limpar } = await abrir({
    status: 503, corpo: { detail: "O acervo está em manutenção. Tente em instantes." },
  });
  try {
    match(tela.texto(), /em manutenção/);
    ok(!/API 503/.test(tela.texto()), "vazou o status para a tela");
  } finally {
    await limpar();
  }
});

test("quem enviou o ponto aparece, e o e-mail nunca", async () => {
  const { tela, limpar } = await abrir();
  try {
    match(tela.texto(), /enviado por Pai João/);
    ok(!tela.texto().includes("@"), `vazou e-mail nas novidades: ${tela.texto()}`);
  } finally {
    await limpar();
  }
});
