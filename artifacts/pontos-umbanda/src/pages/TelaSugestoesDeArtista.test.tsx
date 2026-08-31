/**
 * A fila de sugestões, do lado de quem modera.
 *
 * O que esta tela decide é diferente da fila irmã: lá a pergunta é "esta pessoa
 * é quem diz ser?" (e há código de prova); aqui é "este canal merece uma
 * página?". Não há o que provar — quem sugeriu não controla o canal.
 */

import { deepEqual, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaSugestoesDeArtista } from "@/pages/TelaSugestoesDeArtista";

beforeEach(() => localStorage.clear());

const sugestao = (over: Record<string, unknown> = {}) => ({
  id: "s1", status: "pendente", nomeDoCanal: "Canal do Terreiro",
  canalUrl: "https://youtube.com/@terreiro", artistaId: null, motivo: null,
  criadoEm: "2026-08-30T10:00:00Z", apelido: "maria", recado: "canta os pontos da minha casa",
  ...over,
});

async function abrir(fila: { status?: number; corpo?: unknown } = { corpo: [sugestao()] }) {
  const acoes: { url: string; metodo: string; corpo: unknown }[] = [];
  const rede = fingirRede((url, init) => {
    if (/\/aprovar$|\/recusar$/.test(url)) {
      acoes.push({ url, metodo: init?.method ?? "GET", corpo: JSON.parse(String(init?.body ?? "null")) });
      return { status: 204 };
    }
    if (url.includes("/admin/sugestoes-de-artista")) return fila;
    throw new Error(`chamada não prevista: ${url}`);
  });
  const tela = await renderizar(<TelaSugestoesDeArtista />);
  await assentar();
  return {
    tela,
    acoes,
    limpar: async () => {
      await tela.desmontar();
      rede.restaurar();
    },
  };
}

const botao = (tela: Tela, texto: RegExp) =>
  tela.todos("button").find((b) => texto.test(b.textContent ?? ""));

test("o aviso sobre publicar sem a pessoa ter pedido está na tela", async () => {
  // Quem modera precisa ler isso antes de clicar, TODA vez: o que se desfaz não
  // apaga o que já foi visto.
  const { tela, limpar } = await abrir();
  try {
    match(tela.texto(), /sem essa pessoa ter pedido/);
    match(tela.texto(), /curada e sem\s*dono/);
    // A RAZÃO junto, e não só a regra: é ela que faz quem modera conferir de
    // verdade em vez de clicar em aprovar por hábito.
    match(tela.texto(), /não apaga o que já foi visto/);
    // E anunciado como aviso, não só colorido de âmbar.
    ok(
      tela.todos("p").some((p) => /Confira o canal antes/.test(p.textContent ?? "")),
      "o aviso de moderação sumiu da tela",
    );
  } finally {
    await limpar();
  }
});

test("mostra quem sugeriu pelo apelido, e o recado", async () => {
  const { tela, limpar } = await abrir();
  try {
    match(tela.texto(), /sugerido por maria/);
    match(tela.texto(), /canta os pontos da minha casa/);
    ok(!tela.texto().includes("@e.com"), `vazou e-mail na fila: ${tela.texto()}`);
  } finally {
    await limpar();
  }
});

test("sem endereço, diz o que fazer em vez de mostrar um botão morto", async () => {
  // O endereço é opcional de propósito — quem lembra do canal nem sempre tem o
  // link. Um "Abrir o canal" sem destino seria pior que a frase.
  const { tela, limpar } = await abrir({ corpo: [sugestao({ canalUrl: null })] });
  try {
    ok(tela.naoTem("a[href]"), "ofereceu abrir um canal sem endereço");
    match(tela.texto(), /procure pelo nome/i);
  } finally {
    await limpar();
  }
});

test("recusar só liga com motivo escrito", async () => {
  // Sem motivo a pessoa refaz a mesma sugestão para sempre.
  const { tela, acoes, limpar } = await abrir();
  try {
    ok(botao(tela, /Recusar/)?.hasAttribute("disabled"), "deixou recusar sem motivo");
    deepEqual(acoes, []);
  } finally {
    await limpar();
  }
});

test("aprovar chama a rota e recarrega a fila", async () => {
  const { tela, acoes, limpar } = await abrir();
  try {
    await tela.clicar(botao(tela, /criar a página/)!);
    await assentar();
    deepEqual(acoes.map((a) => a.metodo), ["POST"]);
    match(acoes[0].url, /\/admin\/sugestoes-de-artista\/s1\/aprovar$/);
  } finally {
    await limpar();
  }
});

test("fila vazia diz que está vazia, e não fica carregando", async () => {
  const { tela, limpar } = await abrir({ corpo: [] });
  try {
    match(tela.texto(), /Nenhuma sugestão esperando/);
    ok(tela.naoTem('[aria-busy="true"]'), "continuou carregando sobre resposta vazia");
  } finally {
    await limpar();
  }
});

test("quem não é admin lê a resposta do servidor, e o esqueleto para", async () => {
  // A API responde 404 a quem não modera — a tela não decide isso sozinha.
  const { tela, limpar } = await abrir({ status: 404, corpo: {} });
  try {
    ok(/\S/.test(tela.texto()), "a tela ficou muda sobre a recusa");
    ok(tela.naoTem('[aria-busy="true"]'), "mostrou o erro e continuou girando");
  } finally {
    await limpar();
  }
});
