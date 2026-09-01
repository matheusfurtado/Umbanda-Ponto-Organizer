/**
 * Que providência cabe em cada tipo de conteúdo denunciado.
 *
 * Mora aqui, e não dentro da tela, por um motivo concreto: **o servidor tem a
 * mesma tabela** (`ACOES_POR_ALVO`, em `routers/denuncia.py`) e recusa com 422
 * o que não couber. Se as duas divergirem, o admin vê um botão que sempre
 * falha — e descobre isso no meio de uma decisão de moderação.
 *
 * Com o mapa num arquivo só e em forma de dado, um teste do lado do Python lê
 * este arquivo e compara com o dele. Enquanto isso vivia dentro de um `if` no
 * meio do JSX, não havia como cruzar.
 *
 * O rótulo e o aviso são deste lado: o servidor não tem opinião sobre como se
 * escreve para quem vai clicar. Mas o **aviso é obrigatório** para toda ação
 * que muda a vida de alguém — quem acolhe uma denúncia precisa saber, antes de
 * clicar, que tirar a foto não tem volta.
 */

import type { AcaoDeDenuncia, AlvoDeDenuncia } from "@/api/denuncia";

export interface OpcaoDeAcao {
  valor: AcaoDeDenuncia;
  rotulo: string;
  /** O que a ação custa a quem é alvo. Obrigatório quando ela muda algo. */
  aviso?: string;
}

/** "Procede, mas a providência é fora do app" — vale para todo alvo. */
const NENHUMA: OpcaoDeAcao = {
  valor: "nenhuma",
  rotulo: "Procede, sem mexer no app",
};

export const ACOES_POR_ALVO: Record<AlvoDeDenuncia, OpcaoDeAcao[]> = {
  perfil: [
    { valor: "foto_removida", rotulo: "Tirar a foto", aviso: "não tem volta" },
    {
      valor: "apelido_limpo",
      rotulo: "Tirar o nome público",
      aviso: "some o perfil inteiro, e o nome fica reservado",
    },
    NENHUMA,
  ],
  gira: [
    {
      valor: "gira_despublicada",
      rotulo: "Tirar da vitrine",
      aviso: "a playlist continua com quem a montou",
    },
    NENHUMA,
  ],
  // Tirar do acervo some para TODO MUNDO, e por isso o aviso é o mais duro da
  // tela. A ação existe desde 02/09; antes disso denunciar letra com dono ou
  // texto ofensivo dava "acolhida" e a letra ficava no ar.
  ponto: [
    {
      valor: "ponto_retirado",
      rotulo: "Tirar do acervo",
      aviso: "some para todo mundo, e as cópias de quem organizou não voltam",
    },
    NENHUMA,
  ],
  // Nenhuma delas apaga o artista. Apagar levaria junto os pontos e quem
  // seguia — castigo desproporcional a um texto ou a uma imagem.
  artista: [
    { valor: "bio_limpa", rotulo: "Limpar o texto", aviso: "não tem volta" },
    { valor: "foto_removida", rotulo: "Tirar a foto", aviso: "não tem volta" },
    NENHUMA,
  ],
};

export function acoesDe(tipo: AlvoDeDenuncia): OpcaoDeAcao[] {
  return ACOES_POR_ALVO[tipo] ?? [NENHUMA];
}
