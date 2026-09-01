/**
 * O catálogo e o acervo são duas perguntas diferentes.
 *
 * *"eu apaguei do acervo e sumiu da principal também, isso tá errado"* (02/09).
 * E está: tirar um ponto da minha gira não pode apagá-lo do catálogo. As telas
 * de DESCOBERTA leem o que existe; as de EDIÇÃO leem o que eu escolhi.
 */

import { deepEqual, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar } from "../testes/renderizar.ts";
import { fingirRede } from "../testes/rede.ts";
import { AppProvider, useApp } from "@/context";
import { AuthProvider } from "@/auth/AuthContext";
import type { AppData } from "@/types";

beforeEach(() => localStorage.clear());

const EU = {
  id: "u1", email: "m@e.com", email_verificado: true,
  apelido: "maria", admin: false, favoritos_publicos: false, foto: null,
};

const ponto = (id: string, titulo: string) => ({
  id, subcategoriaId: "s1", titulo, letra: "l",
  favorito: false, ordem: 0, criadoEm: 0,
});

/** O acervo DELE: já apagou um ponto. */
const MEU: AppData = { orixas: [], subcategorias: [], pontos: [ponto("a", "Ficou")] };
/** O CATÁLOGO: continua com os dois. */
const CATALOGO: AppData = {
  orixas: [], subcategorias: [],
  pontos: [ponto("a", "Ficou"), ponto("b", "Apagado do meu acervo")],
};

function Espelho() {
  const { dados, catalogo } = useApp();
  return (
    <>
      <span data-teste="meu">{dados.pontos.map((p) => p.id).join(",")}</span>
      <span data-teste="catalogo">{catalogo.pontos.map((p) => p.id).join(",")}</span>
    </>
  );
}

async function abrir(catalogo: unknown = CATALOGO) {
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) return { corpo: EU };
    if (url.includes("/meus-direitos")) {
      return { corpo: { plano: "pago", repertorios: true } };
    }
    if (url.includes("/catalogo")) return { corpo: catalogo };
    if (url.includes("/acervo")) {
      return { corpo: { ...MEU, acesso: { acervoOrganizado: true }, versao: "v1" } };
    }
    return { corpo: {} };
  });
  localStorage.setItem("pontos-umbanda-data", JSON.stringify(MEU));
  const tela = await renderizar(
    <Router hook={memoryLocation({ path: "/" }).hook}>
      <AuthProvider>
        <AppProvider>
          <Espelho />
        </AppProvider>
      </AuthProvider>
    </Router>,
  );
  await assentar();
  const ler = (qual: string) =>
    tela.exigir(`[data-teste="${qual}"]`).textContent ?? "";
  const saida = { meu: ler("meu"), catalogo: ler("catalogo") };
  await tela.desmontar();
  rede.restaurar();
  return saida;
}

test("o que eu apaguei do meu acervo continua no catálogo", async () => {
  const { meu, catalogo } = await abrir();
  deepEqual(meu, "a", "o acervo dele não é o que ele guardou");
  ok(
    catalogo.includes("b"),
    `o ponto apagado do acervo sumiu do catálogo também: ${catalogo}`,
  );
});

test("catálogo malformado não apaga a tela inicial", async () => {
  // `c && setCatalogo(c)` aceitava qualquer objeto — e um `{}` viraria um
  // catálogo sem `pontos`, deixando a tela inicial em branco. O acervo em cache
  // é uma resposta pior, mas é uma resposta.
  const { catalogo } = await abrir({ acesso: {} });
  deepEqual(catalogo, "a", "catálogo sem pontos apagou a tela");
});
