/**
 * A estante — o que a pessoa guardou para ter à mão.
 *
 * ADR 0009: a `/organizar` nasce vazia e vai enchendo com o que se guarda.
 * Guardar é REFERÊNCIA, não cópia — ninguém copia o artista que segue —, então
 * o nome e a contagem vêm resolvidos do servidor a cada leitura, e a estante
 * nunca fica velha.
 */

import { chamarApi } from "@/api/cliente";

export type AlvoGuardado = "orixa" | "playlist";

export interface ItemGuardado {
  alvoTipo: AlvoGuardado;
  alvoId: string;
  nome: string;
  /** Quantos pontos há ali AGORA. Zero é informação, não erro. */
  pontos: number;
  /** Quem montou, quando é playlist de outra pessoa. */
  de: string | null;
  ordem: number;
}

export const minhaBiblioteca = () =>
  chamarApi<ItemGuardado[]>("/eu/biblioteca");

/** Idempotente: clicar duas vezes é o caso normal, não um erro. */
export const guardarNaBiblioteca = (alvoTipo: AlvoGuardado, alvoId: string) =>
  chamarApi<{ guardado: boolean }>("/eu/biblioteca", {
    method: "PUT",
    body: JSON.stringify({ alvoTipo, alvoId }),
  });

export const tirarDaBiblioteca = (alvoTipo: AlvoGuardado, alvoId: string) =>
  chamarApi<void>(
    `/eu/biblioteca/${alvoTipo}/${encodeURIComponent(alvoId)}`,
    { method: "DELETE" },
  );
