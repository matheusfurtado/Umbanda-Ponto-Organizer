/**
 * O ponto como cartão, na tela de organizar — a que arrasta e move.
 *
 * Esta é a tela do produto PAGO: hierarquia, reordenação, mover entre
 * subcategorias. A ordem litúrgica não é estética aqui, é requisito — e era
 * justamente ela que estava quebrada no "Mover para...", sem ninguém poder ver.
 */

import { deepEqual, equal, match, ok } from "node:assert/strict";
import { test } from "node:test";
import { DndContext } from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { assentar, renderizar } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { CardPonto } from "@/components/CardPonto";
import { AppProvider } from "@/context";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { AuthProvider } from "@/auth/AuthContext";
import type { AppData, Ponto } from "@/types";

/**
 * Um acervo pequeno com o problema dentro: três orixás, e as subcategorias de
 * cada um numeradas do zero. É exatamente a forma do acervo de verdade — no
 * banco há 12 orixás com `ordem = 0` e 11 com `ordem = 1`.
 *
 * **A lista vem FORA de ordem de propósito.** `dados.subcategorias` é um vetor
 * achatado, vindo do cache ou do servidor, e nada promete que ele chegue
 * ordenado. Uma fixture já ordenada deixava o desempate por `ordem` passar
 * despercebido: o `sort` do JS é estável, então a ordem de entrada segurava o
 * resultado sozinha e a mutação que apaga o desempate sobrevivia.
 */
const ACERVO: AppData = {
  orixas: [
    { id: "exu", nome: "Exu", cor: "#000", emoji: "🔱", ordem: 0 },
    { id: "ogum", nome: "Ogum", cor: "#c00", emoji: "⚔️", ordem: 1 },
    { id: "oxum", nome: "Oxum", cor: "#fc0", emoji: "💛", ordem: 2 },
  ] as AppData["orixas"],
  subcategorias: [
    { id: "oxum-1", orixaId: "oxum", nome: "Louvação", ordem: 1, criadoEm: 0 },
    { id: "ogum-1", orixaId: "ogum", nome: "Louvação", ordem: 1, criadoEm: 0 },
    { id: "exu-1", orixaId: "exu", nome: "Louvação", ordem: 1, criadoEm: 0 },
    { id: "oxum-0", orixaId: "oxum", nome: "Chegada", ordem: 0, criadoEm: 0 },
    { id: "ogum-0", orixaId: "ogum", nome: "Chegada", ordem: 0, criadoEm: 0 },
    { id: "exu-0", orixaId: "exu", nome: "Chegada", ordem: 0, criadoEm: 0 },
  ],
  pontos: [],
};

const PONTO: Ponto = {
  id: "p1",
  subcategoriaId: "exu-0",
  titulo: "Ponto de Exu",
  letra: "Seu Tranca-Ruas é o dono da gira",
  favorito: false,
  ordem: 1,
  criadoEm: 0,
};

/**
 * `logado` importa desde que favoritar virou coisa de conta: sem sessão a
 * estrela do cartão é um `<Link>` para o login, não um botão que marca.
 */
