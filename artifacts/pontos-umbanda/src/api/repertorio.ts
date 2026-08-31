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
  /** A parte da gira: "Chegada", "Louvação". Nulo = ponto solto. */
  secao?: string | null;
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
  /** Visível para outras pessoas. Falso por padrão, sempre. */
  publico?: boolean;
  itens: ItemRepertorio[];
  /** Muda quando a sequência muda. Devolvida no `PUT` para o servidor recusar
   *  gravação sobre mudança que este aparelho não viu. */
  versao?: string;
}

/**
 * Uma gira na LISTA da vitrine. Sem os itens, com a contagem.
 *
 * A lista mandava os itens inteiros de até 60 giras, cada uma com até 500
 * pontos e cada ponto com a letra — 5,6 MB numa rota anônima — e esta tela
 * usava `g.itens.length` e mais nada. O servidor serializava trinta mil itens
 * para o front contar.
 */
export interface GiraNaVitrine {
  id: string;
  nome: string;
  publico: boolean;
  de: string;
  /** Quantos pontos a gira tem. É o que o cartão mostra. */
  pontos: number;
}

/** Uma gira ABERTA por outra pessoa. `de` é o apelido — nunca o e-mail. */
export interface GiraPublica {
  id: string;
  nome: string;
  publico: boolean;
  de: string;
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
export interface ItemEnviado {
  pontoId: string;
  secao?: string | null;
}

export function definirItens(
  id: string,
  itens: ItemEnviado[],
  versao?: string | null,
): Promise<Repertorio> {
  return chamar<Repertorio>(`/${id}/itens`, {
    method: "PUT",
    // Manda no formato NOVO, com seção, e a `versao` só quando existe.
    //
    // Os dois casos têm o mesmo motivo: pode haver envio pendente guardado no
    // aparelho, montado offline por uma versão anterior do app — sem seção, ou
    // sem versão. O servidor aceita os dois formatos de propósito. Recusá-los
    // perderia, sem aviso, a gira que alguém montou.
    body: JSON.stringify(versao ? { itens, versao } : { itens }),
  }) as Promise<Repertorio>;
}

export async function apagar(id: string): Promise<void> {
  await chamar(`/${id}`, { method: "DELETE" });
}


/**
 * Publicar ou despublicar.
 *
 * Manda `publico` EXPLÍCITO junto do nome porque o servidor só mexe na
 * visibilidade quando o campo vem — é o que impede uma renomeação de publicar
 * sem querer.
 */
export function definirVisibilidade(
  r: Repertorio,
  publico: boolean,
): Promise<Repertorio> {
  return chamar<Repertorio>(`/${r.id}`, {
    method: "PATCH",
    body: JSON.stringify({ nome: r.nome, ordem: r.ordem, publico }),
  }) as Promise<Repertorio>;
}

/** A vitrine. Não exige conta: é por aqui que o app circula no boca a boca. */
export async function publicas(): Promise<GiraNaVitrine[]> {
  const r = await fetch(`${BASE}/publicos`);
  if (!r.ok) throw new ErroApi(r.status, "Não consegui carregar as playlists públicas.");
  return (await r.json()) as GiraNaVitrine[];
}

export async function giraPublica(id: string): Promise<GiraPublica> {
  const r = await fetch(`${BASE}/publicos/${id}`);
  if (r.status === 404) throw new ErroApi(404, "Esta playlist não existe ou não é pública.");
  if (!r.ok) throw new ErroApi(r.status, "Não consegui carregar a playlist.");
  return (await r.json()) as GiraPublica;
}
