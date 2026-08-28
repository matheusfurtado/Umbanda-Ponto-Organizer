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

import { agruparPorEntidade, type PontoDoArtista } from "./artista.ts";

function ponto(
  id: string,
  orixaId: string | null,
  nome: string | null = orixaId,
): PontoDoArtista {
  return {
    id,
    titulo: `ponto ${id}`,
    orixa: nome,
    orixaId,
    orixaEmoji: orixaId ? "🔥" : null,
    orixaCor: orixaId ? "#dc2626" : null,
    orixaTipo: "orixa",
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
