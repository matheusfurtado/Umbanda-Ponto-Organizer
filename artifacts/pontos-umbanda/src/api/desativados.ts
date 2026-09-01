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
}

export const pontosDesativados = () =>
  chamarApi<PontoDesativado[]>("/admin/pontos-desativados");
