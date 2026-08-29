/**
 * Levar um ponto para uma gira — a escrita mais fácil de perder em silêncio.
 *
 * `PUT /repertorios/{id}/itens` SUBSTITUI a sequência inteira. Mandar a
 * sequência errada não dá erro: dá uma gira menor, e a pessoa só descobre no
 * meio da gira de sexta, com o terreiro esperando.
 */

import { deepEqual, equal, ok } from "node:assert/strict";
import { test } from "node:test";
import { act } from "react";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { AdicionarAGira } from "@/componentes/AdicionarAGira";
import type { Ponto } from "@/types";

const PONTO: Ponto = {
  id: "p-novo", subcategoriaId: "s1", titulo: "Ogum de Lei",
  letra: "l", favorito: false, ordem: 0, criadoEm: 0,
};

interface Gira {
  id: string;
  nome: string;
  ordem: number;
  versao: string;
  itens: { pontoId: string; secao: string | null; ordem: number }[];
}

function gira(id: string, nome: string, itens: string[], versao = "v1"): Gira {
  return {
    id, nome, ordem: 0, versao,
    itens: itens.map((pontoId, i) => ({ pontoId, secao: null, ordem: i })),
  };
}

/**
 * Um servidor de mentira que GUARDA o que recebeu.
 *
 * O que importa nestes testes não é o que a tela mostra — é o corpo do `PUT`.
 * Uma gira encolhe sem nenhum sinal na interface.
 */
function servidor(giras: Gira[], aoGravar?: () => { status: number; corpo: unknown } | void) {
  const gravacoes: { itens: { pontoId: string }[]; versao: unknown }[] = [];
  const criadas: string[] = [];
  const rede = fingirRede((url, init) => {
    if (init?.method === "PUT" && /\/repertorios\/[^/]+\/itens$/.test(url)) {
      const corpo = JSON.parse(String(init.body));
      gravacoes.push({ itens: corpo.itens, versao: corpo.versao });
      const recusa = aoGravar?.();
      if (recusa) return recusa;
      return { corpo: giras[0] };
    }
    if (init?.method === "POST" && /\/repertorios$/.test(url)) {
      const nome = JSON.parse(String(init.body)).nome;
      criadas.push(nome);
      const nova = gira(`nova-${criadas.length}`, nome, []);
      giras.push(nova);
      return { corpo: nova };
    }
    if (/\/repertorios$/.test(url)) return { corpo: giras };
    throw new Error(`chamada não prevista: ${init?.method ?? "GET"} ${url}`);
  });
  return { gravacoes, criadas, rede };
}

/**
 * Monta o diálogo e garante o desmonte.
 *
 * O Radix renderiza em PORTAL, no `document.body` — fora do container. Tela
 * que não é desmontada deixa o portal lá, e o teste seguinte, que procura na
 * página inteira, acha o botão do teste ANTERIOR. Aconteceu ao escrever este
 * arquivo: dois testes falharam medindo diálogos de outros.
 */
async function comDialogo(corpo: (tela: Tela) => Promise<void>) {
  const tela = await renderizar(<AdicionarAGira ponto={PONTO} onFechar={() => {}} />);
  await assentar();
  try {
    await corpo(tela);
  } finally {
    await tela.desmontar();
  }
}

/** O botão de confirmar. Vive no portal, e o rótulo muda ao salvar. */
const botaoAdicionar = (tela: Tela) =>
  tela.todosNaPagina("button").find((b) => /Adicionar/.test(b.textContent ?? ""))!;

const idsGravados = (g: { itens: { pontoId: string }[] }) => g.itens.map((i) => i.pontoId);

async function digitar(campo: Element, texto: string) {
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype, "value",
    )?.set;
    setter?.call(campo, texto);
    campo.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
}

test("o PUT leva a VERSÃO da gira — sem ela o servidor grava às cegas", async () => {
  // O servidor só recusa gravação cega quando o cliente manda `versao`
  // (`routers/repertorio.py`). Sem ela: a pessoa monta a gira no computador,
  // abre este diálogo no celular (que carregou a lista antes), aperta
  // Adicionar — e o que ela montou some, sem erro e sem aviso.
  const s = servidor([gira("g1", "Sexta", ["p1", "p2"], "abc123")]);
  try {
    await comDialogo(async (tela) => {
      await tela.clicar(botaoAdicionar(tela));
      await assentar();
      equal(s.gravacoes.length, 1);
      equal(s.gravacoes[0].versao, "abc123", "gravou sem a versão: é a escrita cega");
    });
  } finally {
    s.rede.restaurar();
  }
});

test("a sequência que já estava lá vai junto, e o novo entra no fim", async () => {
  const s = servidor([gira("g1", "Sexta", ["p1", "p2"])]);
  try {
    await comDialogo(async (tela) => {
      await tela.clicar(botaoAdicionar(tela));
      await assentar();
      deepEqual(
        idsGravados(s.gravacoes[0]),
        ["p1", "p2", "p-novo"],
        "a gira perdeu pontos, ou o novo não entrou no fim",
      );
    });
  } finally {
    s.rede.restaurar();
  }
});

