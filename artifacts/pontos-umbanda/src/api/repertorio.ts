/**
 * Repertórios de gira — a sequência de pontos que será cantada.
 *
 * Recurso do plano pago: o servidor responde 402 sem plano. A tela usa isso
 * para se desenhar, mas **não é ela que autoriza** — a decisão é do servidor,
 * em cada rota.
 */

import { ErroApi, ErroRede } from "./cliente";

export interface ItemRepertorio {
  pontoId: string;
  ordem: number;
  titulo: string | null;
  autor?: string | null;
  videoUrl: string | null;
  videoStatus: "encontrado" | "revisar" | "nao_encontrado" | null;
  // Vêm do servidor junto do item: a linha da gira mostra as mesmas
  // informações da linha do acervo, e buscá-las de novo faria as duas telas
  // divergirem no dia em que uma mudasse.
  videoCanal?: string | null;
  videoDuracaoSeg?: number | null;
}

export interface Repertorio {
  id: string;
  nome: string;
  ordem: number;
  itens: ItemRepertorio[];
}

const BASE = "/api/v1/repertorios";

async function chamar<T>(caminho = "", init?: RequestInit): Promise<T | null> {
  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}${caminho}`, {
      ...init,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch (causa) {
    throw new ErroRede(causa);
  }
  if (resposta.status === 204) return null;
  if (!resposta.ok) {
    let detalhe = resposta.statusText;
    try {
      const corpo = await resposta.json();
      detalhe = Array.isArray(corpo?.detail)
        ? corpo.detail.map((e: { msg: string }) => e.msg).join("; ")
        : (corpo?.detail ?? detalhe);
    } catch {
      /* corpo não-JSON */
    }
    throw new ErroApi(resposta.status, String(detalhe));
  }
  return (await resposta.json()) as T;
}

export function listar(): Promise<Repertorio[]> {
  return chamar<Repertorio[]>() as Promise<Repertorio[]>;
}

export function criar(nome: string): Promise<Repertorio> {
  return chamar<Repertorio>("", {
    method: "POST",
    body: JSON.stringify({ nome, ordem: 0 }),
  }) as Promise<Repertorio>;
}

export function renomear(id: string, nome: string, ordem = 0): Promise<Repertorio> {
  return chamar<Repertorio>(`/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ nome, ordem }),
  }) as Promise<Repertorio>;
}

/**
 * Substitui a sequência inteira.
 *
 * É assim de propósito: reordenar uma gira é arrastar vários de uma vez, e
 * mandar a lista final acerta mais que uma sequência de mover/inserir/remover
 * que precisa ser aplicada na ordem certa. Repetir o mesmo ponto é permitido —
 * abrir e fechar a gira com ele é comum.
 */
export function definirItens(id: string, pontos: string[]): Promise<Repertorio> {
  return chamar<Repertorio>(`/${id}/itens`, {
    method: "PUT",
    body: JSON.stringify({ pontos }),
  }) as Promise<Repertorio>;
}

export async function apagar(id: string): Promise<void> {
  await chamar(`/${id}`, { method: "DELETE" });
}
