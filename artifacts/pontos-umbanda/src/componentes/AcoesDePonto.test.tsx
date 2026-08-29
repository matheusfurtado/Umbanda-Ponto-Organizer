/**
 * Quem vê cada ação — e por que as duas regras são diferentes.
 *
 * "Adicionar à gira" depende de PLANO; "sugerir autor" depende de CONTA. São
 * duas perguntas distintas, e trocá-las uma pela outra dá o mesmo sintoma nas
 * duas direções: botão que aparece e não funciona, ou função que existe e
 * ninguém encontra.
 */

import { equal } from "node:assert/strict";
import { test } from "node:test";
import { assentar, renderizar } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { useAcoesDePonto } from "@/componentes/AcoesDePonto";
import { AuthProvider } from "@/auth/AuthContext";
import { EntitlementsProvider } from "@/billing/EntitlementsContext";

const EU = {
  id: "u1", email: "m@e.com", email_verificado: true,
  apelido: "m", admin: false, foto: null, favoritos_publicos: false,
};

function Espia() {
  const { adicionar, sugerir } = useAcoesDePonto();
  return (
    <span>
      {adicionar ? "pode-adicionar" : "sem-adicionar"}/
      {sugerir ? "pode-sugerir" : "sem-sugerir"}
    </span>
  );
}

async function comoEstou(logado: boolean, direitos: Record<string, unknown>) {
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) return logado ? { corpo: EU } : { status: 401, corpo: {} };
    if (url.includes("/meus-direitos")) return { corpo: direitos };
    throw new Error(`chamada não prevista: ${url}`);
  });
  const tela = await renderizar(
    <AuthProvider>
      <EntitlementsProvider>
        <Espia />
      </EntitlementsProvider>
    </AuthProvider>,
  );
  await assentar();
  const visto = tela.texto();
  await tela.desmontar();
  rede.restaurar();
  return visto;
}

test("sem conta: nenhuma das duas", async () => {
  equal(await comoEstou(false, { plano: "gratis", repertorios: false }), "sem-adicionar/sem-sugerir");
});

test("conta sem plano: sugere autor, mas não oferece gira", async () => {
  // "Mostrá-lo a quem não tem e abrir uma tela de 'assine' seria vender
  // empurrando: a pessoa clica achando que vai fazer uma coisa e recebe outra."
  equal(await comoEstou(true, { plano: "gratis", repertorios: false }), "sem-adicionar/pode-sugerir");
});

test("conta com plano: as duas", async () => {
  equal(await comoEstou(true, { plano: "mensal", repertorios: true }), "pode-adicionar/pode-sugerir");
});

test("o direito que o servidor não mandou não abre a gira", async () => {
  // Mesma direção de erro do `Gate`: campo ausente é `undefined`, e `undefined`
  // fecha. Resposta truncada ou plano lembrado de formato antigo não podem
  // acender um botão que a rota vai recusar com 402.
  equal(await comoEstou(true, { plano: "mensal" }), "sem-adicionar/pode-sugerir");
});
