/**
 * Quando o app OFERECE levar o acervo do aparelho para a conta.
 *
 * A condição era "a chave `pontos-umbanda-data` existe". Mas essa chave também
 * é escrita quando o app guarda o acervo BAIXADO do servidor — e existe vazia
 * num aparelho que nunca recebeu nada. Nos dois casos o convite era falso, e no
 * segundo o `PUT` volta 422 dizendo que apagaria o acervo inteiro: a pessoa lê
 * uma acusação por ter aceitado o que o app ofereceu.
 */

import { ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { GerenciadorMigracao } from "@/componentes/GerenciadorMigracao";
import { AuthProvider } from "@/auth/AuthContext";
import type { AppData } from "@/types";

beforeEach(() => localStorage.clear());

const EU = {
  id: "u1", email: "m@e.com", email_verificado: true,
  apelido: "maria", admin: false, favoritos_publicos: false, foto: null,
};

const VAZIO: AppData = { orixas: [], subcategorias: [], pontos: [] };

const COM_PONTOS: AppData = {
  orixas: [{ id: "o1", nome: "Ogum", cor: "#c00", emoji: "⚔️", ordem: 0, criadoEm: 0 }],
  subcategorias: [{ id: "s1", orixaId: "o1", nome: "Chegada", ordem: 0, criadoEm: 0 }],
  pontos: [
    { id: "p1", subcategoriaId: "s1", titulo: "Ogum de Lei", letra: "l", favorito: false, ordem: 0, criadoEm: 0 },
  ],
};

/** `acervo: null` = a chave nem existe (aparelho que nunca abriu o app). */
async function abrir(
  { acervo, logado = true, jaOferecido = false }:
  { acervo: AppData | null; logado?: boolean; jaOferecido?: boolean },
) {
  if (acervo) localStorage.setItem("pontos-umbanda-data", JSON.stringify(acervo));
  if (jaOferecido) localStorage.setItem("migracao-oferecida", "1");
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) return logado ? { corpo: EU } : { status: 401, corpo: {} };
    throw new Error(`chamada não prevista: ${url}`);
  });
  const tela = await renderizar(
    <AuthProvider>
      <GerenciadorMigracao />
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

/** O diálogo mora num portal, fora do container do render. */
const ofereceu = (tela: Tela) => /Enviar seus pontos para a conta/.test(tela.textoNaPagina());

test("com pontos no aparelho, o convite aparece depois do login", async () => {
  const { tela, limpar } = await abrir({ acervo: COM_PONTOS });
  try {
    ok(ofereceu(tela), "não ofereceu migrar um acervo que existe");
  } finally {
    await limpar();
  }
});

test("acervo VAZIO no aparelho não vira convite", async () => {
  // A chave existe — foi escrita pelo próprio app ao guardar o que veio do
  // servidor, ou numa primeira volta sem nada. Presença de chave não é
  // presença de acervo, e aceitar este convite dava 422.
  const { tela, limpar } = await abrir({ acervo: VAZIO });
  try {
    ok(!ofereceu(tela), `ofereceu migrar um acervo vazio: ${tela.textoNaPagina()}`);
  } finally {
    await limpar();
  }
});

test("sem chave nenhuma, nada é oferecido", async () => {
  const { tela, limpar } = await abrir({ acervo: null });
  try {
    ok(!ofereceu(tela));
  } finally {
    await limpar();
  }
});

test("o modo anônimo nunca vê isto", async () => {
  // Migrar é para dentro de uma CONTA. Sem sessão não há para onde levar, e
  // insistir com quem escolheu ficar anônimo é pedir religião a quem não deu.
  const { tela, limpar } = await abrir({ acervo: COM_PONTOS, logado: false });
  try {
    ok(!ofereceu(tela), "ofereceu migração a quem não entrou");
  } finally {
    await limpar();
  }
});

test("oferecido uma vez, não se oferece de novo", async () => {
  const { tela, limpar } = await abrir({ acervo: COM_PONTOS, jaOferecido: true });
  try {
    ok(!ofereceu(tela), "insistiu com quem já respondeu");
  } finally {
    await limpar();
  }
});

test("fechar marca como oferecido — reabrir o app não repete o convite", async () => {
  // "Fechar (mesmo 'Agora não') marca como oferecido." Sem isso, todo login
  // reabria o diálogo por cima de quem já disse não.
  const { tela, limpar } = await abrir({ acervo: COM_PONTOS });
  try {
    const agoraNao = tela
      .todosNaPagina("button")
      .find((b) => /Agora não/.test(b.textContent ?? ""));
    ok(agoraNao, "o diálogo abriu sem a saída de recusar");
    await tela.clicar(agoraNao!);
    await assentar();
    ok(localStorage.getItem("migracao-oferecida") === "1", "recusar não foi lembrado");
    ok(!ofereceu(tela), "o diálogo continuou aberto depois de recusar");
  } finally {
    await limpar();
  }
});
