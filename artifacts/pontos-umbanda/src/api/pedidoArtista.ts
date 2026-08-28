/**
 * "Este canal é meu": o pedido de perfil de artista.
 *
 * A prova é **código no canal**: o app dá um código, a pessoa cola na descrição
 * do canal ou de um vídeo, e um moderador abre o link e vê. O código fica
 * público lá — ele não protege por ser secreto, protege por só poder ser POSTO
 * ali por quem tem a senha do canal.
 *
 * Sem isso qualquer pessoa reivindicaria o canal de qualquer outra, e quem
 * ficasse com a página de um artista de verdade decidiria o que aparece no
 * perfil dele, com o nome dele em cima.
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
      const corpo = await r.json();
      // O 422 do Pydantic vem como lista; o nosso vem como frase. A tela
      // precisa de frase — mostrar `[object Object]` é pior que não mostrar.
      detalhe = Array.isArray(corpo?.detail)
        ? (corpo.detail[0]?.msg ?? detalhe)
        : (corpo?.detail ?? detalhe);
    } catch {
      /* corpo não-JSON: fica o statusText */
    }
    const erro = new Error(String(detalhe)) as Error & { status?: number };
    erro.status = r.status;
    throw erro;
  }
  return r.status === 204 ? (undefined as T) : ((await r.json()) as T);
}

export type StatusDoPedido = "pendente" | "aprovado" | "recusado";

export interface PedidoDeArtista {
  id: string;
  status: StatusDoPedido;
  nomeDoCanal: string;
  canalUrl: string;
  /** O que colar na descrição do canal. */
  codigo: string;
  artistaId: string | null;
  motivo: string | null;
  criadoEm: string;
}

export interface PedidoNaFila extends PedidoDeArtista {
  apelido: string | null;
  recado: string | null;
}

export interface NovoPedido {
  /** Reivindicar um que já existe. Exclusivo com `nomeDoCanal`. */
  artistaId?: string;
  /** Pedir página para um canal que ainda não está no acervo. */
  nomeDoCanal?: string;
  canalUrl: string;
  recado?: string;
}

export const pedirPerfilDeArtista = (corpo: NovoPedido) =>
  chamar<PedidoDeArtista>("/artistas/pedidos", {
    method: "POST",
    body: JSON.stringify(corpo),
  });

export const meusPedidosDeArtista = () =>
  chamar<PedidoDeArtista[]>("/eu/pedidos-de-artista");

export const filaDePedidosDeArtista = () =>
  chamar<PedidoNaFila[]>("/admin/pedidos-de-artista");

export const aprovarPedidoDeArtista = (id: string) =>
  chamar<void>(`/admin/pedidos-de-artista/${encodeURIComponent(id)}/aprovar`, {
    method: "POST",
  });

export const recusarPedidoDeArtista = (id: string, motivo: string) =>
  chamar<void>(`/admin/pedidos-de-artista/${encodeURIComponent(id)}/recusar`, {
    method: "POST",
    body: JSON.stringify({ motivo }),
  });
