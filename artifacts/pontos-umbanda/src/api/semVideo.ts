/**
 * Os pontos que estão no app e ninguém consegue ouvir.
 *
 * Recusar um casamento em `/moderacao/casamentos` marca o ponto como
 * `nao_encontrado`: a letra fica, o link some. Até 02/09 esse ponto sumia de
 * vista — não estava em fila nenhuma, e só se topava com ele no acervo.
 */

import { chamarApi } from "@/api/cliente";

export interface PontoSemVideo {
  id: string;
  titulo: string;
  letra: string;
  orixa: string;
  subcategoria: string;
  /** Quantas indicações já chegaram. Zero é o convite mais forte da página. */
  indicacoes: number;
}

export interface SemVideoPorOrixa {
  orixa: string;
  pontos: PontoSemVideo[];
}

export interface RecadoDaIndicacao {
  videoId: string;
  recado: string;
}

export const pontosSemVideo = () =>
  chamarApi<SemVideoPorOrixa[]>("/pontos-sem-video");

export const indicarVideo = (pontoId: string, url: string) =>
  chamarApi<RecadoDaIndicacao>(
    `/pontos/${encodeURIComponent(pontoId)}/indicar-video`,
    { method: "POST", body: JSON.stringify({ url }) },
  );
