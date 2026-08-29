/**
 * O acervo crescendo pela comunidade.
 *
 * Enviar ponto e sugerir autor exigem CONTA, não plano: o acervo cresce por
 * quem canta, e cobrar para contribuir afastaria justamente quem tem ponto
 * para dar.
 *
 * Nada aqui muda o acervo de todos direto — tudo nasce pendente e espera um
 * admin. Ver `routers/submissao.py` para o porquê.
 */

// O MESMO cliente do resto do app: é ele que lança `ErroApi`/`ErroRede`,
// o vocabulário que `ehErroDeApi`, `ehErroDeRede` e `mensagemDeErro` leem.
// Havia um `chamar` copiado aqui, lançando `Error` cru com `.status`
// pendurado — e para ele os três respondiam sempre "não é".
import { chamarApi as chamar } from "@/api/cliente";
import { ehErroDeApi } from "./cliente";

export type TipoSubmissao = "ponto" | "autor";
export type StatusSubmissao = "pendente" | "aprovada" | "recusada";

export interface Submissao {
  id: string;
  tipo: TipoSubmissao;
  status: StatusSubmissao;
  titulo: string | null;
  letra: string | null;
  autor: string | null;
  orixaId: string | null;
  pontoId: string | null;
  motivo: string | null;
  criadoEm: string;
  revisadoEm: string | null;
}

export interface SubmissaoNaFila extends Submissao {
  enviadoPor: string;
  tituloDoPonto: string | null;
  autorAtual: string | null;
}


export function enviarPonto(dados: {
  titulo: string;
  letra: string;
  orixaId: string;
  autor?: string | null;
  /** Link do YouTube, se quem manda souber qual é a gravação. */
  videoUrl?: string | null;
  /**
   * "Posso mandar esta letra." Obrigatório no servidor.
   *
   * Não é promessa de que a letra é livre — é o registro de quem afirmou o
   * quê, que é o que falta no dia em que alguém reclama. Vai sem default de
   * propósito: um `false` implícito aqui deixaria a tela mandar sem declarar.
   */
  declaroDireito: boolean;
}): Promise<Submissao> {
  return chamar<Submissao>("/submissoes/ponto", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

export function sugerirAutor(pontoId: string, autor: string): Promise<Submissao> {
  return chamar<Submissao>("/submissoes/autor", {
    method: "POST",
    body: JSON.stringify({ pontoId, autor }),
  });
}

export function meusEnvios(): Promise<Submissao[]> {
  return chamar<Submissao[]>("/submissoes/minhas");
}

export function filaDeModeracao(): Promise<SubmissaoNaFila[]> {
  return chamar<SubmissaoNaFila[]>("/admin/submissoes");
}

export function aprovar(id: string, subcategoriaId?: string): Promise<Submissao> {
  return chamar<Submissao>(`/admin/submissoes/${id}/aprovar`, {
    method: "POST",
    body: JSON.stringify({ subcategoriaId: subcategoriaId ?? null }),
  });
}

export function recusar(id: string, motivo: string): Promise<Submissao> {
  return chamar<Submissao>(`/admin/submissoes/${id}/recusar`, {
    method: "POST",
    body: JSON.stringify({ motivo }),
  });
}

export { ehErroDeApi };
