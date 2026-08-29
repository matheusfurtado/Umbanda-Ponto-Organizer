// O MESMO cliente do resto do app: é ele que lança `ErroApi`/`ErroRede`,
// o vocabulário que `ehErroDeApi`, `ehErroDeRede` e `mensagemDeErro` leem.
// Havia um `chamar` copiado aqui, lançando `Error` cru com `.status`
// pendurado — e para ele os três respondiam sempre "não é".
import { chamarApi as chamar } from "@/api/cliente";
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