test("gira mudada noutro aparelho: recarrega e AVISA, sem regravar às cegas", async () => {
  let recusou = false;
  const giras = [gira("g1", "Sexta", ["p1"], "velha")];
  const s = servidor(giras, () => {
    if (recusou) return;
    recusou = true;
    // Alguém acrescentou dois pontos no computador enquanto isto estava aberto.
    giras[0] = gira("g1", "Sexta", ["p1", "p9", "p10"], "nova");
    return { status: 409, corpo: { detail: "Esta gira mudou em outro aparelho." } };
  });
  try {
    await comDialogo(async (tela) => {
      await tela.clicar(botaoAdicionar(tela));
      await assentar();
      ok(/mudou em outro aparelho/.test(tela.textoNaPagina()), "não contou o que houve");
      ok(/Nada foi perdido/.test(tela.textoNaPagina()), "assustou sem tranquilizar");

      // Insistir manda a sequência FRESCA — não a que estava na tela.
      await tela.clicar(botaoAdicionar(tela));
      await assentar();
      equal(s.gravacoes.length, 2);
      deepEqual(
        idsGravados(s.gravacoes[1]),
        ["p1", "p9", "p10", "p-novo"],
        "insistir apagou o que o outro aparelho tinha acrescentado",
      );
      equal(s.gravacoes[1].versao, "nova", "insistiu com a versão velha");
    });
  } finally {
    s.rede.restaurar();
  }
});

test("o nome abandonado NÃO sobrevive para criar uma gira que ninguém pediu", async () => {
  // Sem giras, a pessoa digita um nome e desiste. O diálogo reabre noutro
  // ponto — e o campo continuava preenchido, com o botão ACESO, porque
  // `nomeNova.trim()` sozinho o habilita. Um toque e nascia uma gira com o
  // nome abandonado.
  const s = servidor([]);
  const tela = await renderizar(<AdicionarAGira ponto={PONTO} onFechar={() => {}} />);
  await assentar();
  try {
    const campo = tela
      .todosNaPagina("input")
      .find((i) => i.getAttribute("aria-label") === "Nome da nova gira")!;
    await digitar(campo, "Gira que desisti");
    equal(botaoAdicionar(tela).hasAttribute("disabled"), false, "o nome digitado não acendeu o botão");

    // Reabre para OUTRO ponto: só a prop muda, o componente não remonta.
    await tela.reRenderizar(
      <AdicionarAGira ponto={{ ...PONTO, id: "p-outro", titulo: "Outro" }} onFechar={() => {}} />,
    );
    await assentar();

    equal(
      botaoAdicionar(tela).hasAttribute("disabled"),
      true,
      "o botão continuou aceso pelo nome que a pessoa abandonou",
    );
    equal(s.criadas.length, 0);
  } finally {
    await tela.desmontar();
    s.rede.restaurar();
  }
});

test("uma gira só já vem escolhida; várias, nenhuma", async () => {
  // "Fazer a pessoa clicar na única opção é pedir confirmação de uma decisão
  // que não existe." Com várias, escolher por ela poria o ponto na gira errada.
  const uma = servidor([gira("g1", "Sexta", [])]);
  try {
    await comDialogo(async (tela) => {
      equal(
        botaoAdicionar(tela).hasAttribute("disabled"),
        false,
        "a única gira não veio escolhida",
      );
    });
  } finally {
    uma.rede.restaurar();
  }

  const varias = servidor([gira("g1", "Sexta", []), gira("g2", "Festa", [])]);
  try {
    await comDialogo(async (tela) => {
      equal(
        botaoAdicionar(tela).hasAttribute("disabled"),
        true,
        "escolheu uma gira pela pessoa",
      );
    });
  } finally {
    varias.rede.restaurar();
  }
});

test("sem conexão, a mensagem diz que giras precisam de rede", async () => {
  const s = servidor([gira("g1", "Sexta", [])], () => {
    throw new TypeError("Failed to fetch");
  });
  try {
    await comDialogo(async (tela) => {
      await tela.clicar(botaoAdicionar(tela));
      await assentar();
      ok(
        tela
          .todosNaPagina('[role="alert"]')
          .some((p) => /é preciso estar online/.test(p.textContent ?? "")),
        `mensagem errada: ${tela.textoNaPagina()}`,
      );
    });
  } finally {
    s.rede.restaurar();
  }
});

test("as seções sugeridas são as que ESTA gira já usa", async () => {
  // Lista fixa imporia o vocabulário de um terreiro aos outros.
  const g = gira("g1", "Sexta", []);
  g.itens = [
    { pontoId: "p1", secao: "Chegada", ordem: 0 },
    { pontoId: "p2", secao: "Louvação", ordem: 1 },
    { pontoId: "p3", secao: "Chegada", ordem: 2 },
  ];
  const s = servidor([g]);
  try {
    await comDialogo(async (tela) => {
      deepEqual(
        tela.todosNaPagina("#secoes-conhecidas option").map((o) => o.getAttribute("value")),
        ["Chegada", "Louvação"],
        "as sugestões não vieram da própria gira, ou vieram repetidas",
      );
    });
  } finally {
    s.rede.restaurar();
  }
});
