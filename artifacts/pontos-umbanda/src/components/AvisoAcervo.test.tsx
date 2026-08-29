/**
 * A faixa que diz de onde vieram os pontos — e o que está para acontecer com
 * os que a pessoa acabou de mexer.
 *
 * É a última coisa que alguém quer errada estando offline no terreiro. Ela não
 * bloqueia nada de propósito: na gira, um modal entre a pessoa e a letra do
 * ponto é pior que dado um pouco velho. Em compensação, tudo o que ela AFIRMA
 * precisa ser verdade — é a única fonte de informação sobre o que o app está
 * fazendo com o trabalho dela.
 *
 * Os cenários aqui são montados de fora, pela rede: `AppProvider` e
 * `dados/repositorio` de verdade, sem dublê de estado interno. É o que faz o
 * teste valer — o estado da sincronização é justamente o que ninguém consegue
 * inspecionar olhando o código de uma tela.
 */

import { equal, match, ok } from "node:assert/strict";
import { test } from "node:test";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { AvisoAcervo } from "@/components/AvisoAcervo";
import { AppProvider, useApp } from "@/context";
import { AuthProvider } from "@/auth/AuthContext";
import type { AppData } from "@/types";

const EU = {
  id: "u1", email: "m@e.com", email_verificado: true,
  apelido: "m", admin: false, foto: null, favoritos_publicos: false,
};

const ACERVO: AppData = {
  orixas: [{ id: "ogum", nome: "Ogum", cor: "#c00", emoji: "⚔️", ordem: 0 }] as AppData["orixas"],
  subcategorias: [{ id: "s1", orixaId: "ogum", nome: "Chegada", ordem: 0, criadoEm: 0 }],
  pontos: [{
    id: "p1", subcategoriaId: "s1", orixaId: "ogum", titulo: "Ogum de Lei",
    letra: "l", favorito: false, ordem: 0, criadoEm: 0,
  }],
};

/** Um botão dentro do componente, para a pessoa "mexer no acervo". */
function Mexer() {
  const { toggleFavorito } = useApp();
  return (
    <button type="button" onClick={() => toggleFavorito("p1")}>
      mexer
    </button>
  );
}

interface Cenario {
  /** GET /acervo falha? */
  getFalha?: number | "rede";
  /** Resposta do PUT /acervo. */
  put?: { status: number; corpo?: unknown };
  /** Há cópia guardada neste aparelho? */
  comCache?: boolean;
}

