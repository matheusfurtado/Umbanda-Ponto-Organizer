/**
 * A gira aberta por link — a tela por onde o app circula.
 *
 * Ela abre **sem conta**, e é por isso que existe: o canal deste produto é o
 * link colado no grupo do terreiro. Mas abrir sem conta não desliga o portão
 * do ADR 0002: a letra e a sequência vão, o link do vídeo só vai para quem
 * paga — quem decide isso é o servidor, e o que se prende aqui é que a tela
 * não inventa o link quando ele não vem.
 */

import { deepEqual, equal, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { act } from "react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaGiraPublica } from "@/pages/TelaGiraPublica";
import { AuthProvider } from "@/auth/AuthContext";

beforeEach(() => localStorage.clear());

const EU = {
  id: "u1", email: "m@e.com", email_verificado: true,
  apelido: "quem-olha", admin: false, favoritos_publicos: false, foto: null,
};

function item(pontoId: string, titulo: string | null, extra: Record<string, unknown> = {}) {
  return {
    pontoId, titulo, ordem: 0, secao: null, autor: null,
    videoUrl: null, videoStatus: null, videoCanal: null, videoDuracaoSeg: null,
    ...extra,
  };
}

const GIRA = {
  id: "g1", nome: "Gira de sexta", publico: true, de: "Terreiro de Ogum",
  itens: [
    item("p1", "Ogum de Lei"),
    item("p2", "Ponto de Oxum", { secao: "Louvação", videoDuracaoSeg: 4761 }),
  ],
};

function servidor(
  giras: Record<string, { status?: number; corpo?: unknown }>,
  logado = false,
  segurar?: { id: string; soltar: () => void },
) {
  const rede = fingirRede(async (url) => {
    if (url.includes("/auth/eu")) return logado ? { corpo: EU } : { status: 401, corpo: {} };
    const m = url.match(/\/repertorios\/publicos\/([^/?]+)/);
    if (m) {
      // Segura a resposta desta gira até o teste soltar. É o que torna
      // observável a janela em que a tela ainda não tem a nova — sem isso,
      // tudo chega dentro do mesmo `assentar` e o defeito não aparece.
      if (segurar && m[1] === segurar.id) {
        await new Promise<void>((resolver) => {
          segurar.soltar = resolver;
        });
      }
      return giras[m[1]] ?? { status: 404, corpo: { detail: "não existe" } };
    }
    throw new Error(`chamada não prevista: ${url}`);
  });
  return { rede };
}

async function abrir(
  id = "g1",
  giras: Record<string, { status?: number; corpo?: unknown }> = { g1: { corpo: GIRA } },
  logado = false,
  segurar?: { id: string; soltar: () => void },
) {
  const s = servidor(giras, logado, segurar);
  const { hook, navigate } = memoryLocation({ path: `/gira/${id}`, record: true });
  const tela = await renderizar(
    <Router hook={hook}>
      <AuthProvider>
        <TelaGiraPublica />
      </AuthProvider>
    </Router>,
  );
  await assentar();
  return {
    tela,
    navigate,
    // O clique no vídeo sai por `navigator.sendBeacon`, não por `fetch` — o
    // dublê registra os dois no MESMO `chamadas`, e é lá que se confere.
    chamadas: s.rede.chamadas,
    limpar: async () => {
      await tela.desmontar();
      s.rede.restaurar();
      localStorage.clear();
    },
  };
}

/** Os títulos das linhas da gira, na ordem em que aparecem. */
const titulos = (tela: Tela) =>
  tela.todos("span.truncate.text-sm").map((s) => s.textContent?.trim());

test("abre sem conta — é assim que o app circula", async () => {
  const { tela, limpar } = await abrir();
  try {
    match(tela.texto(), /Gira de sexta/);
    match(tela.texto(), /Terreiro de Ogum/);
    match(tela.texto(), /2 pontos/);
  } finally {
    await limpar();
  }
});

test("sem plano, o link do vídeo simplesmente não existe na tela", async () => {
  // O portão é do servidor (ADR 0002): ele não manda `videoUrl` para quem não
  // paga. O que se cobra aqui é que a tela NÃO invente o link a partir de
  // outra coisa — nem um botão morto, nem um endereço montado do id.
  const { tela, limpar } = await abrir();
  try {
    equal(tela.todos("a[href*='youtu']").length, 0, "apareceu link de vídeo sem plano");
    // E a gira continua útil: a sequência é o que a pessoa veio ver.
    deepEqual(titulos(tela), ["Ogum de Lei", "Ponto de Oxum"]);
  } finally {
    await limpar();
  }
});

test("com plano, o link vem do servidor e o clique é contado", async () => {
  const comVideo = {
    ...GIRA,
    itens: [item("p1", "Ogum de Lei", { videoUrl: "https://youtu.be/x", videoStatus: "encontrado" })],
  };
  const { tela, chamadas, limpar } = await abrir("g1", { g1: { corpo: comVideo } }, true);
  try {
    const link = tela.todos("a").find((a) => a.getAttribute("href") === "https://youtu.be/x");
    ok(link, "o link não apareceu para quem tem plano");
    await tela.clicar(link);
    await assentar();
    const cliques = chamadas.filter((c) => c.url.includes("/clique"));
    equal(cliques.length, 1, `o clique na gira não foi contado: ${JSON.stringify(chamadas)}`);
    match(cliques[0].url, /origem=gira/);
  } finally {
    await limpar();
  }
});

test("ponto que saiu do acervo é dito, e não vira linha em branco", async () => {
  // Uma gira publicada guarda ids; o ponto pode ter sido retirado depois.
  const comBuraco = { ...GIRA, itens: [item("p9", null)] };
  const { tela, limpar } = await abrir("g1", { g1: { corpo: comBuraco } });
  try {
    match(tela.texto(), /ponto removido do acervo/);
  } finally {
    await limpar();
  }
});

test("a duração de mais de uma hora não vira '79:21'", async () => {
  const { tela, limpar } = await abrir();
  try {
    match(tela.texto(), /1:19:21/);
  } finally {
    await limpar();
  }
});

test("denunciar só aparece para quem tem conta", async () => {
  // "Denúncia anônima não tem como ser contida."
  const anonima = await abrir();
  try {
    ok(!/Denunciar/.test(anonima.tela.texto()), "ofereceu denúncia a quem não tem conta");
  } finally {
    await anonima.limpar();
  }

  const logada = await abrir("g1", { g1: { corpo: GIRA } }, true);
  try {
    match(logada.tela.texto(), /Denunciar/);
  } finally {
    await logada.limpar();
  }
});

test("gira que não existe explica e oferece a vitrine", async () => {
  const { tela, limpar } = await abrir("fantasma", {});
  try {
    match(tela.texto(), /não existe/i);
    ok(tela.todos("a").some((a) => a.getAttribute("href") === "/giras-publicas"));
  } finally {
    await limpar();
  }
});

test("trocar de gira não deixa a anterior na tela", async () => {
  // O `Route path="/gira/:id"` não remonta quando só o parâmetro muda — é o
  // mesmo desenho do `TelaArtista`. Sem zerar, a gira anterior fica visível
  // sob a URL da nova.
  const outra = { ...GIRA, id: "g2", nome: "Festa de Exu", de: "Casa da Mata" };
  const { tela, navigate, limpar } = await abrir("g1", {
    g1: { corpo: GIRA },
    g2: { corpo: outra },
  });
  try {
    match(tela.texto(), /Gira de sexta/);
    await act(async () => {
      navigate("/gira/g2");
    });
    await assentar();
    match(tela.texto(), /Festa de Exu/);
    ok(!tela.texto().includes("Gira de sexta"), "a gira anterior sobreviveu à troca");
  } finally {
    await limpar();
  }
});


test("enquanto a nova não chega, a gira ANTERIOR sai da tela", async () => {
  // A mutação mostrou que o teste de troca acima não distinguia nada: sem
  // segurar a resposta, a gira nova chega no mesmo `assentar` e a janela do
  // defeito nunca existe. Aqui a segunda resposta fica presa, e o que se vê é
  // exatamente o que a pessoa veria.
  const outra = { ...GIRA, id: "g2", nome: "Festa de Exu" };
  const freio = { id: "g2", soltar: () => {} };
  const { tela, navigate, limpar } = await abrir(
    "g1", { g1: { corpo: GIRA }, g2: { corpo: outra } }, false, freio,
  );
  try {
    match(tela.texto(), /Gira de sexta/);
    await act(async () => {
      navigate("/gira/g2");
    });
    await assentar();

    ok(
      !tela.texto().includes("Gira de sexta"),
      "a gira anterior ficou na tela sob a URL da nova — quem compartilhou o " +
        "link de uma vê a outra",
    );
    ok(tela.achar('[aria-busy="true"]'), "não mostrou que está carregando");

    await act(async () => {
      freio.soltar();
      await new Promise((r) => setTimeout(r, 0));
    });
    match(tela.texto(), /Festa de Exu/);
  } finally {
    await limpar();
  }
});

test("a resposta atrasada da primeira gira não escreve na tela da segunda", async () => {
  const outra = { ...GIRA, id: "g2", nome: "Festa de Exu" };
  const freio = { id: "g1", soltar: () => {} };
  const { tela, navigate, limpar } = await abrir(
    "g1", { g1: { corpo: GIRA }, g2: { corpo: outra } }, false, freio,
  );
  try {
    // A primeira ainda está presa; troca para a segunda, que chega logo.
    await act(async () => {
      navigate("/gira/g2");
    });
    await assentar();
    match(tela.texto(), /Festa de Exu/);

    // AGORA a primeira responde, atrasada.
    await act(async () => {
      freio.soltar();
      await new Promise((r) => setTimeout(r, 0));
    });
    match(tela.texto(), /Festa de Exu/, "a resposta velha venceu a nova");
    ok(!tela.texto().includes("Gira de sexta"), "a gira antiga apareceu sob a URL da nova");
  } finally {
    await limpar();
  }
});
