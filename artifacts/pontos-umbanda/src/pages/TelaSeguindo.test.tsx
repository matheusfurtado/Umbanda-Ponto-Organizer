/**
 * A biblioteca — a lista que **só a própria pessoa vê**.
 *
 * "Quem alguém segue num app de Umbanda é um mapa da rede religiosa dela, e o
 * servidor nem devolve os nomes para terceiros — só a contagem." Então o que
 * se prende aqui é o que a tela promete: a lista é dela, e cada metade se
 * vira sozinha quando a outra falha.
 */

import { deepEqual, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaSeguindo } from "@/pages/TelaSeguindo";
import { AuthProvider } from "@/auth/AuthContext";
import { EntitlementsProvider } from "@/billing/EntitlementsContext";

beforeEach(() => localStorage.clear());

const ARTISTAS = [
  { id: "a1", nome: "Canal do Terreiro", pontos: 12, seguidores: 3, curado: true },
];
const GENTE = [
  { apelido: "Pai João", foto: null, giras: 2 },
];

/** Quem tem o direito de seguir artista — o caso normal desta tela. */
const ASSINANTE = { plano: "mensal", seguirArtistas: true };
/** Logado, sem plano: a estante existe, mas o que ela guarda é pago. */
const SEM_PLANO = { plano: "gratis", seguirArtistas: false };

interface Cenario {
  artistas?: { status?: number; corpo?: unknown };
  gente?: { status?: number; corpo?: unknown };
  /**
   * O plano de quem está olhando.
   *
   * Seguir artista entrou no plano pago em 03/09 (ADR 0012), e esta tela passou
   * a ler os direitos: o vazio dela muda de convite ("veja os artistas") para
   * oferta ("seguir faz parte do plano"). O padrão é assinante porque é o único
   * estado em que a lista cheia — o assunto da maioria dos testes daqui — tem
   * como existir.
   */
  direitos?: Record<string, unknown>;
}

async function abrir(c: Cenario = {}) {
  const rede = fingirRede((url) => {
    if (url.includes("/eu/artistas")) return c.artistas ?? { corpo: ARTISTAS };
    if (url.includes("/eu/seguindo")) return c.gente ?? { corpo: GENTE };
    if (url.includes("/meus-direitos")) return { corpo: c.direitos ?? ASSINANTE };
    // Precisa vir uma sessão: o `EntitlementsProvider` só BUSCA os direitos de
    // quem está logado, e sem isto todo cenário caía em grátis — inclusive os
    // que mostram a lista cheia, que passariam a medir a tela errada.
    if (url.includes("/auth/eu")) {
      return { corpo: {
        id: "u1", email: "m@e.com", email_verificado: true,
        apelido: "maria", admin: false, favoritos_publicos: false, foto: null,
      } };
    }
    throw new Error(`chamada não prevista: ${url}`);
  });
  const { hook } = memoryLocation({ path: "/seguindo" });
  const tela = await renderizar(
    <AuthProvider>
      <EntitlementsProvider>
        <Router hook={hook}>
          <TelaSeguindo />
        </Router>
      </EntitlementsProvider>
    </AuthProvider>,
  );
  await assentar();
  // DUAS voltas, e não uma: a sessão chega na primeira, e é só então que o
  // provider vai buscar os direitos. Com uma volta só, todo cenário lia
  // "grátis" e o vazio aparecia como oferta de plano onde devia ser convite.
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

const links = (tela: Tela, prefixo: string) =>
  tela.todos(`a[href^='${prefixo}']`).map((a) => a.getAttribute("href"));

test("a tela diz, na cara, que ninguém mais vê esta lista", async () => {
  // Não é decoração: é a única coisa que responde a pergunta que a pessoa faz
  // antes de seguir alguém num app que revela religião.
  const { tela, limpar } = await abrir();
  try {
    match(tela.texto(), /Ninguém mais vê quem você segue/);
  } finally {
    await limpar();
  }
});

test("artistas e pessoas aparecem, cada um levando ao seu lugar", async () => {
  const { tela, limpar } = await abrir();
  try {
    deepEqual(links(tela, "/artista/"), ["/artista/a1"]);
    deepEqual(links(tela, "/perfil/"), ["/perfil/Pai%20Jo%C3%A3o"]);
    match(tela.texto(), /12 pontos/);
    match(tela.texto(), /2 playlists públicas/);
  } finally {
    await limpar();
  }
});

test("uma metade que falha não leva a outra junto", async () => {
  // "Artista vem primeiro: é a metade que tem conteúdo do primeiro dia,
  // enquanto seguir gente depende de a comunidade existir."
  const { tela, limpar } = await abrir({
    gente: { status: 500, corpo: { detail: "estourou" } },
  });
  try {
    deepEqual(links(tela, "/artista/"), ["/artista/a1"], "a lista de artistas sumiu junto");
  } finally {
    await limpar();
  }
});

test("a metade que falhou para de fingir que está carregando", async () => {
  // Mesmo defeito da vitrine: o esqueleto olhava só para `null`, e `null` é o
  // que sobra quando a busca falha — os cartões fantasmas animavam ao lado da
  // mensagem de erro, indefinidamente.
  const { tela, limpar } = await abrir({
    gente: { status: 500, corpo: { detail: "Não consegui carregar." } },
  });
  try {
    match(tela.texto(), /Não consegui carregar/);
    ok(tela.naoTem('[aria-busy="true"]'), "mostrou o erro e continuou girando");
  } finally {
    await limpar();
  }
});

test("quem assina e não segue ninguém recebe um caminho, não um vazio", async () => {
  // O plano vem escrito de propósito: desde 03/09 o vazio da metade de
  // artistas depende dele, e este teste é o caso de quem PODE seguir — o
  // convite é para o acervo, não para a assinatura.
  const { tela, limpar } = await abrir({
    artistas: { corpo: [] },
    gente: { corpo: [] },
    direitos: ASSINANTE,
  });
  try {
    match(tela.texto(), /não segue nenhum artista/i);
    match(tela.texto(), /não segue ninguém/i);
    // E os dois caminhos de saída, que é o que transforma o vazio em convite.
    ok(tela.todos("a").some((a) => a.getAttribute("href") === "/artistas"));
    ok(tela.todos("a").some((a) => a.getAttribute("href") === "/giras-publicas"));
    ok(tela.naoTem('[aria-busy="true"]'), "ficou carregando sobre resposta vazia");
  } finally {
    await limpar();
  }
});

test("sem plano, o vazio da estante conta que seguir é pago — e não fecha a porta", async () => {
  // A estante de quem não assina está vazia porque ele não pôde encher, e não
  // porque ele não quis. Dizer "você ainda não segue nenhum artista" aqui
  // esconderia o motivo e mandaria a pessoa tentar de novo no mesmo muro.
  const { tela, limpar } = await abrir({
    artistas: { corpo: [] },
    gente: { corpo: [] },
    direitos: SEM_PLANO,
  });
  try {
    match(tela.texto(), /faz parte do plano/i);
    ok(
      tela.todos("a").some((a) => a.getAttribute("href") === "/planos"),
      "disse que é pago e não deu caminho para assinar",
    );
    // E o segundo link continua: a DESCOBERTA é aberta — a página do artista
    // não é paga, só seguir é. Mandar quem não assina para um beco com uma
    // única saída na direção do caixa é o que o ADR 0007 escolheu não fazer.
    ok(
      tela.todos("a").some((a) => a.getAttribute("href") === "/artistas"),
      "fechou a descoberta junto com o seguir",
    );
  } finally {
    await limpar();
  }
});
