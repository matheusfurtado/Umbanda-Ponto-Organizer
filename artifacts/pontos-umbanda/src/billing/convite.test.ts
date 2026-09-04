/**
 * Quando o app pede para assinar — e, principalmente, quando NÃO pede.
 *
 * O que se prende aqui são as três travas do gatilho SOZINHO, porque é ele que
 * incomoda: nunca na primeira abertura, no máximo uma vez por semana, e nada
 * sem memória. O gatilho por intenção não tem trava de propósito — quem tocou
 * em "Seguir" perguntou, e responder não é interromper.
 */

import { equal, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import {
  DIAS_DE_DESCANSO,
  contarAbertura,
  marcarQueApareceu,
  observarConvite,
  pedirPlano,
  podeAparecerSozinho,
} from "@/billing/convite";

/**
 * Este arquivo não monta DOM (é `.ts`, não `.tsx`), então `localStorage` não
 * existe sozinho. Mesmo dublê do `ultimoPlano.test.ts`, ao lado.
 */
function fingirStorage(inicial: Record<string, string> = {}) {
  const caixa: Record<string, string> = { ...inicial };
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (c: string) => caixa[c] ?? null,
    setItem: (c: string, v: string) => {
      caixa[c] = v;
    },
    removeItem: (c: string) => {
      delete caixa[c];
    },
  };
  return caixa;
}

beforeEach(() => fingirStorage());

const DIA = 86_400_000;

test("na PRIMEIRA abertura o convite sozinho não aparece", () => {
  // Quem abriu agora não sabe o que o produto faz. Vender antes de mostrar é o
  // jeito mais rápido de a primeira impressão do app ser um anúncio.
  equal(contarAbertura(), 1);
  equal(podeAparecerSozinho(), false);
});

test("da segunda abertura em diante, pode", () => {
  contarAbertura();
  contarAbertura();
  equal(podeAparecerSozinho(), true);
});

test("depois de aparecer, descansa uma SEMANA", () => {
  // NÚMEROS LITERAIS, e não `DIAS_DE_DESCANSO ± 1`.
  //
  // A primeira versão deste teste derivava as datas da própria constante que
  // ele testa — então mudar a constante mudava o teste junto, e ele não podia
  // acusar nada. Provado por mutação: pondo `DIAS_DE_DESCANSO = 0`, tudo
  // continuava verde e o pop-up passava a aparecer em toda abertura.
  //
  // Uma semana é a decisão de produto: tempo suficiente para o convite não
  // virar paisagem, curto o bastante para alcançar quem só abre o app na
  // véspera da gira.
  contarAbertura();
  contarAbertura();
  const agora = 1_000 * DIA;
  marcarQueApareceu(agora);

  equal(podeAparecerSozinho(agora), false, "apareceu duas vezes seguidas");
  equal(podeAparecerSozinho(agora + 6 * DIA), false, "voltou antes da semana fechar");
  equal(podeAparecerSozinho(agora + 8 * DIA), true, "nunca mais voltou");
});

test("a semana é SETE dias — o número é decisão, não detalhe", () => {
  // Sem esta linha, `DIAS_DE_DESCANSO` pode ir a zero (pop-up em toda abertura)
  // ou a noventa (pop-up que ninguém vê) sem nada acusar. Foi o buraco que a
  // mutação encontrou.
  equal(DIAS_DE_DESCANSO, 7);
});

test("sem memória, o convite sozinho simplesmente não aparece", () => {
  // Aba anônima, armazenamento cheio, iOS em modo privado. O silêncio é o
  // padrão seguro: um pop-up que reaparece a cada abertura porque não consegue
  // lembrar que já apareceu é pior que nenhum pop-up.
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: () => { throw new Error("cheio"); },
    setItem: () => { throw new Error("cheio"); },
    removeItem: () => { throw new Error("cheio"); },
  };
  equal(contarAbertura(), 0);
  equal(podeAparecerSozinho(), false);
  marcarQueApareceu();  // não pode estourar
});

test("o gatilho por intenção avisa quem está ouvindo, sem trava nenhuma", () => {
  const vistos: string[] = [];
  const parar = observarConvite((m) => vistos.push(m));
  try {
    pedirPlano("seguir-artista");
    pedirPlano("seguir-artista");
    pedirPlano("montar-playlist");
    // Três vezes, e as três chegam: quem tenta três vezes merece a explicação
    // três vezes.
    equal(vistos.length, 3);
    equal(vistos[2], "montar-playlist");
  } finally {
    parar();
  }
});

test("quem parou de ouvir não recebe mais", () => {
  const vistos: string[] = [];
  observarConvite((m) => vistos.push(m))();
  pedirPlano("sozinho");
  ok(vistos.length === 0, "o pop-up desmontado continuou recebendo");
});
