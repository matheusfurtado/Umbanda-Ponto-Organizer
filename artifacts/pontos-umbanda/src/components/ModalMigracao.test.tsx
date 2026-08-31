/**
 * O diálogo que leva o acervo do aparelho para a conta.
 *
 * Duas coisas aqui já custaram caro em outros lugares deste app e por isso
 * viram teste: **resultado que sobrevive ao fechar** (o diálogo fica montado
 * com `aberto={false}`, então reabrir mostrava o resumo da migração anterior —
 * "12 pontos migrados" para uma migração que não aconteceu agora), e **oferecer
 * ação que o servidor já recusa** (payload vazio volta 422 dizendo que
 * apagaria o acervo inteiro, e a pessoa lia isso como se tivesse tentado
 * apagar as próprias coisas).
 */

import { match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { ModalMigracao } from "@/components/ModalMigracao";
import type { AppData } from "@/types";

beforeEach(() => localStorage.clear());

const ACERVO: AppData = {
  orixas: [{ id: "o1", nome: "Ogum", cor: "#c00", emoji: "⚔️", ordem: 0, criadoEm: 0 }],
  subcategorias: [{ id: "s1", orixaId: "o1", nome: "Chegada", ordem: 0, criadoEm: 0 }],
  pontos: [
    { id: "p1", subcategoriaId: "s1", titulo: "Ogum de Lei", letra: "l", favorito: true, ordem: 0, criadoEm: 0 },
    { id: "p2", subcategoriaId: "s1", titulo: "Ogum Megê", letra: "l", favorito: false, ordem: 1, criadoEm: 0 },
  ],
};

const VAZIO: AppData = { orixas: [], subcategorias: [], pontos: [] };

// Números TODOS diferentes de propósito: com `pontosCanonicos` e
// `pontosCriados` iguais, trocar um pelo outro no código não mudaria a frase, e
// o teste passaria sem medir a distinção que ele existe para prender.
const RESUMO = {
  versao: "v2", orixas: 1, subcategorias: 1, pontos: 7,
  pontosCanonicos: 5, pontosCriados: 2, favoritos: 3,
};

async function abrir(
  acervo: AppData = ACERVO,
  resposta: { status?: number; corpo?: unknown } = { corpo: RESUMO },
) {
  localStorage.setItem("pontos-umbanda-data", JSON.stringify(acervo));
  const rede = fingirRede((url) => {
    if (url.includes("/acervo")) return resposta;
    throw new Error(`chamada não prevista: ${url}`);
  });
  let fechado = 0;
  const tela = await renderizar(
    <ModalMigracao aberto onFechar={() => { fechado += 1; }} />,
  );
  await assentar();
  return {
    tela,
    quantasVezesFechou: () => fechado,
    limpar: async () => {
      await tela.desmontar();
      rede.restaurar();
      localStorage.clear();
    },
  };
}

/** O diálogo mora num portal — o texto dele não está no container do render. */
const botao = (tela: Tela, texto: RegExp) =>
  tela.todosNaPagina("button").find((b) => texto.test(b.textContent ?? ""));

test("mostra o que vai subir, e conta os favoritos", async () => {
  const { tela, limpar } = await abrir();
  try {
    match(tela.textoNaPagina(), /Orixás/);
    match(tela.textoNaPagina(), /Incluindo 1 favorito\./);
    // "Nada é apagado" é a frase que responde ao medo de quem clica.
    match(tela.textoNaPagina(), /salvos neste aparelho/);
  } finally {
    await limpar();
  }
});

test("acervo vazio: o diálogo não oferece o envio que o servidor recusaria", async () => {
  // O `PUT` com payload vazio volta 422 — "Sync recusado: ele apagaria o
  // acervo inteiro". Oferecer o botão é empurrar a pessoa para uma recusa que
  // parece acusação.
  const { tela, limpar } = await abrir(VAZIO);
  try {
    match(tela.textoNaPagina(), /Não há nada guardado neste aparelho/);
    ok(!botao(tela, /Enviar para minha conta/), "ofereceu enviar um acervo vazio");
    // E a saída deixa de fingir que houve uma proposta a recusar.
    ok(botao(tela, /Fechar/), "sobrou o 'Agora não' de um convite que não existe");
  } finally {
    await limpar();
  }
});

test("enviado, o resumo separa o que a PESSOA escreveu do que é do acervo", async () => {
  // "Diz à pessoa que os pontos que ELA escreveu sobreviveram, e não sumiram
  // no meio dos 520 do acervo."
  const { tela, limpar } = await abrir();
  try {
    await tela.clicar(botao(tela, /Enviar para minha conta/)!);
    await assentar();
    match(tela.textoNaPagina(), /7 pontos na conta \(2 seus, 5 do acervo\)/);
    match(tela.textoNaPagina(), /3 favoritos preservados/);
  } finally {
    await limpar();
  }
});

test("fechar depois de migrar apaga o resultado — reabrir não repete o resumo", async () => {
  // O diálogo fica MONTADO com `aberto={false}`: sem o reset, reabrir mostrava
  // "2 pontos na conta" para uma migração que não aconteceu agora. É o mesmo
  // defeito de outros cinco diálogos (`dialogo-limpa-ao-fechar.test.ts`), e
  // aqui o que sobrevive não é um campo digitado, é um RESULTADO.
  const { tela, limpar } = await abrir();
  try {
    await tela.clicar(botao(tela, /Enviar para minha conta/)!);
    await assentar();
    match(tela.textoNaPagina(), /pontos na conta/);

    await tela.clicar(botao(tela, /Pronto/)!);
    await assentar();
    await tela.reRenderizar(<ModalMigracao aberto={false} onFechar={() => {}} />);
    await tela.reRenderizar(<ModalMigracao aberto onFechar={() => {}} />);
    await assentar();

    ok(
      !/pontos na conta/.test(tela.textoNaPagina()),
      `o resumo da migração anterior voltou: ${tela.textoNaPagina()}`,
    );
    ok(botao(tela, /Enviar para minha conta/), "reabriu sem o caminho de migrar");
  } finally {
    await limpar();
  }
});

test("falha ao migrar é dita com as palavras do servidor, e nada some da tela", async () => {
  const { tela, limpar } = await abrir(ACERVO, {
    status: 409,
    corpo: { detail: "Seu acervo mudou em outro aparelho. Recarregue e tente de novo." },
  });
  try {
    await tela.clicar(botao(tela, /Enviar para minha conta/)!);
    await assentar();
    match(tela.textoNaPagina(), /mudou em outro aparelho/);
    ok(!/API 409/.test(tela.textoNaPagina()), "vazou o status para a tela");
    // A contagem continua ali: quem falhou precisa poder tentar de novo.
    ok(botao(tela, /Enviar para minha conta/), "sumiu o botão depois da falha");
  } finally {
    await limpar();
  }
});
