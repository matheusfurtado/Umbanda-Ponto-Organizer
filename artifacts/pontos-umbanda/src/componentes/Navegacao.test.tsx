/**
 * O que cada barra oferece, e para quem.
 *
 * Nenhuma das duas tinha teste, e elas são o índice do app inteiro: item que
 * aparece para quem não pode usá-lo vira promessa quebrada em toda abertura.
 */

import { deepEqual, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { BarraLateral } from "@/componentes/BarraLateral";
import { BarraInferior } from "@/componentes/BarraInferior";
import { AppProvider } from "@/context";
import { AuthProvider } from "@/auth/AuthContext";
import { EntitlementsProvider } from "@/billing/EntitlementsContext";
import type { AppData } from "@/types";

beforeEach(() => localStorage.clear());

const EU = {
  id: "u1", email: "m@e.com", email_verificado: true,
  apelido: "maria", admin: false, foto: null, favoritos_publicos: false,
};

const ACERVO: AppData = {
  orixas: [{ id: "ogum", nome: "Ogum", cor: "#c00", emoji: "⚔️", ordem: 0 }] as AppData["orixas"],
  subcategorias: [],
  pontos: [{
    id: "p1", subcategoriaId: "s1", titulo: "Ogum de Lei",
    letra: "l", favorito: true, ordem: 0, criadoEm: 0,
  }],
};

async function abrir(Barra: typeof BarraLateral, logado: boolean) {
  localStorage.setItem("pontos-umbanda-data", JSON.stringify(ACERVO));
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) return logado ? { corpo: EU } : { status: 401, corpo: {} };
    if (url.includes("/meus-direitos")) return { corpo: { plano: "gratis", repertorios: false } };
    if (url.includes("/acervo")) return { corpo: { ...ACERVO, acesso: {}, versao: "v1" } };
    throw new Error(`chamada não prevista: ${url}`);
  });
  const tela = await renderizar(
    <Router hook={memoryLocation({ path: "/" }).hook}>
      <AuthProvider>
        <EntitlementsProvider>
          <AppProvider>
            <Barra onTrocarPaleta={() => {}} />
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

const destinos = (tela: Tela) =>
  tela.todos("a").map((a) => a.getAttribute("href"));

for (const [nome, Barra] of [
  ["lateral", BarraLateral],
  ["inferior", BarraInferior],
] as const) {
  test(`barra ${nome}: sem conta, Favoritos NÃO é oferecido`, async () => {
    // A lista de favoritos é da conta. Sem sessão ela é sempre vazia — e um
    // item de menu que abre uma tela vazia todas as vezes é pior que a ausência
    // dele. No celular custa ainda mais: é um quinto da navegação inteira.
    const { tela, limpar } = await abrir(Barra, false);
    try {
      ok(
        !destinos(tela).includes("/favoritos"),
        `ofereceu Favoritos a quem não entrou: ${destinos(tela).join(", ")}`,
      );
    } finally {
      await limpar();
    }
  });

  test(`barra ${nome}: com conta, Favoritos volta`, async () => {
    const { tela, limpar } = await abrir(Barra, true);
    try {
      ok(
        destinos(tela).includes("/favoritos"),
        `escondeu Favoritos de quem entrou: ${destinos(tela).join(", ")}`,
      );
    } finally {
      await limpar();
    }
  });
}

test("a barra lateral continua aberta ao que é de todo mundo", async () => {
  // O portão é só no Favoritos. Artistas, novidades e a comunidade são a porta
  // de entrada de quem ainda não tem conta — é por elas que alguém decide ter.
  const { tela, limpar } = await abrir(BarraLateral, false);
  try {
    const abertos = destinos(tela).filter((h): h is string => h !== null);
    deepEqual(
      ["/", "/buscar", "/novidades", "/giras-publicas", "/artistas"].filter((r) => abertos.includes(r)),
      ["/", "/buscar", "/novidades", "/giras-publicas", "/artistas"],
      `sumiu algo que é de todo mundo: ${abertos.join(", ")}`,
    );
  } finally {
    await limpar();
  }
});

test("a lateral leva a 'Meus artistas' com esse nome, e só para quem entrou", async () => {
  // Chamava-se "Biblioteca": exato e sem serventia — ninguém procura
  // "biblioteca" atrás do artista que acabou de seguir. E é de quem tem conta:
  // sem sessão a lista é sempre vazia.
  const comConta = await abrir(BarraLateral, true);
  try {
    const item = comConta.tela
      .todos("a")
      .find((a) => a.getAttribute("href") === "/seguindo");
    ok(item, "sumiu o caminho para os artistas que a pessoa segue");
    ok(
      /Meus artistas/.test(item.textContent ?? ""),
      `o item voltou a se chamar "${item.textContent?.trim()}"`,
    );
  } finally {
    await comConta.limpar();
  }

  const semConta = await abrir(BarraLateral, false);
  try {
    ok(
      !destinos(semConta.tela).includes("/seguindo"),
      "ofereceu a lista de seguidos a quem não entrou",
    );
  } finally {
    await semConta.limpar();
  }
});

test("a lateral leva a /organizar — a ferramenta pela qual se cobra", async () => {
  // Não havia UM link para `/organizar` em todo o front. A rota existia desde
  // sempre (arrastar, renomear, criar e excluir orixá, seção e ponto) e só
  // chegava lá quem digitasse a URL: o produto PAGO era, na prática,
  // invisível. Um link que ninguém prende é um link que some de novo.
  const comConta = await abrir(BarraLateral, true);
  try {
    const item = comConta.tela
      .todos("a")
      .find((a) => a.getAttribute("href") === "/organizar");
    ok(item, "sumiu o caminho para organizar o acervo");
    ok(
      /Organizar/.test(item.textContent ?? ""),
      `o item não diz o que faz: "${item.textContent?.trim()}"`,
    );
  } finally {
    await comConta.limpar();
  }
});

test("sem conta, /organizar não é oferecido", async () => {
  // Sem sessão não há acervo próprio para organizar, e o editor mandaria a
  // pessoa para o login depois do clique — pior que não oferecer.
  const semConta = await abrir(BarraLateral, false);
  try {
    ok(
      !semConta.tela.todos("a").some((a) => a.getAttribute("href") === "/organizar"),
      "ofereceu organizar o acervo a quem não entrou",
    );
  } finally {
    await semConta.limpar();
  }
});

/**
 * As filas de moderação chegam nos DOIS lugares — e é a mesma lista.
 *
 * Elas eram mantidas à mão em cada lugar, e divergiram: a barra lateral tinha
 * oito links e o recuo do celular (`TelaConta`) tinha três. Faltavam
 * casamentos, "Fora do app", sugestões e perfis de artista, e pedidos para
 * sair — e as duas MAIORES em volume estavam entre as que faltavam: 395
 * casamentos e 1.031 pontos fora do app.
 *
 * Num app cujo próprio código anota que "quem modera é uma pessoa só, e o
 * aparelho dela é o celular", a barra lateral é `lg:` para cima.
 */

import { LINKS_DE_MODERACAO } from "@/componentes/linksDeModeracao";
import { TelaConta } from "@/pages/TelaConta";

const ADMIN = { ...EU, admin: true };

async function abrirConta(logado = true) {
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) return logado ? { corpo: ADMIN } : { status: 401, corpo: {} };
    if (url.includes("/meus-direitos")) return { corpo: { plano: "gratis", repertorios: false } };
    if (url.includes("/acervo")) return { corpo: { ...ACERVO, acesso: {}, versao: "v1" } };
    if (url.includes("/assinatura")) return { status: 404, corpo: {} };
    return { corpo: {} };
  });
  const tela = await renderizar(
    <Router hook={memoryLocation({ path: "/conta" }).hook}>
      <AuthProvider>
        <EntitlementsProvider>
          <AppProvider>
            <TelaConta />
          </AppProvider>
        </EntitlementsProvider>
      </AuthProvider>
    </Router>,
  );
  await assentar();
  return { tela, limpar: async () => { await tela.desmontar(); rede.restaurar(); } };
}

