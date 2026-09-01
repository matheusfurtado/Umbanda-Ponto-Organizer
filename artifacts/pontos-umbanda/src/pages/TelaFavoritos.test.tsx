/**
 * Curtidas — a lista do que eu curti, não do que está no meu acervo.
 *
 * A curtida saiu da linha do ponto no ADR 0009 (etapa 3): é uma linha ligando
 * pessoa e ponto canônico. Lendo o acervo pessoal, uma curtida sumia da tela no
 * dia em que a pessoa tirasse o ponto do acervo dela — a tela mostrava menos do
 * que o banco guardava, sem avisar.
 */

import { match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaFavoritos } from "@/pages/TelaFavoritos";
import { AppProvider } from "@/context";
import { AuthProvider } from "@/auth/AuthContext";
import { EntitlementsProvider } from "@/billing/EntitlementsContext";
import type { AppData } from "@/types";

beforeEach(() => localStorage.clear());

const EU = {
  id: "u1", email: "m@e.com", email_verificado: true,
  apelido: "maria", admin: false, favoritos_publicos: false, foto: null,
};

const ponto = (id: string, titulo: string, favorito: boolean) => ({
  id, subcategoriaId: "s1", orixaId: "ogum", titulo, letra: "l",
  favorito, ordem: 0, criadoEm: 0,
});

const ORIXAS = [{ id: "ogum", nome: "Ogum", cor: "#c00", emoji: "⚔️", ordem: 0 }];

/** O acervo DELE: já tirou o ponto curtido de lá. */
const MEU: AppData = {
  orixas: ORIXAS as AppData["orixas"], subcategorias: [],
  pontos: [ponto("a", "Ficou no acervo", false)],
};
/** O CATÁLOGO: tem o curtido, e ele continua curtido. */
const CATALOGO: AppData = {
  orixas: ORIXAS as AppData["orixas"], subcategorias: [],
  pontos: [ponto("a", "Ficou no acervo", false), ponto("b", "Curtido e fora do acervo", true)],
};

test("a curtida aparece mesmo se o ponto não está no meu acervo", async () => {
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) return { corpo: EU };
    if (url.includes("/meus-direitos")) {
      return { corpo: { plano: "pago", repertorios: true } };
    }
    if (url.includes("/catalogo")) return { corpo: CATALOGO };
    if (url.includes("/acervo")) {
      return { corpo: { ...MEU, acesso: { acervoOrganizado: true }, versao: "v1" } };
    }
    return { corpo: {} };
  });
  localStorage.setItem("pontos-umbanda-data", JSON.stringify(MEU));
  const tela = await renderizar(
    <Router hook={memoryLocation({ path: "/favoritos" }).hook}>
      <AuthProvider>
        <EntitlementsProvider>
          <AppProvider>
            <TelaFavoritos />
          </AppProvider>
        </EntitlementsProvider>
      </AuthProvider>
    </Router>,
  );
  await assentar();
  try {
    match(
      tela.texto(),
      /Curtido e fora do acervo/,
      "a curtida sumiu porque o ponto não está no acervo dele",
    );
    ok(
      !/Ficou no acervo/.test(tela.texto()),
      "listou ponto não curtido — a tela deixou de filtrar",
    );
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});
