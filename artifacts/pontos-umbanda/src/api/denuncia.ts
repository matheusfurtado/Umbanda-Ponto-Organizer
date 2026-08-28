/**
 * Denunciar conteúdo, e a fila de quem decide.
 *
 * A fila **não diz quem denunciou**, e isso é desenho, não omissão: uma lista
 * de "quem denunciou quem" seria um mapa de desavenças dentro de uma
 * comunidade religiosa. Ver `routers/denuncia.py`.
 */

const BASE = "/api/v1";

export type AlvoDeDenuncia = "perfil" | "gira" | "ponto" | "artista";
export type MotivoDeDenuncia =
  | "ofensivo"
  | "nao_e_ponto"
  | "imagem_impropria"
  | "engano"
  | "outro";
export type AcaoDeDenuncia =
  | "nenhuma"
  | "foto_removida"
  | "gira_despublicada"
  | "apelido_limpo"
  | "bio_limpa";

export interface DenunciaNaFila {
  id: string;
  alvoTipo: AlvoDeDenuncia;
  alvoId: string;
  motivo: MotivoDeDenuncia;
  detalhe: string | null;
  criadoEm: string;
  /** Quantas denúncias pendentes o mesmo alvo tem. */
  denunciasNoAlvo: number;
  alvoDescricao: string;
  alvoFoto: string | null;
}

async function chamar<T>(caminho: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${BASE}${caminho}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    credentials: "same-origin",
  });
  if (!r.ok) {
    let detalhe = r.statusText;
    try {
      detalhe = (await r.json())?.detail ?? detalhe;
    } catch {
      /* corpo não-JSON */
    }
    const erro = new Error(String(detalhe)) as Error & { status?: number };
    erro.status = r.status;
    throw erro;
  }
  return r.status === 204 ? (undefined as T) : ((await r.json()) as T);
}

export function denunciar(
  alvoTipo: AlvoDeDenuncia,
  alvoId: string,
  motivo: MotivoDeDenuncia,
  detalhe?: string,
): Promise<{ id: string }> {
  return chamar<{ id: string }>("/denuncias", {
    method: "POST",
    body: JSON.stringify({ alvoTipo, alvoId, motivo, detalhe: detalhe || null }),
  });
}

export function filaDeDenuncias(): Promise<DenunciaNaFila[]> {
  return chamar<DenunciaNaFila[]>("/admin/denuncias");
}

export function acolher(id: string, acao: AcaoDeDenuncia, nota?: string): Promise<void> {
  return chamar<void>(`/admin/denuncias/${id}/acolher`, {
    method: "POST",
    body: JSON.stringify({ acao, nota: nota || null }),
  });
}

export function recusarDenuncia(id: string, nota?: string): Promise<void> {
  return chamar<void>(`/admin/denuncias/${id}/recusar`, {
    method: "POST",
    body: JSON.stringify({ nota: nota || null }),
  });
}