async function cartao(p: Ponto = PONTO, sortable = false, { logado = false } = {}) {
  localStorage.setItem("pontos-umbanda-data", JSON.stringify(ACERVO));
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) {
      return logado
        ? { corpo: {
            id: "u1", email: "m@e.com", email_verificado: true,
            apelido: "m", admin: false, foto: null, favoritos_publicos: false,
          } }
        : { status: 401, corpo: {} };
    }
    if (url.includes("/acervo")) return { corpo: { ...ACERVO, acesso: { acervoOrganizado: true } } };
    throw new Error(`chamada não prevista: ${url}`);
  });
  const tela = await renderizar(
    // O Router é dependência de verdade agora: sem sessão a estrela do card é
    // um `<Link>` para o login, e `Link` fora de Router assina o histórico do
    // navegador — que este DOM não expõe de propósito.
    <Router hook={memoryLocation({ path: "/" }).hook}>
    <AuthProvider>
      <AppProvider>
        <DndContext>
          <SortableContext items={[p.id]}>
            <CardPonto ponto={p} busca="" sortable={sortable} />
          </SortableContext>
        </DndContext>
      </AppProvider>
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

test('"Mover para..." lista os outros orixás na ordem da gira', async () => {
  // O DEFEITO. `ordem` é POR ORIXÁ, e ordenar só por ele embaralhava a lista:
  // saía "Ogum › Chegada, Oxum › Chegada, Ogum › Louvação, Oxum › Louvação".
  // No acervo de verdade são 43 entradas com o mesmo orixá aparecendo três ou
  // quatro vezes espalhado, e quem move procura o ORIXÁ primeiro.
  const { tela, limpar } = await cartao();
  try {
    await tela.clicar('button[aria-expanded]');
    await tela.clicar('button[title="Mover para outra subcategoria"]');
    await assentar();

    const outros = tela
      .todosNaPagina("button")
      .map((b) => b.textContent ?? "")
      .filter((texto) => /›/.test(texto));
    deepEqual(
      outros.map((t) => t.replace(/\s+/g, " ").trim()),
      [
        "⚔️ Ogum › Chegada",
        "⚔️ Ogum › Louvação",
        "💛 Oxum › Chegada",
        "💛 Oxum › Louvação",
      ],
      "a lista saiu embaralhada entre orixás",
    );
  } finally {
    await limpar();
  }
});

test('"Mover para..." separa o mesmo orixá dos outros', async () => {
  // As subcategorias irmãs vêm primeiro e sem o nome do orixá: é o destino
  // mais provável, e repetir "Exu" em cada linha seria ruído.
  const { tela, limpar } = await cartao();
  try {
    await tela.clicar('button[aria-expanded]');
    await tela.clicar('button[title="Mover para outra subcategoria"]');
    await assentar();
    match(tela.textoNaPagina(), /Exu/, "não disse de qual orixá é o bloco de cima");
    const irma = tela
      .todosNaPagina("button")
      .find((b) => b.textContent?.trim() === "Louvação");
    ok(irma, "a subcategoria irmã sumiu da lista");
  } finally {
    await limpar();
  }
});

test("o cartão anuncia que abre — nenhum controle contava isso", async () => {
  const { tela, limpar } = await cartao();
  try {
    const gatilho = tela.exigir("button[aria-expanded]");
    equal(gatilho.getAttribute("aria-expanded"), "false");
    ok(!tela.texto().includes("Tranca-Ruas"), "a letra já vinha aberta");
    await tela.clicar(gatilho);
    equal(tela.exigir("button[aria-expanded]").getAttribute("aria-expanded"), "true");
    match(tela.texto(), /Tranca-Ruas/);
  } finally {
    await limpar();
  }
});

test("a alça de arrastar tem nome — é ela que reordena o acervo", async () => {
  // Sem `aria-label` o leitor de tela anuncia só "botão". É o controle que
  // muda a ORDEM, que neste app é requisito funcional, não preferência.
  const { tela, limpar } = await cartao(PONTO, true);
  try {
    ok(
      tela.achar('button[aria-label="Reordenar Ponto de Exu"]'),
      `a alça está sem nome: ${tela.html().slice(0, 300)}`,
    );
  } finally {
    await limpar();
  }
});

test("sem `sortable` não há alça nenhuma para confundir", async () => {
  const { tela, limpar } = await cartao(PONTO, false);
  try {
    ok(tela.naoTem('button[aria-label^="Reordenar"]'));
  } finally {
    await limpar();
  }
});

test("favoritar da barra NÃO fecha a letra que a pessoa acabou de abrir", async () => {
  // Os quatro botões da barra chamavam `e.stopPropagation()` como se
  // estivessem dentro do gatilho. Não estão — a barra é IRMÃ do cabeçalho.
  // O `stopPropagation` saiu; o comportamento que ele alegava proteger fica
  // preso aqui, que é o que importa.
  const { tela, limpar } = await cartao(PONTO, false, { logado: true });
  try {
    await tela.clicar("button[aria-expanded]");
    const favoritar = tela.todos("button").find((b) => /Curtir/.test(b.textContent ?? ""));
    ok(favoritar, "não achei o botão de favoritar");
    await tela.clicar(favoritar);
    equal(
      tela.exigir("button[aria-expanded]").getAttribute("aria-expanded"),
      "true",
      "favoritar fechou a letra",
    );
  } finally {
    await limpar();
  }
});

test("todo botão do cartão é `type=button`", async () => {
  const { tela, limpar } = await cartao(PONTO, true);
  try {
    await tela.clicar("button[aria-expanded]");
    const semTipo = tela.todos("button").filter((b) => b.getAttribute("type") !== "button");
    equal(semTipo.length, 0, `sem type=button: ${semTipo.map((b) => b.textContent)}`);
  } finally {
    await limpar();
  }
});

test("o destaque da busca vale no título e na letra", async () => {
  localStorage.setItem("pontos-umbanda-data", JSON.stringify(ACERVO));
  const rede = fingirRede((url) =>
    url.includes("/acervo")
      ? { corpo: { ...ACERVO, acesso: { acervoOrganizado: true } } }
      : { status: 401, corpo: {} },
  );
  const tela = await renderizar(
    // O Router é dependência de verdade agora: sem sessão a estrela do card é
    // um `<Link>` para o login, e `Link` fora de Router assina o histórico do
    // navegador — que este DOM não expõe de propósito.
    <Router hook={memoryLocation({ path: "/" }).hook}>
    <AuthProvider>
      <AppProvider>
        <DndContext>
          <SortableContext items={[PONTO.id]}>
            <CardPonto ponto={PONTO} busca="exu" />
          </SortableContext>
        </DndContext>
      </AppProvider>
    </AuthProvider>
    </Router>,
  );
  await assentar();
  try {
    equal(tela.todos("mark").length, 1);
    await tela.clicar("button[aria-expanded]");
    equal(tela.todos("mark").length, 1, "a letra não tem 'exu', e mesmo assim marcou");
  } finally {
    await tela.desmontar();
    rede.restaurar();
    localStorage.clear();
  }
});

test("sem conta, a estrela do cartão leva ao login", async () => {
  const { tela, limpar } = await cartao();
  try {
    await tela.clicar("button[aria-expanded]");
    const estrela = tela.exigir('a[href="/login?motivo=favoritos"]');
    equal(estrela.getAttribute("aria-label"), "Entrar para curtir");
    match(estrela.textContent ?? "", /Curtir/);
  } finally {
    await limpar();
  }
});
