/**
 * O agrupamento da página do artista.
 *
 * Ele separa os pontos por entidade — como o Spotify separa por álbum — e a
 * escolha que importa está no COMO: por chave, e não varrendo corridas
 * contíguas.
 *
 * O servidor manda ordenado por orixá, então somar enquanto o vizinho for igual
 * funcionaria hoje e quebraria em silêncio no dia em que a ordenação mudasse,
 * espalhando o mesmo orixá em três blocos. Estes testes fixam isso.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  agruparPorEntidade,
  maisOuvidos,
  type PontoDoArtista,
} from "./artista.ts";

function ponto(
  id: string,
  orixaId: string | null,
  nome: string | null = orixaId,
  cliques = 0,
): PontoDoArtista {
  return {
    id,
    titulo: `ponto ${id}`,
    orixa: nome,
    orixaId,
    orixaEmoji: orixaId ? "🔥" : null,
    orixaCor: orixaId ? "#dc2626" : null,
    orixaTipo: "orixa",
    letra: `letra de ${id}`,
    cliques,
    videoUrl: null,
    videoStatus: null,
  };
}

test("junta os pontos da mesma entidade", () => {
  const grupos = agruparPorEntidade([
    ponto("a", "exu"),
    ponto("b", "exu"),
    ponto("c", "ogum"),
  ]);
  assert.equal(grupos.length, 2);
  assert.deepEqual(grupos.map((g) => g.id), ["exu", "ogum"]);
  assert.equal(grupos[0].pontos.length, 2);
});

test("junta mesmo com a ordenação embaralhada", () => {
  // É a razão de existir do `Map`. Com varredura de corrida contígua, "exu"
  // viraria DOIS blocos aqui — e ninguém notaria, porque a página continuaria
  // parecendo certa.
  const grupos = agruparPorEntidade([
    ponto("a", "exu"),
    ponto("b", "ogum"),
    ponto("c", "exu"),
  ]);
  assert.equal(grupos.length, 2, "o mesmo orixá foi partido em dois blocos");
  assert.equal(grupos[0].pontos.length, 2);
});

test("a ordem dos grupos é a da primeira aparição", () => {
  // O servidor ordena por `Orixa.ordem`, que é a sequência litúrgica. Reordenar
  // aqui — alfabeticamente, por contagem — desfaria isso sem dizer.
  const grupos = agruparPorEntidade([
    ponto("a", "iemanja"),
    ponto("b", "exu"),
    ponto("c", "ogum"),
  ]);
  assert.deepEqual(grupos.map((g) => g.id), ["iemanja", "exu", "ogum"]);
});

test("ponto sem entidade não some, e vai para o fim", () => {
  // Engolir o que não se encaixa é como buraco de dado fica invisível: 47 dos
  // 520 pontos já abrem com a letra em branco, e ninguém sabia.
  const grupos = agruparPorEntidade([
    ponto("orfao", null),
    ponto("a", "exu"),
  ]);
  assert.equal(grupos.length, 2);
  assert.equal(grupos.at(-1)?.id, "");
  assert.equal(grupos.at(-1)?.nome, "Sem orixá");
  assert.equal(
    grupos.reduce((n, g) => n + g.pontos.length, 0),
    2,
    "o agrupamento perdeu um ponto pelo caminho",
  );
});

test("lista vazia devolve nenhum grupo", () => {
  assert.deepEqual(agruparPorEntidade([]), []);
});

test("nenhum ponto é perdido nem duplicado", () => {
  const pontos = ["a", "b", "c", "d", "e"].map((id, i) =>
    ponto(id, ["exu", "ogum", "exu", null, "ogum"][i]),
  );
  const vistos = agruparPorEntidade(pontos).flatMap((g) => g.pontos.map((p) => p.id));
  assert.deepEqual([...vistos].sort(), ["a", "b", "c", "d", "e"]);
});


test("os mais ouvidos vêm do mais clicado para o menos", () => {
  const lista = maisOuvidos([
    ponto("a", "exu", "Exu", 3),
    ponto("b", "exu", "Exu", 9),
    ponto("c", "exu", "Exu", 5),
  ]);
  assert.deepEqual(lista.map((p) => p.id), ["b", "c", "a"]);
});

test("ponto sem clique nenhum fica de fora", () => {
  // Um ranking que inclui zeros é uma lista ordenada por desempate com cara de
  // popularidade. A seção inteira some quando ninguém clicou.
  assert.deepEqual(maisOuvidos([ponto("a", "exu", "Exu", 0)]), []);
  assert.deepEqual(maisOuvidos([]), []);
});

test("empate desempata pelo título, e não pela ordem do servidor", () => {
  // Sem desempate explícito, dois pontos com a mesma contagem trocam de lugar
  // entre carregamentos e a lista "pula" na tela sem nada ter mudado.
  const lista = maisOuvidos([
    ponto("zebra", "exu", "Exu", 4),
    ponto("abelha", "exu", "Exu", 4),
  ]);
  assert.deepEqual(lista.map((p) => p.id), ["abelha", "zebra"]);
});

test("corta em cinco por padrão", () => {
  const muitos = Array.from({ length: 12 }, (_, i) =>
    ponto(`p${i}`, "exu", "Exu", i + 1),
  );
  assert.equal(maisOuvidos(muitos).length, 5);
  assert.equal(maisOuvidos(muitos, 3).length, 3);
});

test("não mexe na lista que recebeu", () => {
  // `sort` ordena no lugar. Sem a cópia, a ordem litúrgica que o servidor
  // mandou seria destruída — e os blocos por entidade sairiam embaralhados na
  // mesma tela.
  const pontos = [ponto("a", "exu", "Exu", 1), ponto("b", "exu", "Exu", 9)];
  maisOuvidos(pontos);
  assert.deepEqual(pontos.map((p) => p.id), ["a", "b"]);
});