const hrefs = (tela: Tela) =>
  new Set(tela.todos("a").map((a) => a.getAttribute("href")));

test("o celular leva a TODAS as filas de moderação, não a três delas", async () => {
  const { tela, limpar } = await abrirConta();
  try {
    const na_tela = hrefs(tela);
    const faltando = LINKS_DE_MODERACAO
      .map((l) => l.href)
      .filter((href) => !na_tela.has(href));
    ok(
      faltando.length === 0,
      `quem modera pelo celular não alcança: ${faltando.join(", ")}`,
    );
  } finally {
    await limpar();
  }
});

test("quem não é admin não vê as filas no celular", async () => {
  // O link só some por conveniência: a defesa é a rota, que responde 404.
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) return { corpo: EU };
    if (url.includes("/meus-direitos")) return { corpo: { plano: "gratis", repertorios: false } };
    if (url.includes("/acervo")) return { corpo: { ...ACERVO, acesso: {}, versao: "v1" } };
    return { corpo: {} };
  });
  const tela = await renderizar(
    <Router hook={memoryLocation({ path: "/conta" }).hook}>
      <AuthProvider>
        <EntitlementsProvider>
          <AppProvider>
            <TelaConta />
          </AppProvider>
        </EntitlementsProvider>
      </AuthProvider>
    </Router>,
  );
  await assentar();
  try {
    const na_tela = hrefs(tela);
    ok(!na_tela.has("/moderacao/casamentos"), "ofereceu fila a quem não modera");
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});

