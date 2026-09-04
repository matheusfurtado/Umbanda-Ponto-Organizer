/**
 * O pop-up do plano.
 *
 * Ele nasceu porque a propaganda anterior estava em dois lugares que quase
 * ninguém abre — *"eu não achei foi a propaganda do plano, queria tipo um
 * pop-up"*. O que se prende aqui é o outro lado disso: um pop-up que aparece
 * para quem já pagou, ou que promete o que o plano não entrega, é pior que
 * nenhum.
 */

import { match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar } from "../../testes/renderizar.ts";

// O diálogo do Radix é renderizado em PORTAL, direto no `document.body`. Tudo
// aqui usa as versões `NaPagina`: procurar dentro do container devolveria vazio
// sempre, e um teste que procura vazio e acha vazio passa afirmando "o pop-up
// não apareceu" enquanto ele está na tela, um nível acima.
import { fingirRede } from "../../testes/rede.ts";
import { PopUpDoPlano } from "@/componentes/PopUpDoPlano";
import { AuthProvider } from "@/auth/AuthContext";
import { EntitlementsProvider } from "@/billing/EntitlementsContext";
import { pedirPlano } from "@/billing/convite";

beforeEach(() => localStorage.clear());

const EU = {
  id: "u1", email: "m@e.com", email_verificado: true,
  apelido: "maria", admin: false, favoritos_publicos: false, foto: null,
};

const GRATIS = { plano: "gratis", repertorios: false, seguirArtistas: false };
const PAGO = {
  plano: "mensal", repertorios: true, seguirArtistas: true,
  acervoOrganizado: true, sync: true,
};

async function abrir(direitos: Record<string, unknown> = GRATIS) {
  const rede = fingirRede((url) => {
    if (url.includes("/meus-direitos")) return { corpo: direitos };
    if (url.includes("/auth/eu")) return { corpo: EU };
    throw new Error(`chamada não prevista: ${url}`);
  });
  const { hook } = memoryLocation({ path: "/" });
  const tela = await renderizar(
    <Router hook={hook}>
      <AuthProvider>
        <EntitlementsProvider>
          <PopUpDoPlano />
        </EntitlementsProvider>
      </AuthProvider>
    </Router>,
  );
  // Duas voltas: a sessão chega na primeira, os direitos só na segunda.
  await assentar();
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

test("não aparece sozinho: quem não pediu nada continua lendo", async () => {
  const { tela, limpar } = await abrir();
  try {
    ok(tela.todosNaPagina('[role="dialog"]').length === 0, "saltou na cara de quem só abriu o app");
  } finally {
    await limpar();
  }
});

test("aparece quando a pessoa TOCA em algo do plano", async () => {
  const { tela, limpar } = await abrir();
  try {
    pedirPlano("seguir-artista");
    await assentar();
    // A frase de topo nomeia o que ela acabou de tentar — convite genérico não
    // ajuda ninguém e é o que faz um pop-up ser lido como ruído.
    match(tela.textoNaPagina(), /Guardar os artistas que você ouve/);
    ok(tela.todosNaPagina("a").some((a) => a.getAttribute("href") === "/planos"),
       "o convite não leva a lugar nenhum");
    ok(/Agora não/.test(tela.textoNaPagina()), "não há saída visível");
  } finally {
    await limpar();
  }
});

test("QUEM JÁ PAGA nunca vê — nem tocando no gatilho", async () => {
  // O defeito mais comum deste tipo de faixa: ficar na tela de quem já comprou.
  const { tela, limpar } = await abrir(PAGO);
  try {
    pedirPlano("montar-playlist");
    await assentar();
    ok(tela.todosNaPagina('[role="dialog"]').length === 0, "vendeu o plano para quem assina");
  } finally {
    await limpar();
  }
});

test("não promete o que é de todo mundo", async () => {
  // A letra, o vídeo e o app funcionar sem sinal saíram do portão (ADR 0002).
  // A varredura `promessa-do-plano` já reprova isso no fonte; aqui o que se
  // confere é o contrário — que o RODAPÉ diz, na tela, o que segue aberto.
  const { tela, limpar } = await abrir();
  try {
    pedirPlano("sozinho");
    await assentar();
    match(tela.textoNaPagina(), /letras.*v[íi]deos.*acervo inteiro seguem abertos/i);
  } finally {
    await limpar();
  }
});

test("fechar no 'Agora não' tira o pop-up da tela", async () => {
  const { tela, limpar } = await abrir();
  try {
    pedirPlano("seguir-artista");
    await assentar();
    const nao = tela.todosNaPagina("button").find((b) => /Agora não/.test(b.textContent ?? ""));
    ok(nao, "não achei a saída");
    await tela.clicar(nao!);
    await assentar();
    ok(tela.todosNaPagina('[role="dialog"]').length === 0, "fechou e voltou");
  } finally {
    await limpar();
  }
});
