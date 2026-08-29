// O MESMO cliente do resto do app: é ele que lança `ErroApi`/`ErroRede`,
// o vocabulário que `ehErroDeApi`, `ehErroDeRede` e `mensagemDeErro` leem.
// Havia um `chamar` copiado aqui, lançando `Error` cru com `.status`
// pendurado — e para ele os três respondiam sempre "não é".
import { chamarApi as chamar } from "@/api/cliente";
/**
 * Denunciar conteúdo, e a fila de quem decide.
 *
 * A fila **não diz quem denunciou**, e isso é desenho, não omissão: uma lista
 * de "quem denunciou quem" seria um mapa de desavenças dentro de uma
 * comunidade religiosa. Ver `routers/denuncia.py`.
 */

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
