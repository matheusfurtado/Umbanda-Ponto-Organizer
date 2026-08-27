/**
 * Perfil, seguir e favoritos públicos.
 *
 * O que NÃO existe aqui é a parte importante: não há rota para "quem essa
 * pessoa segue" nem para "quem são os seguidores dela". Num app de Umbanda,
 * essa lista é um mapa da rede religiosa de alguém — o servidor devolve
 * contagem, nunca nomes. Ver `routers/perfil.py`.
 */

const BASE = "/api/v1";

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
      /* corpo não-JSON: fica o statusText */
    }
    const erro = new Error(String(detalhe)) as Error & { status?: number };
    erro.status = r.status;
    throw erro;
  }
  return r.status === 204 ? (undefined as T) : ((await r.json()) as T);
}

export interface GiraDoPerfil {
  id: string;
  nome: string;
  pontos: number;
}

export interface FavoritoDoPerfil {
  id: string;
  titulo: string;
  orixa: string | null;
}

export interface Perfil {
  apelido: string;
  seguidores: number;
  seguindo: number;
  euSigo: boolean;
  souEu: boolean;
  giras: GiraDoPerfil[];
  /** `null` = a pessoa não abriu os favoritos. Diferente de lista vazia. */
  favoritos: FavoritoDoPerfil[] | null;
}

export interface PerfilResumo {
  apelido: string;
  giras: number;
  euSigo: boolean;
}

export function verPerfil(apelido: string): Promise<Perfil> {
  return chamar<Perfil>(`/perfis/${encodeURIComponent(apelido)}`);
}

export function seguir(apelido: string): Promise<void> {
  return chamar<void>(`/perfis/${encodeURIComponent(apelido)}/seguir`, {
    method: "PUT",
  });
}

export function deixarDeSeguir(apelido: string): Promise<void> {
  return chamar<void>(`/perfis/${encodeURIComponent(apelido)}/seguir`, {
    method: "DELETE",
  });
}

export function quemEuSigo(): Promise<PerfilResumo[]> {
  return chamar<PerfilResumo[]>("/eu/seguindo");
}

export function definirFavoritosPublicos(publicos: boolean): Promise<void> {
  return chamar<void>("/eu/favoritos-publicos", {
    method: "PATCH",
    body: JSON.stringify({ publicos }),
  });
}
