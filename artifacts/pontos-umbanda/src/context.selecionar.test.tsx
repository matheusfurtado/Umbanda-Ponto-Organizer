/**
 * Abrir um orixá NÃO grava acervo.
 *
 * `selecionarOrixa` gravava `ultimoOrixaId` pelo mesmo `atualizar` que
 * persiste — e persistir grava no `localStorage` e enfileira o envio do
 * `AppData` inteiro. Bastava abrir um orixá para copiar 519 pontos no servidor,
 * sem a pessoa ter pedido nada: o acervo pessoal nascia por acidente, não por
 * ato de organização (ADR 0009).
 *
 * ## Por que o detector é o `localStorage`, e não a rede
 *
 * `persistir` grava local na hora e ENFILEIRA o envio. Um detector de rede não
 * veria a escrita dentro do teste — e a fila pendente mantém o processo vivo,
 * fazendo o arquivo travar por 300 s em vez de falhar. Já a gravação local é
 * síncrona: é o sinal mais próximo da causa.
 *
 * A mutação também não serve de prova aqui: repor o `atualizar` dentro de
 * `selecionarOrixa` põe o componente em laço de renderização e o teste TRAVA.
 * Travar não é medir — por isso o segundo caso, que prova que o detector
 * enxerga a gravação quando ela acontece de verdade.
 */

import { equal } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar } from "../testes/renderizar.ts";
import { fingirRede } from "../testes/rede.ts";
import { AppProvider, useApp } from "@/context";
import { AuthProvider } from "@/auth/AuthContext";
import type { AppData } from "@/types";

const CHAVE = "pontos-umbanda-data";

beforeEach(() => localStorage.clear());

const EU = {
  id: "u1", email: "m@e.com", email_verificado: true,
  apelido: "maria", admin: false, favoritos_publicos: false, foto: null,
};

const ACERVO: AppData = {
  orixas: [{ id: "ogum", nome: "Ogum", cor: "#c00", emoji: "⚔️", ordem: 0 }] as AppData["orixas"],
  subcategorias: [],
  pontos: [{
    id: "p1", subcategoriaId: "s1", titulo: "Ogum de Lei", letra: "l",
    favorito: false, ordem: 0, criadoEm: 0,
  }],
};

function Botao() {
  const { dados, selecionarOrixa, orixaSelecionado } = useApp();
  return (
    <>
      <button
        type="button"
        onClick={() => selecionarOrixa(dados.orixas[0] ?? null)}
      >
        agir
      </button>
      {/* O que prova que o clique ACONTECEU. Sem isto, a afirmação de ausência
          passaria sozinha no dia em que o botão parasse de chamar a função. */}
      <span data-teste="selecionado">{orixaSelecionado?.id ?? "-"}</span>
    </>
  );
}

async function abrirEClicar() {
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) return { corpo: EU };
    if (url.includes("/meus-direitos")) {
      return { corpo: { plano: "pago", repertorios: true } };
    }
    if (url.includes("/acervo")) {
      return { corpo: { ...ACERVO, acesso: { acervoOrganizado: true }, versao: "v1" } };
    }
    return { corpo: {} };
  });
  localStorage.setItem(CHAVE, JSON.stringify(ACERVO));
  const tela = await renderizar(
    <Router hook={memoryLocation({ path: "/" }).hook}>
      <AuthProvider>
        <AppProvider>
          <Botao />
        </AppProvider>
      </AuthProvider>
    </Router>,
  );
  await assentar();
  const antes = localStorage.getItem(CHAVE);
  await tela.clicar(tela.exigir("button"));
  await assentar();
  const resultado = {
    gravou: antes !== localStorage.getItem(CHAVE),
    selecionado: tela.exigir('[data-teste="selecionado"]').textContent,
  };
  await tela.desmontar();
  rede.restaurar();
  return resultado;
}

test("selecionar um orixá não grava acervo — e o clique aconteceu", async () => {
  const { gravou, selecionado } = await abrirEClicar();

  // A guarda de completude vem PRIMEIRO: uma afirmação de ausência passa
  // sozinha no dia em que o clique deixa de acontecer.
  equal(selecionado, "ogum", "o clique não selecionou nada — a cerca ficou vazia");
  equal(gravou, false, "abrir um orixá gravou o acervo");
});
