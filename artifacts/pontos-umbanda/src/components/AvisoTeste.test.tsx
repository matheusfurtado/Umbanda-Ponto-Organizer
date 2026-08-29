/**
 * A faixa do teste: ela existe para ninguém ser surpreendido.
 *
 * "Descobrir que o teste acabou no meio de uma gira, com o celular na mão e o
 * terreiro esperando" é o que esta faixa evita — e por isso o que ela DIZ
 * importa tanto quanto o fato de aparecer. Uma faixa que erra a contagem é
 * pior que nenhuma: ela é lida como promessa.
 */

import { doesNotMatch, equal, match, ok } from "node:assert/strict";
import { test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { AvisoTeste } from "@/components/AvisoTeste";
import { EntitlementsProvider } from "@/billing/EntitlementsContext";
import { AuthProvider } from "@/auth/AuthContext";

const EU = {
  id: "u1", email: "maria@exemplo.com", email_verificado: true,
  apelido: "maria", admin: false, foto: null, favoritos_publicos: false,
};

async function comPlano(direitos: Record<string, unknown>) {
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) return { corpo: EU };
    if (url.includes("/meus-direitos")) return { corpo: direitos };
    throw new Error(`chamada não prevista: ${url}`);
  });
  const { hook } = memoryLocation({ path: "/" });
  const tela = await renderizar(
    <Router hook={hook}>
      <AuthProvider>
        <EntitlementsProvider>
          <AvisoTeste />
        </EntitlementsProvider>
      </AuthProvider>
    </Router>,
  );
  await assentar();
  return { tela, rede };
}

test("quem não está em teste não vê faixa nenhuma", async () => {
  const { tela, rede } = await comPlano({ plano: "gratis" });
  try {
    equal(tela.texto(), "");
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});

test("a contagem concorda com o número, no singular e no plural", async () => {
  for (const [dias, esperado] of [[12, /Faltam 12 dias/], [2, /Faltam 2 dias/], [1, /Falta 1 dia do seu teste/]] as const) {
    const { tela, rede } = await comPlano({ plano: "teste", diasRestantes: dias });
    try {
      match(tela.texto(), esperado);
    } finally {
      await tela.desmontar();
      rede.restaurar();
    }
  }
});

test("o último dia é dito como hoje, e a faixa fica firme", async () => {
  const { tela, rede } = await comPlano({ plano: "teste", diasRestantes: 0 });
  try {
    match(tela.texto(), /termina hoje/);
    ok(
      tela.exigir('[role="status"]').className.includes("amber"),
      "o último dia não se distingue de um dia qualquer",
    );
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});

test("perto do fim a faixa fica firme; longe, discreta", async () => {
  for (const [dias, firme] of [[3, true], [4, false]] as const) {
    const { tela, rede } = await comPlano({ plano: "teste", diasRestantes: dias });
    try {
      equal(
        tela.exigir('[role="status"]').className.includes("amber"),
        firme,
        `com ${dias} dias, o alarme ${firme ? "não soou" : "soou cedo demais"}`,
      );
    } finally {
      await tela.desmontar();
      rede.restaurar();
    }
  }
});

test("sem saber quantos dias, a faixa NÃO inventa que é hoje", async () => {
  // `diasRestantes` é opcional dos dois lados: o servidor manda `null` quando a
  // assinatura não tem data de fim. O `?? 0` transformava "não sei" em "termina
  // hoje" — com o estilo de urgência junto. É o mesmo defeito do achado #10,
  // numa linha: afirmar sobre o plano o que não se conferiu.
  //
  // Alarme falso custa a credibilidade de TODOS os avisos seguintes, e esta
  // faixa é a que precisa ser acreditada no dia em que estiver certa.
  const { tela, rede } = await comPlano({ plano: "teste", diasRestantes: null });
  try {
    doesNotMatch(tela.texto(), /termina hoje/, "inventou que o teste acaba hoje");
    doesNotMatch(tela.texto(), /Faltam? \d/, "inventou uma contagem");
    // Mas a faixa continua lá, dizendo o que continua e o que sai.
    match(tela.texto(), /continuam aqui/);
    ok(
      !tela.exigir('[role="status"]').className.includes("amber"),
      "soou alarme sem saber se havia motivo",
    );
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});

test("a saída para os planos está sempre na faixa", async () => {
  const { tela, rede } = await comPlano({ plano: "teste", diasRestantes: 5 });
  try {
    ok(tela.todos("a").some((a) => a.getAttribute("href") === "/planos"));
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});
