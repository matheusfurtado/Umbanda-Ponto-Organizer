// O MESMO cliente do resto do app: é ele que lança `ErroApi`/`ErroRede`,
// o vocabulário que `ehErroDeApi`, `ehErroDeRede` e `mensagemDeErro` leem.
// Havia um `chamar` copiado aqui, lançando `Error` cru com `.status`
// pendurado — e para ele os três respondiam sempre "não é".
import { chamarApi as chamar, ErroApi, ErroRede } from "@/api/cliente";
/**
 * Perfil, seguir e favoritos públicos.
 *
 * O que NÃO existe aqui é a parte importante: não há rota para "quem essa
 * pessoa segue" nem para "quem são os seguidores dela". Num app de Umbanda,
 * essa lista é um mapa da rede religiosa de alguém — o servidor devolve
 * contagem, nunca nomes. Ver `routers/perfil.py`.
 */

const BASE = "/api/v1";


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
  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}/eu/foto`, {
      method: "PUT",
      body: corpo,
      credentials: "same-origin",
    });
  } catch (causa) {
    // Sem isto, cair a rede no meio do upload chegava como `TypeError` — e
    // `ehErroDeRede` respondia "não é rede" para uma falha de rede.
    throw new ErroRede(causa);
  }
  if (!resposta.ok) {
    let detalhe = resposta.statusText;
    try {
      detalhe = (await resposta.json())?.detail ?? detalhe;
    } catch {
      /* corpo não-JSON */
    }
    // `ErroApi`, e não um `Error` com `.status` pendurado: é este o
    // vocabulário que `ehErroDeApi` e `mensagemDeErro` sabem ler. Com o
    // `Error` cru, a foto recusada pelo servidor ("imagem grande demais")
    // chegava à tela como o texto genérico de quem chamou.
    throw new ErroApi(resposta.status, String(detalhe));
  }
  return ((await resposta.json()) as { foto: string }).foto;
}

/** Volta para a marca gerada a partir do apelido. */
export function tirarFoto(): Promise<void> {
  return chamar<void>("/eu/foto", { method: "DELETE" }) as Promise<void>;
}
