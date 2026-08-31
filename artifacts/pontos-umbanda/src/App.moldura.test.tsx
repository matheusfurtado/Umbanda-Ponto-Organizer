/**
 * A moldura do app — e a faixa que ela precisa carregar.
 *
 * `AvisoAcervo` vivia pendurada no `AppInner`, que serve só a rota catch-all e
 * `/buscar`. As telas que MUTAM o acervo são outras, e a que dói é
 * `/favoritos`: está nas duas barras, qualquer pessoa chega nela, e cada
 * estrela chama `persistir` e entra na mesma fila de envio.
 *
 * Com a fila em conflito, `agendar()` desiste de reagendar — cada estrela
 * acendia na tela sem nunca subir, sem uma palavra, enquanto a decisão
 * ("Manter o deste aparelho" / "Ficar com o do outro") só existia na outra
 * rota. Este teste prende o que conserta isso: a faixa mora na MOLDURA, então
 * vale para toda rota que o app desenha dentro dela.
 */

import { match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar } from "../testes/renderizar.ts";
import { fingirRede } from "../testes/rede.ts";
import { Moldura } from "@/App";
import { AppProvider } from "@/context";
import { AuthProvider } from "@/auth/AuthContext";
import { EntitlementsProvider } from "@/billing/EntitlementsContext";
import type { AppData } from "@/types";

beforeEach(() => localStorage.clear());

const EU = {
  id: "u1", email: "m@e.com", email_verificado: true,
  apelido: "m", admin: false, foto: null, favoritos_publicos: false,
};

const ACERVO: AppData = {
  orixas: [{ id: "ogum", nome: "Ogum", cor: "#c00", emoji: "⚔️", ordem: 0 }] as AppData["orixas"],
  subcategorias: [{ id: "s1", orixaId: "ogum", nome: "Chegada", ordem: 0, criadoEm: 0 }],
  pontos: [{
    id: "p1", subcategoriaId: "s1", orixaId: "ogum", titulo: "Ogum de Lei",
    letra: "l", favorito: false, ordem: 0, criadoEm: 0,
  }],
};

/** Qualquer tela do app. O que se mede é a moldura em volta dela. */
const CONTEUDO = "a tela de favoritos";

async function montar(caminho: string, semRede = false) {
  localStorage.setItem("pontos-umbanda-data", JSON.stringify(ACERVO));
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) return { corpo: EU };
    if (url.includes("/meus-direitos")) return { corpo: { plano: "gratis", repertorios: false } };
    if (url.includes("/acervo")) {
      if (semRede) throw new TypeError("Failed to fetch");
      return { corpo: { ...ACERVO, acesso: { acervoOrganizado: true }, versao: "v1" } };
    }
    throw new Error(`chamada não prevista: ${url}`);
  });
  const tela = await renderizar(
    <Router hook={memoryLocation({ path: caminho }).hook}>
      <AuthProvider>
        <EntitlementsProvider>
          <AppProvider>
            <Moldura><p>{CONTEUDO}</p></Moldura>
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

test("a faixa de sincronização vem com a moldura — em /favoritos também", async () => {
  // `/favoritos` é o caso que dói: está nas duas barras e cada estrela entra
  // na fila de envio. Sem a faixa, um conflito parado ficava mudo justamente
  // onde a pessoa está mexendo no acervo.
  const { tela, limpar } = await montar("/favoritos", true);
  try {
    match(tela.texto(), /a tela de favoritos/, "a moldura não desenhou o conteúdo");
    match(
      tela.texto(),
      /Mostrando os pontos guardados/,
      "a faixa de sincronização não existe nesta rota",
    );
  } finally {
    await limpar();
  }
});

test("e em /organizar, a única rota cujo trabalho inteiro é mudar o acervo", async () => {
  const { tela, limpar } = await montar("/organizar", true);
  try {
    match(tela.texto(), /Mostrando os pontos guardados/);
  } finally {
    await limpar();
  }
});

test("com tudo certo, a moldura não acrescenta faixa nenhuma", async () => {
  // A faixa em toda rota só é aceitável porque ela some quando não há o que
  // dizer. Se aparecesse sempre, teria virado ruído em vez de aviso.
  const { tela, limpar } = await montar("/favoritos");
  try {
    ok(
      !/Mostrando os pontos guardados|ainda não enviadas|mudaram em outro aparelho/.test(tela.texto()),
      `a moldura passou a mostrar faixa sem motivo: ${tela.texto()}`,
    );
  } finally {
    await limpar();
  }
});
