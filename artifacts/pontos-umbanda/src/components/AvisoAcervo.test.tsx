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

/**
 * As ações da pessoa, por dentro do `useApp` — o mesmo caminho do app.
 *
 * `recarregar` e `sincronizarAgora` estão aqui porque a faixa nem sempre os
 * oferece, e são justamente os estados em que ela NÃO oferece que precisam ser
 * alcançados. `recarregar` é o que o botão "Atualizar" da própria faixa chama;
 * `sincronizarAgora` é o "Enviar agora". Semear o pendente direto no
 * localStorage não serve: `donoAtual` é estado de MÓDULO e só é definido pelo
 * login, então o pendente precisa nascer como nasce de verdade.
 */
function Mexer() {
  const { toggleFavorito, recarregar, sincronizarAgora } = useApp();
  return (
    <>
      <button type="button" onClick={() => toggleFavorito("p1")}>mexer</button>
      <button type="button" onClick={recarregar}>reabrir</button>
      <button type="button" onClick={sincronizarAgora}>sincronizar</button>
    </>
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

const apertar = async (tela: Tela, rotulo: string) => {
  await tela.clicar(tela.todos("button").find((b) => b.textContent === rotulo)!);
  await assentar();
};

const mexerNoAcervo = (tela: Tela) => apertar(tela, "mexer");

/**
 * O estado "reabri o app e tenho coisa na fila".
 *
 * Mexer enfileira (o envio de verdade só sai depois do debounce de 1,5 s, que
 * o teste não espera). Recarregar faz o `carregar()` achar esse pendente e
 * devolver `fonte: "cache"` — apesar de ter falado com o servidor COM SUCESSO.
 * É esse duplo sentido de "cache" que escondia o conflito e o bloqueio.
 */
const reabrirComFila = async (tela: Tela) => {
  await mexerNoAcervo(tela);
  await apertar(tela, "reabrir");
};

const enviarAgora = async (tela: Tela) => {
  const botao = tela.todos("button").find((b) => /Enviar agora|Tentar assim mesmo/.test(b.textContent ?? ""));
  ok(botao, `sem botão de envio em: ${tela.texto()}`);
  await tela.clicar(botao);
  await assentar();
};

/** O que o `Mexer` põe na tela, e que não é faixa. */
const SEM_A_AJUDA = (tela: Tela) =>
  tela.texto().replace(/mexer|reabrir|sincronizar/g, "").trim();

test("tudo certo: nenhuma faixa — a tela é do ponto, não do app", async () => {
  const { tela, limpar } = await montar({});
  try {
    // Pelo TEXTO e não pela ausência de um seletor: a faixa existe para
    // ocupar espaço acima da letra do ponto, e é esse espaço que precisa
    // estar vazio quando não há nada a dizer.
    equal(SEM_A_AJUDA(tela), "");
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
    ok(tela.achar('[role="status"]'), "não achei o elemento esperado");
    ok(tela.naoTem('[role="alert"]'), "interrompeu quem só queria ler a letra");
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
    ok(tela.achar('[role="alert"]'), "não achei o elemento esperado");
  } finally {
    await limpar();
  }
});


/* ------------------------------------------------------------------------ *
 * A ORDEM DAS FAIXAS
 *
 * `dados/repositorio.ts` devolve `fonte: "cache"` em dois casos muito
 * diferentes: a rede caiu, e existe pendente guardado (aí o servidor foi
 * alcançado normalmente). A faixa de cache vinha em segundo e RETORNAVA ali,
 * então bastava ter mudança na fila para ela mascarar o 409 e o 402 — que são
 * justamente as duas que exigem ação da pessoa.
 *
 * A máscara era permanente: 409 e 402 preservam o pendente, então o
 * `carregar()` seguinte devolve `fonte: "cache"` de novo.
 * ------------------------------------------------------------------------ */

test("reabrir com fila mostra a fila, e não a faixa de rede caída", async () => {
  // A frase da faixa de cache é sobre a REDE ("Mostrando os pontos guardados
  // neste aparelho"). Com a rede boa e uma fila cheia, ela é a resposta errada.
  const { tela, limpar } = await montar({});
  try {
    await reabrirComFila(tela);
    match(tela.texto(), /ainda não enviadas/);
  } finally {
    await limpar();
  }
});

test("com fila, o CONFLITO aparece — não a faixa mansa de cache", async () => {
  // O 409 é a única tela do app onde a pessoa escolhe qual cópia da gira dela
  // sobrevive. Escondê-la é decidir por ela, em silêncio.
  const { tela, limpar } = await montar({
    put: { status: 409, corpo: { detail: "mudou em outro aparelho" } },
  });
  try {
    await reabrirComFila(tela);
    await apertar(tela, "sincronizar");
    match(tela.texto(), /mudaram em outro aparelho/);
    match(tela.texto(), /Manter o deste aparelho/);
    match(tela.texto(), /Ficar com o do outro/);
    ok(
      !/Mostrando os pontos guardados/.test(tela.texto()),
      `a faixa de cache voltou a mascarar o conflito: ${tela.texto()}`,
    );
  } finally {
    await limpar();
  }
});

test("com fila, o BLOQUEADO aparece — o app precisa dizer que desistiu", async () => {
  // 402 é falta de plano: o app para de tentar sozinho. Se a faixa não conta,
  // a pessoa segue editando e nada sobe, para sempre.
  const { tela, limpar } = await montar({
    put: { status: 402, corpo: { detail: "Guardar seus pontos na nuvem faz parte do plano pago." } },
  });
  try {
    await reabrirComFila(tela);
    await apertar(tela, "sincronizar");
    match(tela.texto(), /não vão subir/);
    match(tela.texto(), /plano pago/);
    ok(
      !/Mostrando os pontos guardados/.test(tela.texto()),
      `a faixa de cache voltou a mascarar o bloqueio: ${tela.texto()}`,
    );
  } finally {
    await limpar();
  }
});

test("a rede caída continua vencendo a mera pendência — cache ainda vem antes", async () => {
  // A reordenação não podia inverter TUDO: quando `cache` significa mesmo "a
  // rede falhou", ela precede o "vão subir em instantes", que seria promessa
  // falsa sem rede.
  const { tela, limpar } = await montar({ getFalha: "rede" });
  try {
    match(tela.texto(), /Mostrando os pontos guardados/);
    await mexerNoAcervo(tela);
    match(
      tela.texto(),
      /Mostrando os pontos guardados/,
      "a promessa de envio passou na frente de uma rede que caiu",
    );
  } finally {
    await limpar();
  }
});

test("depois de subir, a faixa PARA de jurar que não subiu", async () => {
  // `motivoFalha` congela na carga: "há mudanças suas ainda não enviadas".
  // Quando o envio completa, `envio.pendente` cai — mas ninguém reescreve o
  // motivo, porque nada dispara um `carregar()` novo depois de um envio bom.
  // A faixa ficava afirmando indefinidamente o contrário do que o código sabia.
  const { tela, limpar } = await montar({});
  try {
    await reabrirComFila(tela);
    match(tela.texto(), /ainda não enviadas/, "não chegou ao estado que o teste precisa");
    await apertar(tela, "sincronizar");
    ok(
      !/ainda não enviadas/.test(tela.texto()),
      `continuou jurando que não subiu depois de subir: ${tela.texto()}`,
    );
    ok(
      !/Mostrando os pontos guardados/.test(tela.texto()),
      `sobrou a faixa de cache sobre um acervo que já bate com o servidor: ${tela.texto()}`,
    );
  } finally {
    await limpar();
  }
});
