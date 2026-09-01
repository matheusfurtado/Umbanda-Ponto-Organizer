/**
 * "Pontos sem vídeo" — o pedido de ajuda.
 *
 * Recusar um casamento marca o ponto como `nao_encontrado`: a letra fica, o link
 * some, e até 02/09 esse ponto sumia de vista. Agora tem endereço, separado por
 * orixá, com o convite para quem conhece o vídeo apontar.
 */

import { deepEqual, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaSemVideo } from "@/pages/TelaSemVideo";
import { AuthProvider } from "@/auth/AuthContext";

beforeEach(() => localStorage.clear());

const EU = {
  id: "u1", email: "m@e.com", email_verificado: true,
  apelido: "maria", admin: false, favoritos_publicos: false, foto: null,
};

const GRUPOS = [
  {
    orixa: "Exu",
    pontos: [
      {
        id: "p1", titulo: "Ponto de Tranca Ruas", letra: "Seu Tranca Ruas é o dono da gira",
        orixa: "Exu", subcategoria: "Abertura", indicacoes: 0,
      },
    ],
  },
  {
    orixa: "Oxóssi",
    // DOIS no mesmo orixá de propósito. Com um por grupo, mandar o link do
    // primeiro do grupo dá o mesmo resultado que mandar o do ponto certo — a
    // mutação sobrevivia, e o teste não media a ligação entre o campo e a linha.
    pontos: [
      {
        id: "p2", titulo: "Ponto de Caboclo", letra: "Na mata está o seu reino",
        orixa: "Oxóssi", subcategoria: "Caboclo", indicacoes: 2,
      },
      {
        id: "p3", titulo: "Ponto de Jurema", letra: "A jurema sagrada floresceu",
        orixa: "Oxóssi", subcategoria: "Caboclo", indicacoes: 0,
      },
    ],
  },
];

async function abrir(logado: boolean, grupos: unknown = GRUPOS) {
  const enviados: { url: string; corpo: unknown }[] = [];
  const rede = fingirRede((url, init) => {
    if (url.includes("/auth/eu")) {
      return logado ? { corpo: EU } : { status: 401, corpo: {} };
    }
    if (url.includes("/indicar-video")) {
      enviados.push({ url, corpo: JSON.parse(String(init?.body ?? "{}")) });
      return {
        status: 201,
        corpo: { videoId: "abcdefghijk", recado: "Obrigado! A moderação confere." },
      };
    }
    if (url.includes("/pontos-sem-video")) return { corpo: grupos };
    return { corpo: {} };
  });
  const tela = await renderizar(
    <Router hook={memoryLocation({ path: "/sem-video" }).hook}>
      <AuthProvider>
        <TelaSemVideo />
      </AuthProvider>
    </Router>,
  );
  await assentar();
  return {
    tela, enviados,
    limpar: async () => { await tela.desmontar(); rede.restaurar(); },
  };
}

const grupos = (tela: Tela) => tela.todos("h2").map((h) => h.textContent?.trim());

test("vem separado por orixá, com a letra inteira", async () => {
  // É a letra que faz alguém reconhecer o ponto e lembrar de onde ouviu. Um
  // título solto não desperta memória de ninguém — e é memória que esta página
  // está pedindo emprestado.
  const { tela, limpar } = await abrir(true);
  try {
    deepEqual(grupos(tela), ["Exu · 1", "Oxóssi · 2"]);
    match(tela.texto(), /Seu Tranca Ruas é o dono da gira/);
    match(tela.texto(), /Na mata está o seu reino/);
  } finally {
    await limpar();
  }
});

test("quem não entrou lê a lista e NÃO vê o formulário", async () => {
  // A lista é pública porque a letra é grátis e porque é pedindo ajuda que se
  // recebe ajuda. Indicar exige conta: não é para cobrar, é para haver alguém
  // do outro lado quando a indicação estiver errada.
  const { tela, limpar } = await abrir(false);
  try {
    match(tela.texto(), /Ponto de Tranca Ruas/);
    ok(tela.naoTem("input[type=url]"), "ofereceu o formulário a quem não entrou");
    ok(
      tela.todos("a").some((a) => a.getAttribute("href") === "/login"),
      "não disse como entrar para poder ajudar",
    );
  } finally {
    await limpar();
  }
});

test("indicar manda o link daquele ponto, e agradece na linha dele", async () => {
  const { tela, enviados, limpar } = await abrir(true);
  try {
    const campos = tela.todos("input[type=url]");
    deepEqual(campos.length, 3, "um campo por ponto");
    // O SEGUNDO do grupo de Oxóssi: se a tela mandar o id do primeiro do grupo,
    // o link vai para o ponto errado — e é exatamente o que a mutação faz.
    await tela.mudar(campos[2], "https://youtu.be/abcdefghijk");
    const botao = tela
      .todos("button")
      .filter((b) => /Indicar/.test(b.textContent ?? ""))[2];
    await tela.clicar(botao);
    await assentar();

    deepEqual(enviados.length, 1);
    ok(enviados[0].url.includes("/pontos/p3/indicar-video"), enviados[0].url);
    deepEqual(enviados[0].corpo, { url: "https://youtu.be/abcdefghijk" });
    match(tela.texto(), /Obrigado! A moderação confere/);
  } finally {
    await limpar();
  }
});

test("o botão fica desligado sem link digitado", async () => {
  // Sem isto o clique manda string vazia e volta 422 — erro que a pessoa
  // recebe por não ter feito nada.
  const { tela, limpar } = await abrir(true);
  try {
    const botao = tela
      .todos("button")
      .filter((b) => /Indicar/.test(b.textContent ?? ""))[0] as HTMLButtonElement;
    ok(botao.disabled, "o botão estava clicável sem link");
  } finally {
    await limpar();
  }
});

test("diz quantas indicações já chegaram para o ponto", async () => {
  const { tela, limpar } = await abrir(true);
  try {
    match(tela.texto(), /2 indicações esperando conferência/);
  } finally {
    await limpar();
  }
});

test("sem nenhum ponto faltando, a página comemora em vez de ficar vazia", async () => {
  const { tela, limpar } = await abrir(true, []);
  try {
    match(tela.texto(), /Todo ponto do app tem vídeo agora/);
    ok(tela.naoTem('[aria-busy="true"]'), "ficou carregando sobre lista vazia");
  } finally {
    await limpar();
  }
});
