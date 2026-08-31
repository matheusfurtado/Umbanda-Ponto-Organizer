/**
 * Migração local → conta, e portabilidade.
 *
 * Aponta para a API Python. As rotas antigas (`/api/account/*`, do api-server
 * Express) não existem mais.
 */

import { baixarAcervo, chamarApi, enviarAcervo } from "@/api/cliente";
import type { AppData } from "@/types";

export interface ResumoImport {
  orixas: number;
  subcategorias: number;
  pontos: number;
  /** Quantos vieram do acervo base. */
  pontosCanonicos: number;
  /** Quantos a própria pessoa escreveu — a conta que ela quer ver preservada. */
  pontosCriados: number;
  favoritos: number;
}

/**
 * Envia o `AppData` deste aparelho para a conta.
 *
 * **Não apaga o localStorage** — nem aqui, nem no servidor. É o mesmo `PUT` do
 * sync normal, e ele é idempotente: os ids da cópia do usuário são derivados
 * do id dele, então mandar duas vezes não duplica nada. Migrar de novo por
 * engano é inofensivo.
 */
export async function importarLocalDataNaConta(dados: AppData): Promise<ResumoImport> {
  return enviarAcervo(dados);
}

/** Remonta o `AppData` da conta, para este aparelho ler os pontos de lá. */
export function baixarDadosDaConta(): Promise<AppData> {
  return baixarAcervo();
}

/**
 * Todos os dados pessoais, para levar embora — LGPD art. 18, V.
 *
 * Num app que revela religião, poder sair levando o próprio acervo é o que
 * impede a conta de virar armadilha.
 */
export function exportarConta(): Promise<unknown> {
  // Pelo cliente compartilhado: é ele que lança `ErroApi`/`ErroRede`, o
  // vocabulário que `mensagemDeErro` sabe traduzir. Com o `Error` cru daqui,
  // uma falha ao exportar chegava à tela como o texto genérico — num fluxo que
  // é direito da pessoa (LGPD art. 18, V) e onde ela precisa saber se o
  // problema foi a rede ou o servidor.
  return chamarApi<unknown>("/auth/exportar");
}
