/**
 * Trocar de artista sem sair da página — o cenário do achado #14.
 *
 * O `Route path="/artista/:id"` NÃO remonta o componente quando só o parâmetro
 * muda. Tudo que é sobre o artista anterior precisa ser zerado à mão, e
 * esquecer um estado não dá erro: dá a tela do outro artista.
 *
 * Isto não tinha como ser testado antes — é efeito de React reagindo a uma
 * prop de rota, exatamente o que uma suíte sem renderizador não alcança.
 *
 * ## Por que esta página agora precisa de dois providers
 *
 * Seguir artista virou pago em 03/09 (ADR 0012), e o `BotaoSeguirArtista` que
 * mora no cabeçalho daqui passou a chamar `useEntitlements()`. Sem
 * `<EntitlementsProvider>` — que por sua vez só busca os direitos quando há
 * sessão, e portanto pede `<AuthProvider>` por fora — a montagem estoura em
 * "useEntitlements deve ser usado dentro de EntitlementsProvider", antes de
 * existir tela para medir. Nada do que estes testes protegem mudou: o que
 * mudou foi o que é preciso estar em volta para a tela existir.
 */

import { equal, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { act } from "react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaArtista } from "@/pages/TelaArtista";
import { AuthProvider } from "@/auth/AuthContext";
import { EntitlementsProvider } from "@/billing/EntitlementsContext";
import type { Artista, PontoDoArtista } from "@/api/artista";

// Os dois providers lembram no `localStorage` quem estava aqui e que plano ele
// tinha — é o que faz o app abrir sem rede, no terreiro. Num arquivo de teste
// isso vira herança entre casos: sem limpar, o segundo teste começa com a
// sessão que o primeiro deixou.
beforeEach(() => localStorage.clear());

function ponto(id: string, orixaId: string, titulo: string): PontoDoArtista {
  return {
    id, titulo,
    orixa: orixaId === "ogum" ? "Ogum" : "Oxum",
    orixaId,
    orixaEmoji: orixaId === "ogum" ? "⚔️" : "💛",
    orixaCor: "#c00",
    orixaTipo: "orixa",
    letra: "l",
    cliques: 0,
    videoUrl: null,
    videoStatus: null,
  };
}

function artista(id: string, nome: string, pontos: PontoDoArtista[]): Artista {
  return {
    id, nome, pontos: pontos.length, seguidores: 0, curado: false,
    canalUrl: null, bio: null, foto: null,
    // `seguindo: false`, e não `null`: os cenários daqui têm sessão (ver
    // `comProviders`), e é isso que o servidor responde a quem está logado e
    // ainda não segue. `null` quer dizer "não sei quem é você" — afirmar as
    // duas coisas ao mesmo tempo montaria uma tela que não existe.
    possoEditar: false, seguindo: false,
    pontosDoArtista: pontos,
  };
}

/** Só de Ogum. */
const ANA = artista("ana", "Ana do Terreiro", [
  ponto("a1", "ogum", "Ogum de Lei"),
  ponto("a2", "ogum", "Ogum Megê"),
]);
/** Só de Oxum — NENHUM ponto de Ogum. É esse o par que expõe o defeito. */
const BENTO = artista("bento", "Bento Cantador", [
  ponto("b1", "oxum", "Oxum de Ouro"),
]);

const ACERVO: Record<string, Artista> = { ana: ANA, bento: BENTO };

/** Quem está olhando. Precisa vir sessão, senão o provider nem pergunta o plano. */
const MARIA = {
  id: "u1", email: "m@e.com", email_verificado: true,
  apelido: "maria", admin: false, favoritos_publicos: false, foto: null,
};

/**
 * Tem conta e NÃO assina — o cenário de todos os testes daqui, de propósito.
 *
 * É o pior caso para a DESCOBERTA, que o ADR 0007 manda continuar aberta: quem
 * paga vê tudo por definição, então um portão posto por engano nesta página só
 * apareceria a quem está aqui sem plano. Com plano, o único efeito na tela é o
 * `BotaoSeguirArtista` virar botão em vez de convite para assinar — e disso
 * quem cuida é `BotaoSeguirArtista.test.tsx`.
 */
const SEM_PLANO = { plano: "gratis", seguirArtistas: false };

type Resposta = { status?: number; corpo?: unknown };

/**
 * Ensina à rede falsa as duas chamadas que os providers fazem sozinhos.
 *
 * `fingirRede` transforma URL não prevista em erro — o que é bom, e é por isso
 * que a sessão e o plano entram aqui uma vez só, em vez de em cada teste. Elas
 * são atendidas ANTES de delegar porque as rotas abaixo leem o id do artista
 * da própria URL: `/auth/eu` cairia lá como um artista chamado `undefined`, e
 * o corpo vazio que voltasse seria lido como usuário logado — uma sessão
 * inventada pelo dublê.
 */
function comProviders(
  rota: (url: string) => Resposta | Promise<Resposta>,
  direitos: Record<string, unknown> = SEM_PLANO,
) {
  return (url: string): Resposta | Promise<Resposta> => {
    if (url.includes("/auth/eu")) return { corpo: MARIA };
    if (url.includes("/meus-direitos")) return { corpo: direitos };
    return rota(url);
  };
}

async function abrir(inicio: string) {
  const { hook, navigate } = memoryLocation({ path: inicio, record: true });
  const tela = await renderizar(
    <Router hook={hook}>
      <AuthProvider>
        <EntitlementsProvider>
          <TelaArtista />
        </EntitlementsProvider>
      </AuthProvider>
    </Router>,
  );
  // DUAS voltas, e não uma: a sessão chega na primeira, e só então o provider
  // vai buscar os direitos. Com uma volta só o cenário lia "grátis" por ainda
  // não ter terminado de perguntar — passar assim seria passar por acidente.
  await assentar();
  await assentar();
  return { tela, navigate };
}

test("o filtro do artista anterior não atravessa para o próximo", async () => {
  const rede = fingirRede(comProviders((url) => {
    const id = url.split("/artistas/")[1];
    return { corpo: ACERVO[id] };
  }));
  try {
    const { tela, navigate } = await abrir("/artista/ana");
    match(tela.texto(), /Ana do Terreiro/);

    // Filtra por Ogum — entidade que a Ana tem e o Bento não.
    const chipOgum = tela
      .todos("button[aria-pressed]")
      .find((b) => b.textContent?.includes("Ogum"));
    ok(chipOgum, `não achei o chip de Ogum em: ${tela.texto()}`);
    await tela.clicar(chipOgum);
    equal(chipOgum.getAttribute("aria-pressed"), "true");
    match(tela.texto(), /Ogum de Lei/);

    // Troca de artista SEM sair da rota: só a URL muda, o componente fica.
    await act(async () => {
      navigate("/artista/bento");
    });

    match(tela.texto(), /Bento Cantador/, "não carregou o segundo artista");
    match(
      tela.texto(),
      /Oxum de Ouro/,
      "a página do Bento veio VAZIA: o filtro de Ogum atravessou, e como " +
        "`pontosDoArtista.length` não é zero o estado de vazio também não apareceu",
    );
    const todos = tela
      .todos("button[aria-pressed]")
      .find((b) => b.textContent?.trim().startsWith("Todos"));
    equal(todos?.getAttribute("aria-pressed"), "true", "o chip aceso é do artista que saiu");
    await tela.desmontar();
  } finally {
    rede.restaurar();
  }
});

test("a resposta atrasada do primeiro artista não escreve na tela do segundo", async () => {
  let soltarAna: (() => void) | null = null;
  const rede = fingirRede(comProviders(async (url) => {
    const id = url.split("/artistas/")[1];
    if (id === "ana") {
      await new Promise<void>((resolver) => {
        soltarAna = resolver;
      });
    }
    return { corpo: ACERVO[id] };
  }));
  try {
    const { tela, navigate } = await abrir("/artista/ana");
    // A Ana ainda não respondeu: a tela está no esqueleto. As voltas de
    // `abrir` só assentaram a sessão e o plano — a resposta do artista continua
    // presa até `soltarAna`.
    ok(tela.achar('[aria-busy="true"]'), "devia estar carregando");

    await act(async () => {
      navigate("/artista/bento");
    });
    match(tela.texto(), /Bento Cantador/);

    // AGORA a Ana responde, atrasada.
    await act(async () => {
      soltarAna?.();
      await new Promise((r) => setTimeout(r, 0));
    });

    match(tela.texto(), /Bento Cantador/, "a resposta velha da Ana venceu a do Bento");
    ok(
      !tela.texto().includes("Ana do Terreiro"),
      "o artista A ficou embaixo da URL do artista B",
    );
    await tela.desmontar();
  } finally {
    rede.restaurar();
  }
});

test("artista sem ponto nenhum DIZ isso, em vez de ficar em branco", async () => {
  const rede = fingirRede(comProviders(() => ({ corpo: artista("vazio", "Canal Novo", []) })));
  try {
    const { tela } = await abrir("/artista/vazio");
    match(tela.texto(), /Nenhum ponto ligado a este artista/);
    await tela.desmontar();
  } finally {
    rede.restaurar();
  }
});

test("falha ao carregar tem mensagem E saída, não uma tela morta", async () => {
  const rede = fingirRede(
    comProviders(() => ({ status: 404, corpo: { detail: "Artista não encontrado." } })),
  );
  try {
    const { tela } = await abrir("/artista/fantasma");
    const aviso = tela.exigir('[role="alert"]');
    match(aviso.textContent ?? "", /Artista não encontrado/);
    // A saída importa tanto quanto o aviso: erro sem caminho de volta é beco.
    const volta = tela.todos("a").find((a) => a.getAttribute("href") === "/artistas");
    ok(volta, `sem link de volta em: ${tela.html()}`);
    await tela.desmontar();
  } finally {
    rede.restaurar();
  }
});

test("o link do vídeo aparece SEM plano — é a exceção do ADR 0007", async () => {
  // Deliberado, e por isso frágil: quem for fechar o portão do vídeo um dia vai
  // passar por aqui achando que achou um furo. A página do artista manda
  // `videoUrl` para todo mundo; o que continua pago é a ORDEM litúrgica.
  //
  // O "sem plano" deixou de ser implícito em 03/09: agora há sessão e um
  // `/meus-direitos` respondendo `gratis` (ver `SEM_PLANO`), então esta é
  // mesmo a tela de quem tem conta e não assina — e não a de um provider que
  // ninguém consultou.
  const comVideo = artista("ana", "Ana do Terreiro", [
    { ...ponto("a1", "ogum", "Ogum de Lei"), videoUrl: "https://youtu.be/x", videoStatus: "encontrado" },
  ]);
  const rede = fingirRede(comProviders(() => ({ corpo: comVideo })));
  try {
    const { tela } = await abrir("/artista/ana");
    const ouvir = tela.todos("a").find((a) => a.getAttribute("href") === "https://youtu.be/x");
    ok(ouvir, "o link do vídeo sumiu da página do artista (ver ADR 0007)");
    // E o convite para assinar está na mesma tela: é o que prova que o cenário
    // é de quem NÃO tem plano, e não de um portão que deixou de existir.
    // O convite virou BOTÃO (ele abre o pop-up do plano em vez de trocar a
    // pessoa de tela); antes era um link para `/planos`. O que a asserção
    // ancora continua o mesmo: sem o convite na tela, este teste não estaria
    // mais medindo uma tela SEM plano.
    ok(
      tela.todos("button").some((b) => /Seguir/.test(b.textContent ?? "")) &&
        /faz parte do plano/i.test(tela.texto()),
      "o cenário perdeu o portão: sem o convite a assinar, este teste não " +
        "estaria mais medindo uma tela sem plano",
    );
    await tela.desmontar();
  } finally {
    rede.restaurar();
  }
});
