/**
 * "Meu acervo" — a estante, e o que ela deixou de ser.
 *
 * Esta tela era o EDITOR do acervo pessoal, sobre uma cópia do acervo inteiro.
 * Era isso que produzia o defeito que ele relatou: *"eu apaguei do organizar
 * acervo e no início não consigo acessar mais"* — a cópia não era uma seleção,
 * era a fonte de tudo que ele via.
 *
 * ADR 0009: a tela vira a estante, e nasce vazia.
 *
 * ## O que estes testes deixaram de afirmar
 *
 * Eles prendiam o PORTÃO do editor: "sem plano o editor não abre", "a tela diz
 * que nada se perdeu". Guardar não é recurso pago — é seguir, com outro alvo —,
 * e não há mais editor a bloquear. Manter aqueles casos seria prender um
 * comportamento que sumiu, que é a forma mais silenciosa de um teste virar
 * mentira.
 */

import { match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaOrganizarAcervo } from "@/pages/TelaOrganizarAcervo";
import { AppProvider } from "@/context";
import { AuthProvider } from "@/auth/AuthContext";
import { EntitlementsProvider } from "@/billing/EntitlementsContext";
import type { AppData } from "@/types";

beforeEach(() => localStorage.clear());

const EU = {
  id: "u1", email: "m@e.com", email_verificado: true,
  apelido: "maria", admin: false, favoritos_publicos: false, foto: null,
};

const ACERVO: AppData = {
  orixas: [{ id: "ogum", nome: "Ogum", cor: "#c00", emoji: "⚔️", ordem: 0 }] as AppData["orixas"],
  subcategorias: [],
  pontos: [{
    id: "p1", subcategoriaId: "s1", titulo: "Ogum de Lei", letra: "l",
    favorito: false, ordem: 0, criadoEm: 0,
  }],
};

async function abrir({ plano = "pago", guardados = [] as unknown[] } = {}) {
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) return { corpo: EU };
    if (url.includes("/meus-direitos")) {
      return { corpo: { plano, repertorios: plano === "pago" } };
    }
    if (url.includes("/eu/biblioteca")) return { corpo: guardados };
    if (url.includes("/catalogo")) return { corpo: ACERVO };
    if (url.includes("/acervo")) {
      return {
        corpo: {
          ...ACERVO,
          acesso: { acervoOrganizado: plano === "pago" },
          versao: "v1",
        },
      };
    }
    return { corpo: {} };
  });
  const tela = await renderizar(
    <Router hook={memoryLocation({ path: "/organizar" }).hook}>
      <AuthProvider>
        <EntitlementsProvider>
          <AppProvider>
            <TelaOrganizarAcervo />
          </AppProvider>
        </EntitlementsProvider>
      </AuthProvider>
    </Router>,
  );
  await assentar();
  return { tela, limpar: async () => { await tela.desmontar(); rede.restaurar(); } };
}

test("nasce vazia, e diz que nada entra sozinho", async () => {
  // É o pedido inteiro numa frase: "o organizar acervo tem que nascer vazio".
  const { tela, limpar } = await abrir();
  try {
    match(tela.texto(), /nada entra sozinho/i);
    match(tela.texto(), /está vazia — e é assim que ela começa/);
  } finally {
    await limpar();
  }
});

test("mostra o que foi guardado", async () => {
  const { tela, limpar } = await abrir({
    guardados: [
      { alvoTipo: "orixa", alvoId: "ogum", nome: "Ogum", pontos: 30, de: null, ordem: 0 },
    ],
  });
  try {
    match(tela.texto(), /Ogum/);
    match(tela.texto(), /30 pontos/);
  } finally {
    await limpar();
  }
});

test("NÃO oferece mais o editor do acervo", async () => {
  // A cópia do acervo inteiro deixou de ser a fonte do que a pessoa vê. Oferecer
  // "excluir orixá" aqui apagaria de uma cópia que ninguém lê — trabalho que
  // não muda nada, sobre conteúdo litúrgico.
  const { tela, limpar } = await abrir();
  try {
    const acoes = tela
      .todos("button")
      .map((b) => b.textContent ?? "")
      .filter((t) => /excluir|apagar|renomear|adicionar|novo orixá|importar/i.test(t));
    ok(acoes.length === 0, `a tela ainda oferece editar o acervo: ${acoes}`);
  } finally {
    await limpar();
  }
});

test("guardar não é recurso pago: sem plano a estante abre igual", async () => {
  // Guardar é seguir, com outro alvo — e seguir nunca foi pago. O que se cobra
  // continua sendo hierarquia, vídeo, gira e sync (ADR 0002).
  const { tela, limpar } = await abrir({ plano: "gratis" });
  try {
    ok(!/faz parte do plano/i.test(tela.texto()), "cobrou pela estante");
    match(tela.texto(), /está vazia/);
  } finally {
    await limpar();
  }
});
