import { deepEqual } from "node:assert/strict";
import { test } from "node:test";
import { boasVindas, DIAS_DE_TESTE } from "@/billing/boasVindas";

test("quem ganhou o teste ouve quantos dias tem", () => {
  deepEqual(boasVindas({ plano: "teste", diasRestantes: 15 }), {
    tipo: "teste",
    dias: 15,
  });
});

test("quem NÃO ganhou teste não é informado de que ganhou", () => {
  // O caso do defeito: a caixa de entrada já usou o teste, `conceder` devolveu
  // nada, e a rota respondeu igual. A tela prometia 15 dias e entregava o
  // plano grátis na tela seguinte.
  deepEqual(boasVindas({ plano: "gratis" }), { tipo: "gratis" });
});

test("assinante não recebe boas-vindas de teste", () => {
  deepEqual(boasVindas({ plano: "mensal" }), { tipo: "pago" });
});

test("plano que o front nunca viu conta como pago, não como teste", () => {
  // Um plano novo no servidor não pode virar promessa de 15 dias aqui.
  deepEqual(boasVindas({ plano: "anual-2027" }), { tipo: "pago" });
});

test("sem resposta do servidor a tela não afirma nada sobre plano", () => {
  deepEqual(boasVindas(null), null);
  deepEqual(boasVindas(undefined), null);
});

test("teste sem contagem de dias usa os 15, e nunca anuncia zero", () => {
  // "Seus 0 dias de teste começam agora" é pior que não dizer nada.
  deepEqual(boasVindas({ plano: "teste" }), { tipo: "teste", dias: DIAS_DE_TESTE });
  deepEqual(boasVindas({ plano: "teste", diasRestantes: 0 }), {
    tipo: "teste",
    dias: DIAS_DE_TESTE,
  });
  deepEqual(boasVindas({ plano: "teste", diasRestantes: null }), {
    tipo: "teste",
    dias: DIAS_DE_TESTE,
  });
});