async function montar(c: Cenario) {
  localStorage.clear();
  if (c.comCache !== false) {
    localStorage.setItem("pontos-umbanda-data", JSON.stringify(ACERVO));
  }
  const rede = fingirRede((url, init) => {
    if (url.includes("/auth/eu")) return { corpo: EU };
    if (url.includes("/acervo") && init?.method === "PUT") {
      return c.put ?? { corpo: { versao: "v2" } };
    }
    if (url.includes("/acervo")) {
      if (c.getFalha === "rede") throw new TypeError("Failed to fetch");
      if (c.getFalha) return { status: c.getFalha, corpo: { detail: "servidor fora" } };
      return { corpo: { ...ACERVO, acesso: { acervoOrganizado: true }, versao: "v1" } };
    }
    throw new Error(`chamada não prevista: ${init?.method ?? "GET"} ${url}`);
  });
  const tela = await renderizar(
    <AuthProvider>
      <AppProvider>
        <AvisoAcervo />
        <Mexer />
      </AppProvider>
    </AuthProvider>,
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

const mexerNoAcervo = async (tela: Tela) => {
  await tela.clicar(tela.todos("button").find((b) => b.textContent === "mexer")!);
  await assentar();
};

const enviarAgora = async (tela: Tela) => {
  const botao = tela.todos("button").find((b) => /Enviar agora|Tentar assim mesmo/.test(b.textContent ?? ""));
  ok(botao, `sem botão de envio em: ${tela.texto()}`);
  await tela.clicar(botao);
  await assentar();
};

test("tudo certo: nenhuma faixa — a tela é do ponto, não do app", async () => {
  const { tela, limpar } = await montar({});
  try {
    equal(tela.texto().replace("mexer", "").trim(), "");
  } finally {
    await limpar();
  }
});

test("sem rede e SEM cópia guardada: diz o que fazer, e não some", async () => {
  const { tela, limpar } = await montar({ comCache: false, getFalha: "rede" });
  try {
    match(tela.texto(), /Não consegui carregar os pontos/);
    match(tela.texto(), /conecte-se uma vez/i);
    ok(tela.todos("button").some((b) => /Tentar de novo/.test(b.textContent ?? "")));
  } finally {
    await limpar();
  }
});

test("sem rede COM cópia guardada: informa e sai da frente", async () => {
  // Na gira, dado um pouco velho é melhor que um modal entre a pessoa e a
  // letra. A faixa é `role=status`, não `alert`.
  const { tela, limpar } = await montar({ getFalha: "rede" });
  try {
    match(tela.texto(), /Mostrando os pontos guardados neste aparelho/);
    equal(tela.achar('[role="status"]') !== null, true);
    equal(tela.achar('[role="alert"]'), null, "interrompeu quem só queria ler a letra");
  } finally {
    await limpar();
  }
});

test("mexeu e ainda não subiu: promete o que vai acontecer", async () => {
  const { tela, limpar } = await montar({});
  try {
    await mexerNoAcervo(tela);
    match(tela.texto(), /salvas neste aparelho e vão subir em instantes/);
  } finally {
    await limpar();
  }
});

test("o servidor recusa de um jeito que insistir NÃO resolve", async () => {
  // 402: falta plano. O `insistirAdianta` devolve falso e o app PARA de tentar
  // sozinho — mas a faixa dizia "ainda não subiram", que se lê como "estão
  // subindo", e oferecia "Enviar agora". A pessoa tocava, falhava igual, e
  // tocava de novo. O app sabia que não ia adiantar e não contava.
  const { tela, limpar } = await montar({
    put: { status: 402, corpo: { detail: "Seu plano não inclui isso." } },
  });
  try {
    await mexerNoAcervo(tela);
    await enviarAgora(tela);

    match(tela.texto(), /não vão subir sozinhas/, `faixa: ${tela.texto()}`);
    match(tela.texto(), /nada aqui se perde/i, "assustou sem dizer que o dado está seguro");
    ok(
      !/vão subir em instantes/.test(tela.texto()),
      "continuou prometendo um envio que o app já desistiu de tentar",
    );
    // A saída manual FICA — a causa é de fora e pode ter sido resolvida —,
    // mas com o nome do que é.
    ok(
      tela.todos("button").some((b) => /Tentar assim mesmo/.test(b.textContent ?? "")),
      "tirou a saída manual junto",
    );
  } finally {
    await limpar();
  }
});

test("falha passageira segue prometendo, porque aí ela vai mesmo", async () => {
  // 503 é do outro lado da fronteira do `insistirAdianta`: o app continua
  // tentando sozinho, e dizer "não vão subir sozinhas" seria mentira na outra
  // direção.
  const { tela, limpar } = await montar({ put: { status: 503, corpo: { detail: "fora do ar" } } });
  try {
    await mexerNoAcervo(tela);
    await enviarAgora(tela);
    match(tela.texto(), /ainda não subiram/);
    ok(!/não vão subir sozinhas/.test(tela.texto()), "desistiu de uma falha passageira");
  } finally {
    await limpar();
  }
});

test("conflito: as duas saídas, e o aviso do que se perde ao escolher", async () => {
  const { tela, limpar } = await montar({
    put: { status: 409, corpo: { detail: "mudou em outro aparelho" } },
  });
  try {
    await mexerNoAcervo(tela);
    await enviarAgora(tela);
    match(tela.texto(), /mudaram em outro aparelho/i);
    match(tela.texto(), /Nada foi perdido/);
    for (const rotulo of [/Manter o deste aparelho/, /Ficar com o do outro/]) {
      ok(
        tela.todos("button").some((b) => rotulo.test(b.textContent ?? "")),
        `faltou a saída ${rotulo}`,
      );
    }
    // Conflito INTERROMPE: aqui a pessoa precisa decidir, e por isso é `alert`.
    equal(tela.achar('[role="alert"]') !== null, true);
  } finally {
    await limpar();
  }
});
