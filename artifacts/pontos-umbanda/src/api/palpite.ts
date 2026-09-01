/**
 * Os outros palpites de vídeo de um ponto.
 *
 * O casamento com o YouTube guarda os candidatos que não venceram, e o modelo
 * do servidor diz desde sempre que eles são "o que a tela de correção oferece".
 * A tela não existia: 1.538 candidatas paradas, e a fila de casamentos só sabe
 * dizer sim ou não ao palpite que a heurística escolheu — recusar deixa o ponto
 * sem link mesmo quando o vídeo certo está uma posição abaixo.
 */

import { chamarApi } from "@/api/cliente";

export interface Palpite {
  id: number;
  videoId: string;
  titulo: string | null;
  canal: string | null;
  /** A nota da heurística: ordena, e nota baixa em TODAS avisa que nenhuma serve. */
  nota: number | null;
  url: string;
}

export interface PontoComPalpites {
  id: string;
  titulo: string;
  letra: string;
  orixa: string;
  subcategoria: string;
  /** `true` = está no app. Um link a mais ali é ouvido hoje. */
  noApp: boolean;
  palpites: Palpite[];
}

export interface QuantosPalpites {
  total: number;
  no_app: number;
}

export interface PalpiteEscolhido {
  pontoId: string;
  artistaId: string | null;
  /** `true` quando o canal era de artista curado e o ponto voltou ao app. */
  voltouAoApp: boolean;
}

/** Quantos pontos a rota manda por vez. */
export const POR_VEZ = 20;

export function filaDePalpites(desde = 0, ponto?: string) {
  const q = new URLSearchParams({ desde: String(desde) });
  if (ponto) q.set("ponto", ponto);
  return chamarApi<PontoComPalpites[]>(`/admin/palpites?${q.toString()}`);
}

export const quantosPalpites = () =>
  chamarApi<QuantosPalpites>("/admin/palpites/quantos");

export const escolherPalpite = (id: number) =>
  chamarApi<PalpiteEscolhido>(`/admin/palpites/${id}/escolher`, { method: "POST" });
