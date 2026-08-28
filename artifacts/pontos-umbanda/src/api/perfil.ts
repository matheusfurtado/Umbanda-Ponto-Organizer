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
  /** Endereço da foto, com a versão junto. `null` = usa a marca gerada. */
  foto: string | null;
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
  foto: string | null;
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

export interface GiraDeQuemSigo {
  id: string;
  nome: string;
  pontos: number;
  de: string;
}

export function girasDeQuemSigo(): Promise<GiraDeQuemSigo[]> {
  return chamar<GiraDeQuemSigo[]>("/eu/giras-de-quem-sigo");
}



/**
 * Põe (ou troca) a foto do perfil.
 *
 * Vai como `multipart`, e de propósito NÃO passa pelo `chamar` de JSON: o
 * navegador precisa montar o `Content-Type` com a fronteira do formulário, e
 * fixá-lo à mão quebra o upload de um jeito que só aparece no servidor.
 */
export async function enviarFoto(arquivo: File): Promise<string> {
  const corpo = new FormData();
  corpo.append("arquivo", arquivo);
  const resposta = await fetch(`${BASE}/eu/foto`, {
    method: "PUT",
    body: corpo,
    credentials: "same-origin",
  });
  if (!resposta.ok) {
    let detalhe = resposta.statusText;
    try {
      detalhe = (await resposta.json())?.detail ?? detalhe;
    } catch {
      /* corpo não-JSON */
    }
    // Mesma forma de erro do `chamar` acima: quem trata já sabe ler `status`.
    const erro = new Error(String(detalhe)) as Error & { status?: number };
    erro.status = resposta.status;
    throw erro;
  }
  return ((await resposta.json()) as { foto: string }).foto;
}

/** Volta para a marca gerada a partir do apelido. */
export function tirarFoto(): Promise<void> {
  return chamar<void>("/eu/foto", { method: "DELETE" }) as Promise<void>;
}
