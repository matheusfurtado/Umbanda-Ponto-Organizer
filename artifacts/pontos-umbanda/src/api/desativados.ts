/**
 * O que saiu do app por não ter gravação de artista.
 *
 * O acervo virou catálogo por artista — toda lista de orixá e de linha diz de
 * quem é a versão —, e o ponto sem nenhuma gravação aparecia ali como linha
 * muda. Ele sai "por hora" e vem parar nesta lista.
 *
 * ## A forma crua é uma INTERFACE, e não `Record<string, unknown>`
 *
 * A cerca de vocabulário do lado Python (`test_vocabulario_compartilhado`)
 * confere que todo campo lido de uma resposta existe no schema do servidor, e
 * faz isso lendo as `interface` daqui. Tipada como saco de `unknown`, os campos
 * ficariam invisíveis para ela: o servidor podia parar de mandar `candidatas` e
 * nada acusaria.
 */

import { chamarApi } from "@/api/cliente";

export interface PontoDesativado {
  id: string;
  titulo: string;
  /** O começo da letra: título de ponto se repete muito entre orixás. */
  letra: string;
  orixa: string;
  subcategoria: string;
  /** Palpites que o colhedor achou. Zero = nem palpite existe. */
  candidatas: number;
  /** Tem vídeo principal, só não de canal curado. */
  temVideo: boolean;
  /** De quem é a gravação, quando é de artista curado. */
  artistaNome: string | null;
  /** O vídeo, para conferir antes de aprovar. */
  videoUrl: string | null;
  /** `true` = veio do YouTube (letra extraída da descrição de um vídeo). */
  doYoutube: boolean;
}

/** Quantos há em cada pilha, e de quem são as trazidas do YouTube. */
export interface ArtistaComPendentes {
  id: string;
  nome: string;
  quantos: number;
}

export interface QuantosForaDoApp {
  total: number;
  /** Trazidos do YouTube: têm letra, vídeo e artista, e esperam alguém olhar. */
  youtube: number;
  /** Saíram do acervo por não ter gravação de artista conferida. */
  acervo: number;
  artistas: ArtistaComPendentes[];
}

export interface FiltroForaDoApp {
  desde?: number;
  origem?: "youtube" | "acervo";
  artista?: string;
  busca?: string;
}

/** Quantos a rota manda por vez — a tela usa para saber se ainda há mais. */
export const POR_VEZ = 50;

export function pontosDesativados(filtro: FiltroForaDoApp = {}) {
  const q = new URLSearchParams();
  if (filtro.desde) q.set("desde", String(filtro.desde));
  if (filtro.origem) q.set("origem", filtro.origem);
  if (filtro.artista) q.set("artista", filtro.artista);
  if (filtro.busca?.trim()) q.set("busca", filtro.busca.trim());
  // Sempre com `?`, mesmo vazio: a cerca `test_front_chama_rota_que_existe`
  // lê estes caminhos por texto, e o ternário com crase dentro de crase a
  // cegava — ela relatava a rota como inexistente. Caminho legível de fora vale
  // mais que a query string mais bonita.
  return chamarApi<PontoDesativado[]>(`/admin/pontos-desativados?${q.toString()}`);
}

export const quantosForaDoApp = () =>
  chamarApi<QuantosForaDoApp>("/admin/pontos-desativados/quantos");

export const descartarPonto = (id: string) =>
  chamarApi<void>(`/admin/pontos/${encodeURIComponent(id)}/descartar`, {
    method: "POST",
  });

/** A mesma decisão para vários. Devolve quantos foram — pode ser menos. */
export const acaoEmLote = (ids: string[], acao: "reativar" | "descartar") =>
  chamarApi<{ feitos: number; pedidos: number }>("/admin/pontos/em-lote", {
    method: "POST",
    body: JSON.stringify({ ids, acao }),
  });

export const reativarPonto = (id: string) =>
  chamarApi<void>(`/admin/pontos/${encodeURIComponent(id)}/reativar`, {
    method: "POST",
  });
