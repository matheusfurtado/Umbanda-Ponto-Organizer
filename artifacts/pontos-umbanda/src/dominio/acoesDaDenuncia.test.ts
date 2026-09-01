/**
 * O que a tela oferece a quem modera.
 *
 * O cruzamento com o servidor (`test_front_chama_rota_que_existe.py`) já
 * garante que os VALORES batem com o que a API aceita. O que sobra para cá é o
 * que o servidor não tem opinião: se a pessoa que vai clicar sabe o que a
 * escolha dela custa.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { ACOES_POR_ALVO, acoesDe } from "./acoesDaDenuncia.ts";

test('"procede sem mexer no app" existe para todo alvo', () => {
  // É a saída de quem julga que a denúncia procede e resolve fora do app —
  // falando com a pessoa. Sem ela, acolher obrigaria a punir.
  for (const [alvo, opcoes] of Object.entries(ACOES_POR_ALVO)) {
    assert.ok(
      opcoes.some((o) => o.valor === "nenhuma"),
      `em ${alvo} não há como acolher sem tomar providência no app`,
    );
  }
});

test("toda ação que muda alguma coisa avisa o que custa", () => {
  for (const [alvo, opcoes] of Object.entries(ACOES_POR_ALVO)) {
    for (const opcao of opcoes) {
      if (opcao.valor === "nenhuma") continue;
      assert.ok(
        opcao.aviso && opcao.aviso.trim().length > 0,
        `"${opcao.rotulo}" (${alvo}) muda a vida de alguém e vai para a tela ` +
          "sem dizer o que custa",
      );
    }
  }
});

test("tirar a foto avisa que não tem volta", () => {
  // Os bytes saem do banco e não há cópia. É a única ação irreversível da
  // lista, e quem clica precisa saber ANTES.
  const foto = ACOES_POR_ALVO.perfil.find((o) => o.valor === "foto_removida");
  assert.ok(foto, "a ação sumiu do mapa");
  assert.match(foto.aviso ?? "", /não tem volta/);
});

test("ponto pode ser tirado do acervo, e o aviso diz o preço", () => {
  // Este teste dizia o contrário — "ponto ainda não tem ação que mexa no
  // acervo" — e prendia a FALTA: `ACOES_POR_ALVO["ponto"]` só aceitava
  // `nenhuma`, então denunciar letra com dono ou texto ofensivo dava "acolhida"
  // e a letra continuava no ar. A rota de retirar existia desde 29/08 e o fluxo
  // nunca a chamou.
  //
  // O aviso importa mais aqui que em qualquer outra ação da lista: some para
  // todo mundo, e as cópias de quem organizou o acervo não voltam nem
  // desfazendo.
  assert.deepEqual(
    ACOES_POR_ALVO.ponto.map((o) => o.valor),
    ["ponto_retirado", "nenhuma"],
  );
  const retirar = ACOES_POR_ALVO.ponto.find((o) => o.valor === "ponto_retirado");
  assert.ok(retirar, "a ação sumiu do mapa");
  assert.match(retirar.aviso ?? "", /todo mundo/);
  assert.match(retirar.aviso ?? "", /não voltam/);
});

test("alvo desconhecido não deixa a tela sem opção nenhuma", () => {
  // Se a API ganhar um tipo de alvo novo antes de a tela saber dele, o admin
  // precisa pelo menos conseguir acolher sem punir — melhor que um cartão sem
  // botão nenhum, que trava a fila.
  const opcoes = acoesDe("coisa-que-ainda-nao-existe" as never);
  assert.deepEqual(opcoes.map((o) => o.valor), ["nenhuma"]);
});
