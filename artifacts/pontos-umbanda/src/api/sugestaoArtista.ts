/**
 * "Falta fulano aqui" — a sugestão da comunidade.
 *
 * Não confundir com `pedidoArtista.ts`: lá é *"este canal é meu"*, com código
 * de prova e dono. Aqui é alguém apontando um canal de que gosta, sem
 * reivindicar nada — e aprovar não dá poder nenhum a quem sugeriu.
 */

import { chamarApi } from "@/api/cliente";

export interface Sugestao {
  id: string;
  status: string;
  nomeDoCanal: string;
  canalUrl: string | null;
  /** A página que a sugestão abriu, quando aprovada. */
  artistaId: string | null;
  motivo: string | null;
  criadoEm: string;
}

/** O que o moderador vê. Diz QUEM sugeriu pelo apelido — nunca o e-mail. */
export interface SugestaoNaFila extends Sugestao {
  apelido: string | null;
  recado: string | null;
}

export function sugerirArtista(dados: {
  nomeDoCanal: string;
  canalUrl?: string | null;
  recado?: string | null;
}): Promise<Sugestao> {
  return chamarApi<Sugestao>("/artistas/sugestoes", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

/** As minhas — sem isto, sugerir é jogar num buraco. */
export const minhasSugestoes = () =>
  chamarApi<Sugestao[]>("/eu/sugestoes-de-artista");

export const filaDeSugestoes = () =>
  chamarApi<SugestaoNaFila[]>("/admin/sugestoes-de-artista");

export const aprovarSugestao = (id: string) =>
  chamarApi<void>(`/admin/sugestoes-de-artista/${encodeURIComponent(id)}/aprovar`, {
    method: "POST",
  });

export const recusarSugestao = (id: string, motivo: string) =>
  chamarApi<void>(`/admin/sugestoes-de-artista/${encodeURIComponent(id)}/recusar`, {
    method: "POST",
    body: JSON.stringify({ motivo }),
  });
