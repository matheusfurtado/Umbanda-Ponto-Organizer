/**
 * O espelho de UX do portão: ele erra fechando, nunca abrindo.
 *
 * O `Gate` NÃO autoriza nada — a autorização é do servidor, em cada rota (ADR
 * 0002), e o próprio componente avisa por escrito que não se põe conteúdo
 * secreto atrás dele. Mas ele decide o que a pessoa VÊ, e um espelho que abre
 * quando não devia mostra botão que não funciona, que é como se perde a
 * confiança no resto da tela.
 *
 * O que se prende aqui é a direção do erro: **na dúvida, fecha.**
 */

import { equal, match } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { assentar, renderizar } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { Gate } from "@/components/Gate";
import { EntitlementsProvider } from "@/billing/EntitlementsContext";
import { AuthProvider } from "@/auth/AuthContext";

/**
 * O `AuthProvider` hidrata `user` de forma SÍNCRONA do `localStorage`
 * (`useState(() => lembrado())`) — é o que faz o app abrir sem piscar "Entrar"
 * para quem já estava logada. Num processo de teste, isso significa que a
 * pessoa do teste anterior continua logada no seguinte.
 *
 * Custou uma mutação sobrevivente no `MenuUsuario`: o cenário "ainda não sei
 * quem é" nunca acontecia, porque o usuário do teste de cima já estava lá.
 */
beforeEach(() => localStorage.clear());


const EU = {
  id: "u1", email: "maria@exemplo.com", email_verificado: true,
  apelido: "maria", admin: false, foto: null, favoritos_publicos: false,
};

async function comDireitos(direitos: Record<string, unknown>, logado = true) {
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) return logado ? { corpo: EU } : { status: 401, corpo: {} };
    if (url.includes("/meus-direitos")) return { corpo: direitos };
    throw new Error(`chamada não prevista: ${url}`);
  });
  const tela = await renderizar(
    <AuthProvider>
      <EntitlementsProvider>
        <Gate feature="repertorios" fallback={<span>assine para usar giras</span>}>
          <span>minhas giras</span>
        </Gate>
      </EntitlementsProvider>
    </AuthProvider>,
  );
  await assentar();
  return { tela, rede };
}

test("quem tem o direito vê o conteúdo", async () => {
  const { tela, rede } = await comDireitos({ plano: "mensal", repertorios: true });
  try {
    match(tela.texto(), /minhas giras/);
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});

test("quem não tem vê a alternativa, e não o conteúdo", async () => {
  const { tela, rede } = await comDireitos({ plano: "gratis", repertorios: false });
  try {
    equal(tela.texto(), "assine para usar giras");
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});

test("direito que o servidor NÃO mandou não abre o portão", async () => {
  // Campo ausente vira `undefined`, e `undefined` é falso. Parece trivial e não
  // é: se um dia alguém trocar isto por `ent[feature] !== false`, resposta
  // truncada, versão nova do servidor ou plano lembrado de um formato antigo
  // passam a ABRIR. O erro tem de cair para o lado de fechar.
  const { tela, rede } = await comDireitos({ plano: "gratis" });
  try {
    equal(tela.texto(), "assine para usar giras");
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});

test("sem sessão o portão fica fechado", async () => {
  const { tela, rede } = await comDireitos({ plano: "gratis", repertorios: false }, false);
  try {
    equal(tela.texto(), "assine para usar giras");
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});
