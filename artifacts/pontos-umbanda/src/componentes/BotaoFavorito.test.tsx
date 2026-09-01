/**
 * A estrela — e para onde ela avisa que alguém curtiu.
 *
 * A curtida era coluna da linha do ponto, e a linha de um ponto curtido é a
 * CÓPIA pessoal (ADR 0005): ela só chegava ao servidor pelo `PUT /acervo`, o
 * retrato inteiro. Dois preços nisso — quem não paga recebe 402 no PUT e nunca
 * conseguia curtir, e quem paga só curtia depois de o app copiar o acervo
 * inteiro por ela. O ADR 0009 desfaz o laço com rota própria.
 */

import { ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { BotaoFavorito } from "@/componentes/BotaoFavorito";
import { AppProvider } from "@/context";
import { AuthProvider } from "@/auth/AuthContext";
import type { AppData } from "@/types";

beforeEach(() => localStorage.clear());

const EU = {
  id: "u1", email: "m@e.com", email_verificado: true,
  apelido: "maria", admin: false, favoritos_publicos: false, foto: null,
};

const ACERVO: AppData = {
  orixas: [],
  subcategorias: [],
  pontos: [{
    id: "p1", subcategoriaId: "s1", titulo: "Ogum de Lei", letra: "l",
    favorito: false, ordem: 0, criadoEm: 0,
  }],
};

async function abrir(logado = true) {
  const chamadas: string[] = [];
  const rede = fingirRede((url, init) => {
    chamadas.push(`${init?.method ?? "GET"} ${url}`);
    if (url.includes("/auth/eu")) {
      return logado ? { corpo: EU } : { status: 401, corpo: {} };
    }
    if (url.includes("/meus-direitos")) {
      return { corpo: { plano: "gratis", repertorios: false } };
    }
    if (url.includes("/acervo")) {
      return { corpo: { ...ACERVO, acesso: { acervoOrganizado: false }, versao: "v1" } };
    }
    return { status: 204 };
  });
  localStorage.setItem("pontos-umbanda-data", JSON.stringify(ACERVO));
  const tela = await renderizar(
    <Router hook={memoryLocation({ path: "/" }).hook}>
      <AuthProvider>
        <AppProvider>
          <BotaoFavorito id="p1" favorito={false} />
        </AppProvider>
      </AuthProvider>
    </Router>,
  );
  await assentar();
  return {
    tela, chamadas,
    limpar: async () => { await tela.desmontar(); rede.restaurar(); },
  };
}

test("curtir avisa o servidor pela rota própria, e não pelo PUT do acervo", async () => {
  const { tela, chamadas, limpar } = await abrir();
  try {
    await tela.clicar(tela.exigir("button"));
    await assentar();
    ok(
      chamadas.some((c) => c.startsWith("PUT") && c.includes("/pontos/p1/curtir")),
      `não avisou o servidor pela rota de curtir: ${chamadas.join(" | ")}`,
    );
  } finally {
    await limpar();
  }
});

test("descurtir chama a mesma rota com DELETE", async () => {
  const jaCurtido: AppData = {
    ...ACERVO,
    pontos: [{ ...ACERVO.pontos[0], favorito: true }],
  };
  const chamadas: string[] = [];
  const rede = fingirRede((url, init) => {
    chamadas.push(`${init?.method ?? "GET"} ${url}`);
    if (url.includes("/auth/eu")) return { corpo: EU };
    if (url.includes("/meus-direitos")) {
      return { corpo: { plano: "gratis", repertorios: false } };
    }
    if (url.includes("/acervo")) {
      // `jaCurtido`, e não `ACERVO`: o provider recarrega do servidor e
      // sobrescreve o `localStorage`. Com o acervo não-curtido aqui, o clique
      // virava PUT e o teste acusava a rota de DELETE — apontando para o
      // componente quando o errado era o servidor falso.
      return { corpo: { ...jaCurtido, acesso: {}, versao: "v1" } };
    }
    return { status: 204 };
  });
  localStorage.setItem("pontos-umbanda-data", JSON.stringify(jaCurtido));
  const tela = await renderizar(
    <Router hook={memoryLocation({ path: "/" }).hook}>
      <AuthProvider>
        <AppProvider>
          <BotaoFavorito id="p1" favorito />
        </AppProvider>
      </AuthProvider>
    </Router>,
  );
  await assentar();
  try {
    await tela.clicar(tela.exigir("button"));
    await assentar();
    ok(
      chamadas.some((c) => c.startsWith("DELETE") && c.includes("/pontos/p1/curtir")),
      `não descurtiu pela rota: ${chamadas.join(" | ")}`,
    );
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});

test("sem conta a estrela é um LINK para o login, e não chama rota nenhuma", async () => {
  // Curtir exige conta — curtida que morre no aparelho some na primeira troca
  // de celular, sem avisar.
  const { tela, chamadas, limpar } = await abrir(false);
  try {
    const link = tela.todos("a").find((a) =>
      (a.getAttribute("href") ?? "").startsWith("/login"));
    ok(link, "sem conta a estrela devia levar ao login");
    ok(
      !chamadas.some((c) => c.includes("/curtir")),
      `chamou a rota de curtir sem conta: ${chamadas.join(" | ")}`,
    );
  } finally {
    await limpar();
  }
});
