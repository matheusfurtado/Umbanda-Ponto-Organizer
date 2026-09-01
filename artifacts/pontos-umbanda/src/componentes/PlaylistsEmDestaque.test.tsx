/**
 * As playlists na tela inicial, com o botão de guardar.
 *
 * *"quero acessar todas no início, organizar acervo nasce vazio, e do início
 * acesso playlist e salvo elas pra aparecer em organizar acervo"* (02/09).
 *
 * Os dois passos — achar e guardar — estavam a dois cliques e um menu de
 * distância do lugar onde as pessoas chegam.
 */

import { deepEqual, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { PlaylistsEmDestaque } from "@/componentes/PlaylistsEmDestaque";
import { AuthProvider } from "@/auth/AuthContext";

beforeEach(() => localStorage.clear());

const EU = {
  id: "u1", email: "m@e.com", email_verificado: true,
  apelido: "maria", admin: false, favoritos_publicos: false, foto: null,
};

const GIRAS = [
  { id: "g1", nome: "Gira de sexta", publico: true, de: "Pai João", pontos: 12 },
  { id: "g2", nome: "Abertura", publico: true, de: "Mãe Ana", pontos: 1 },
];

async function abrir(giras: unknown = GIRAS, logado = true) {
  const chamadas: string[] = [];
  const rede = fingirRede((url, init) => {
    // O CORPO vai junto: sem ele, "guardou alguma coisa" e "guardou a certa"
    // eram a mesma asserção — e a mutação que guardava sempre a primeira
    // playlist sobrevivia.
    chamadas.push(`${init?.method ?? "GET"} ${url} ${init?.body ?? ""}`);
    if (url.includes("/auth/eu")) {
      return logado ? { corpo: EU } : { status: 401, corpo: {} };
    }
    if (url.includes("/eu/biblioteca")) {
      return (init?.method ?? "GET") === "GET" ? { corpo: [] } : { status: 201, corpo: {} };
    }
    if (url.includes("/repertorios/publicos")) return { corpo: giras };
    return { corpo: {} };
  });
  const tela = await renderizar(
    <Router hook={memoryLocation({ path: "/" }).hook}>
      <AuthProvider>
        <PlaylistsEmDestaque />
      </AuthProvider>
    </Router>,
  );
  await assentar();
  return {
    tela, chamadas,
    limpar: async () => { await tela.desmontar(); rede.restaurar(); },
  };
}

test("mostra as playlists da comunidade e leva a cada uma", async () => {
  const { tela, limpar } = await abrir();
  try {
    match(tela.texto(), /Gira de sexta/);
    match(tela.texto(), /de Pai João/);
    const links = tela.todos("a").map((a) => a.getAttribute("href"));
    ok(links.includes("/gira/g1"), `sem link para a playlist: ${links}`);
    ok(links.includes("/giras-publicas"), "sem caminho para ver o resto");
  } finally {
    await limpar();
  }
});

test("dá para GUARDAR daqui — achar e guardar no mesmo lugar", async () => {
  const { tela, chamadas, limpar } = await abrir();
  try {
    const guardar = tela
      .todos("button")
      .filter((b) => /Guardar/.test(b.textContent ?? ""));
    deepEqual(guardar.length, 2, "um botão de guardar por playlist");
    // A SEGUNDA: clicar na primeira daria o mesmo resultado que guardar sempre
    // a primeira, e o teste não separaria as duas coisas.
    await tela.clicar(guardar[1]);
    await assentar();
    const guardou = chamadas.find((c) => c.startsWith("PUT") && c.includes("/eu/biblioteca"));
    ok(guardou, `não guardou na biblioteca: ${chamadas.join(" | ")}`);
    ok(
      guardou!.includes('"alvoId":"g2"'),
      `guardou a playlist errada: ${guardou}`,
    );
  } finally {
    await limpar();
  }
});

test("o singular não vira '1 pontos'", async () => {
  const { tela, limpar } = await abrir();
  try {
    match(tela.texto(), /1 ponto\b|1 pontoAbertura/);
    ok(!/1 pontos/.test(tela.texto()), "escreveu '1 pontos'");
  } finally {
    await limpar();
  }
});

test("sem playlist nenhuma, a seção SOME em vez de ocupar espaço", async () => {
  // A tela inicial é um índice, e o que a maioria vem buscar é o orixá. Uma
  // seção vazia com "nenhuma playlist ainda" empurraria isso para baixo sem
  // dar nada em troca.
  const { tela, limpar } = await abrir([]);
  try {
    ok(tela.naoTem("section"), "a seção vazia continuou ocupando a tela");
  } finally {
    await limpar();
  }
});

test("erro ao carregar não derruba a tela inicial", async () => {
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) return { corpo: EU };
    if (url.includes("/repertorios/publicos")) {
      return { status: 503, corpo: { detail: "fora do ar" } };
    }
    return { corpo: {} };
  });
  const tela = await renderizar(
    <Router hook={memoryLocation({ path: "/" }).hook}>
      <AuthProvider>
        <PlaylistsEmDestaque />
      </AuthProvider>
    </Router>,
  );
  await assentar();
  try {
    ok(tela.naoTem("section"), "o erro virou seção vermelha na tela inicial");
    ok(!/fora do ar/.test(tela.texto()), "vazou a mensagem de erro");
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});
