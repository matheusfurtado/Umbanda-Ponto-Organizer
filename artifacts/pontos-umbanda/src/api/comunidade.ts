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

async function chamar<T>(caminho: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`/api/v1${caminho}`, {
    headers: init?.body ? { "content-type": "application/json" } : undefined,
    ...init,
  });
  if (!r.ok) {
    let detalhe = "";
    try {
      detalhe = (await r.json())?.detail ?? "";
    } catch {
      /* resposta sem corpo JSON: fica a mensagem genérica */
    }
    throw new Error(detalhe || `Falha (${r.status})`);
  }
  return r.status === 204 ? (undefined as T) : ((await r.json()) as T);
}

export function enviarPonto(dados: {
  titulo: string;
  letra: string;
  orixaId: string;
  autor?: string | null;
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
