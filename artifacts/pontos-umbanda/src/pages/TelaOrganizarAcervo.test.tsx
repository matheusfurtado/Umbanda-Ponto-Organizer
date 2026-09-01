/**
 * O editor do acervo — e o teatro que ele era sem plano.
 *
 * Quem não paga recebe o acervo ACHATADO pelo portão: `subcategorias: []`,
 * `subcategoriaId` vazio. E `persistir` não enfileira envio para cópia reduzida,
 * de propósito — mandá-la de volta apagaria no servidor a organização que a
 * pessoa montou enquanto pagava.
 *
 * Então a tela oferecia a superfície de edição inteira sobre um acervo que ela
 * não pode mudar, e o diálogo de excluir mentia nas DUAS metades: "Ele está
 * vazio" (a cópia reduzida chega com 0 pontos) e "Isto não pode ser desfeito"
 * (o próximo `carregar()` desfaz sozinho).
 */

import { match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaOrganizarAcervo } from "@/pages/TelaOrganizarAcervo";
import { AppProvider } from "@/context";
import { AuthProvider } from "@/auth/AuthContext";
import { EntitlementsProvider } from "@/billing/EntitlementsContext";
import type { AppData } from "@/types";

beforeEach(() => localStorage.clear());

const EU = {
  id: "u1", email: "m@e.com", email_verificado: true,
  apelido: "m", admin: false, foto: null, favoritos_publicos: false,
};

const ORIXA = { id: "ogum", nome: "Ogum", cor: "#c00", emoji: "⚔️", ordem: 0 };

/** O acervo INTEIRO, de quem paga. */
const COMPLETO: AppData = {
  orixas: [ORIXA] as AppData["orixas"],
  subcategorias: [{ id: "s1", orixaId: "ogum", nome: "Chegada", ordem: 0, criadoEm: 0 }],
  pontos: [{
    id: "p1", subcategoriaId: "s1", titulo: "Ogum de Lei",
    letra: "l", favorito: false, ordem: 0, criadoEm: 0,
  }],
};

/** O que o portão manda para quem não paga: mesma lista, hierarquia zerada. */
const ACHATADO: AppData = {
  ...COMPLETO,
  subcategorias: [],
  pontos: COMPLETO.pontos.map((p) => ({ ...p, subcategoriaId: "", ordem: 0 })),
};

async function abrir({ organizado }: { organizado: boolean }) {
  const acervo = organizado ? COMPLETO : ACHATADO;
  localStorage.setItem("pontos-umbanda-data", JSON.stringify(acervo));
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) return { corpo: EU };
    if (url.includes("/meus-direitos")) {
      return { corpo: { plano: organizado ? "pago" : "gratis", repertorios: organizado } };
    }
    if (url.includes("/acervo")) {
      return { corpo: { ...acervo, acesso: { acervoOrganizado: organizado }, versao: "v1" } };
    }
    throw new Error(`chamada não prevista: ${url}`);
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
  return {
    tela,
    limpar: async () => {
      await tela.desmontar();
      rede.restaurar();
      localStorage.clear();
    },
  };
}

/** Os controles que MUDAM o acervo. Nenhum pode existir sobre cópia reduzida. */
const controlesDeEdicao = (tela: Tela) =>
  tela.todos("button").filter((b) => {
    const t = `${b.getAttribute("aria-label") ?? ""} ${b.getAttribute("title") ?? ""} ${b.textContent ?? ""}`;
    return /excluir|apagar|renomear|adicionar|novo|importar/i.test(t);
  });

test("sem plano, o editor NÃO abre — não há o que organizar", async () => {
  const { tela, limpar } = await abrir({ organizado: false });
  try {
    match(tela.texto(), /faz parte do plano/i);
    ok(
      controlesDeEdicao(tela).length === 0,
      `ofereceu edição sobre cópia reduzida: ${controlesDeEdicao(tela).map((b) => b.textContent)}`,
    );
  } finally {
    await limpar();
  }
});

test("sem plano, a tela diz que nada se perdeu — e é verdade", async () => {
  // É justamente porque o app NÃO manda a cópia reduzida de volta que a
  // organização de quem já pagou sobrevive na conta. A frase tira um medo real
  // e não é consolo inventado.
  const { tela, limpar } = await abrir({ organizado: false });
  try {
    match(tela.texto(), /nada\s*se perdeu/i);
    match(tela.texto(), /volta assim que o plano voltar/i);
    ok(tela.achar('a[href="/planos"]'), "disse que é do plano e não levou a ele");
  } finally {
    await limpar();
  }
});

test("sem plano, NENHUMA frase de exclusão aparece", async () => {
  // As duas metades eram falsas ao mesmo tempo: "Ele está vazio" escondia
  // dezenas de pontos que existem no servidor, e "não pode ser desfeito"
  // inventava uma permanência que o próximo `carregar()` desfaz.
  const { tela, limpar } = await abrir({ organizado: false });
  try {
    ok(!/está vazio/i.test(tela.texto()), "voltou a dizer que o orixá está vazio");
    ok(!/não pode ser desfeito/i.test(tela.texto()), "voltou a prometer permanência");
  } finally {
    await limpar();
  }
});

test("COM plano, o editor abre normalmente", async () => {
  // A outra metade da cerca: fechar demais tiraria a funcionalidade de quem
  // pagou por ela.
  const { tela, limpar } = await abrir({ organizado: true });
  try {
    ok(!/faz parte do plano/i.test(tela.texto()), "escondeu o editor de quem paga");
    match(tela.texto(), /Ogum/);
  } finally {
    await limpar();
  }
});