async function abrirLateralComoAdmin() {
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) return { corpo: ADMIN };
    if (url.includes("/meus-direitos")) return { corpo: { plano: "gratis", repertorios: false } };
    if (url.includes("/acervo")) return { corpo: { ...ACERVO, acesso: {}, versao: "v1" } };
    return { corpo: {} };
  });
  const tela = await renderizar(
    <Router hook={memoryLocation({ path: "/" }).hook}>
      <AuthProvider>
        <EntitlementsProvider>
          <AppProvider>
            <BarraLateral onTrocarPaleta={() => {}} />
          </AppProvider>
        </EntitlementsProvider>
      </AuthProvider>
    </Router>,
  );
  await assentar();
  return { tela, limpar: async () => { await tela.desmontar(); rede.restaurar(); } };
}

test("a barra lateral mostra a MESMA lista que o celular", async () => {
  // As duas eram mantidas à mão, e divergiram: oito links aqui, três lá. Se
  // uma das duas ganhar um link solto, volta a ser mantida à mão — e este
  // teste é o que impede.
  const { tela, limpar } = await abrirLateralComoAdmin();
  try {
    const na_tela = hrefs(tela);
    const faltando = LINKS_DE_MODERACAO
      .map((l) => l.href)
      .filter((href) => !na_tela.has(href));
    ok(faltando.length === 0, `a lateral não leva a: ${faltando.join(", ")}`);
  } finally {
    await limpar();
  }
});

test("sem conta de moderação, a lateral não oferece fila nenhuma", async () => {
  const comConta = await abrir(BarraLateral, true);
  try {
    const na_tela = hrefs(comConta.tela);
    const oferecidas = LINKS_DE_MODERACAO
      .map((l) => l.href)
      .filter((href) => na_tela.has(href));
    ok(oferecidas.length === 0, `ofereceu a quem não modera: ${oferecidas.join(", ")}`);
  } finally {
    await comConta.limpar();
  }
});

test("toda rota de moderação registrada tem link em algum lugar", async () => {
  // GUARDA DE COMPLETUDE, e ela é o que separa esta lista de decoração.
  //
  // Os dois testes acima conferem que a lateral e o celular mostram A MESMA
  // lista — e continuam passando se alguém apagar uma fila DA lista: os dois
  // ficam coerentes e sem o link. Foi exatamente esse o defeito do
  // `/organizar`, que existiu como rota por meses sem um único link no front.
  //
  // Aqui a conferência é contra o que o App REGISTRA. Rota de moderação que
  // ninguém alcança é trabalho que ninguém faz.
  const { readFileSync } = await import("node:fs");
  const app = readFileSync(
    new URL("../App.tsx", import.meta.url),
    "utf8",
  );
  const registradas = [
    ...app.matchAll(/<Route path="(\/moderacao[^"]*|\/denuncias|\/painel)">/g),
  ].map((m) => m[1]);

  ok(registradas.length >= 5, `li ${registradas.length} rotas — o extrator cegou`);

  const comLink = new Set(LINKS_DE_MODERACAO.map((l) => l.href));
  const orfas = registradas.filter((r) => !comLink.has(r));
  ok(
    orfas.length === 0,
    `rotas de moderação sem link em lugar nenhum: ${orfas.join(", ")}`,
  );
});

test("dá para chegar na própria conta — nas DUAS barras", async () => {
  // A página `/conta` existia e não tinha link nenhum: só se chegava nela
  // digitando a URL, ou por um link solto dentro da Política de Privacidade.
  //
  // É onde moram "Sair da conta" e "Apagar conta". No celular era pior: a
  // lateral é `hidden ... lg:flex`, então não havia caminho NENHUM para sair
  // da conta nem para apagá-la — e apagar os próprios dados é direito, não
  // conveniência.
  for (const Barra of [BarraLateral, BarraInferior]) {
    const { tela, limpar } = await abrir(Barra, true);
    try {
      const conta = tela
        .todos("a")
        .filter((a) => a.getAttribute("href") === "/conta");
      ok(
        conta.length === 1,
        `esperava um link para /conta, achei ${conta.length}`,
      );
    } finally {
      await limpar();
    }
  }
});

test("visitante NÃO vê o link da conta", async () => {
  // Para quem não entrou, o item levaria a uma tela sobre uma conta que não
  // existe — e no celular custaria um sexto da navegação.
  for (const Barra of [BarraLateral, BarraInferior]) {
    const { tela, limpar } = await abrir(Barra, false);
    try {
      ok(
        !tela.todos("a").some((a) => a.getAttribute("href") === "/conta"),
        "ofereceu conta a quem não entrou",
      );
    } finally {
      await limpar();
    }
  }
});
