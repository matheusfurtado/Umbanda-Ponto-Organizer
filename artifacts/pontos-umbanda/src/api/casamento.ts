/**
 * A fila de conferir casamento ponto × vídeo.
 *
 * O casamento com o YouTube é heurístico. Até 01/09 o app mostrava o `revisar`
 * assim mesmo, com o aviso "confira antes de usar" — e quem está no meio da
 * gira aperta o play e ouve outra coisa. Agora ele sai do app e vira fila.
 */

import { chamarApi } from "@/api/cliente";

export interface CasamentoNaFila {
  /** `video.id` — é o que as rotas de decisão recebem. */
  id: number;
  pontoId: string;
  titulo: string;
  /** O começo da letra: é o primeiro verso que decide. */
  letra: string;
  orixa: string;
  subcategoria: string;
  artistaId: string | null;
  artistaNome: string | null;
  videoId: string | null;
  url: string | null;
  videoTitulo: string | null;
  canal: string | null;
  confianca: number | null;
  /** `true` = o acervo mostraria esta. Recusar tira o link do ponto. */
  principal: boolean;
}

export interface QuantosFaltam {
  total: number;
  /** Os que custam link ao acervo enquanto esperam. */
  principais: number;
}

/**
 * Um pedaço da fila, a partir de `desde`.
 *
 * Deslocamento e não número de página: cada decisão tira a linha do `revisar`,
 * então a fila ENCOLHE enquanto se trabalha nela. Com páginas, quem confere 10
 * itens e pede a página seguinte pula 10 que nunca viu. A tela passa
 * `desde = quantos ainda estão nela`, que é quantos do topo já viu.
 */
export const filaDeCasamentos = (desde = 0) =>
  chamarApi<CasamentoNaFila[]>(`/admin/casamentos?desde=${desde}`);

/** Quantos a rota manda por vez — a tela usa para saber se ainda há mais. */
export const POR_VEZ = 50;

export const quantosCasamentos = () =>
  chamarApi<QuantosFaltam>("/admin/casamentos/quantos");

export const confirmarCasamento = (id: number) =>
  chamarApi<void>(`/admin/casamentos/${id}/confirmar`, { method: "POST" });

export const recusarCasamento = (id: number) =>
  chamarApi<void>(`/admin/casamentos/${id}/recusar`, { method: "POST" });
