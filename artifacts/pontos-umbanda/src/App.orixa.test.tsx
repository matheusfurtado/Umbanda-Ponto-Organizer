/**
 * O orixá que a tela inicial lista tem de ABRIR.
 *
 * *"por que no início as playlist tão vazias? só aparece voltar ao início"*
 * (02/09). A tela inicial passou a listar os orixás do CATÁLOGO (ids canônicos,
 * "ogum") e a rota `/orixa/:id` continuou procurando no ACERVO da pessoa, cujos
 * ids são prefixados ("276b070d:ogum"). Nunca achava.
 *
 * Regressão do mesmo dia, e de um tipo específico: trocar a fonte da LISTA e
 * esquecer a fonte do DESTINO. É o que esta cerca prende — as duas têm de vir
 * do mesmo lugar, e o caso monta justamente o descasamento.
 */

import { match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar } from "../testes/renderizar.ts";
import { fingirRede } from "../testes/rede.ts";
import { OrixaPorId } from "@/App";
import { AppProvider } from "@/context";
import { AuthProvider } from "@/auth/AuthContext";
import { EntitlementsProvider } from "@/billing/EntitlementsContext";
import type { AppData } from "@/types";

beforeEach(() => localStorage.clear());

const EU = {
  id: "u1", email: "m@e.com", email_verificado: true,
  apelido: "maria", admin: false, favoritos_publicos: false, foto: null,
};

const orixa = (id: string) => ({ id, nome: "Ogum", cor: "#c00", emoji: "⚔️", ordem: 0 });
const ponto = (id: string, sub: string) => ({
  id, subcategoriaId: sub, orixaId: "ogum", titulo: "Ogum de Lei", letra: "l",
  favorito: false, ordem: 0, criadoEm: 0,
});

/** O acervo DELE: ids prefixados, como fica quem organizou. */
const MEU: AppData = {
  orixas: [orixa("276b070d:ogum")] as AppData["orixas"],
  subcategorias: [],
  pontos: [ponto("276b070d:p1", "276b070d:s1")],
};
/** O CATÁLOGO: ids canônicos, que é o que a tela inicial lista. */
const CATALOGO: AppData = {
  orixas: [orixa("ogum")] as AppData["orixas"],
  subcategorias: [],
  pontos: [ponto("p1", "s1")],
};

async function abrir(id: string) {
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
    <Router hook={memoryLocation({ path: `/orixa/${id}` }).hook}>
      <AuthProvider>
        <EntitlementsProvider>
          <AppProvider>
            <OrixaPorId id={id} />
          </AppProvider>
        </EntitlementsProvider>
      </AuthProvider>
    </Router>,
  );
  await assentar();
  return { tela, limpar: async () => { await tela.desmontar(); rede.restaurar(); } };
}

test("o id CANÔNICO da tela inicial abre o orixá", async () => {
  // O caso do descasamento: o id que a home dá é "ogum", e o acervo dele tem
  // "276b070d:ogum". Procurar no acervo devolve o "não achei".
  const { tela, limpar } = await abrir("ogum");
  try {
    ok(
      !/Não achei essa entidade/.test(tela.texto()),
      "o orixá listado na tela inicial não abre — é o 'só aparece voltar ao início'",
    );
    match(tela.texto(), /Ogum/);
  } finally {
    await limpar();
  }
});

test("id que não existe em lugar nenhum ainda diz isso, com saída", async () => {
  // A guarda de completude: sem ela, o teste de cima passaria com um componente
  // que nunca mostra o "não achei" — inclusive quando ele deveria.
  const { tela, limpar } = await abrir("nao-existe");
  try {
    match(tela.texto(), /Não achei essa entidade/);
    ok(
      tela.todos("a").some((a) => a.getAttribute("href") === "/"),
      "deixou a pessoa sem caminho de volta",
    );
  } finally {
    await limpar();
  }
});
