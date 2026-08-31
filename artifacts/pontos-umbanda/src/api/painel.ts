/**
 * Os números do painel de administração.
 *
 * Cada número vem com a **ressalva** do que ele não mede, e a tela mostra essa
 * frase junto. É de propósito: quem lê este painel decide preço, prazo e
 * prioridade, e um número lido como outra coisa custa mais caro que número
 * nenhum. Ver `servicos/metricas.py`.
 *
 * ## O erro fala o vocabulário do app
 *
 * Estas duas funções montavam `new Error(...)` com um `.status` pendurado à
 * mão. Para esse formato, `ehErroDeApi` e `ehErroDeRede` respondem **false** —
 * e desde que as telas passaram a usar `mensagemDeErro`, o texto cuidadoso
 * daqui ("Esta área é de quem modera o acervo.") virava o padrão genérico de
 * quem chamou. Quem não é admin lia "Não consegui carregar." e ficava sem
 * saber que a resposta era sobre permissão, não sobre falha.
 *
 * O `chamarApi` de `api/cliente.ts` não serve aqui porque a mensagem do 404 é
 * ESCRITA no cliente, não vem do servidor — o 404 é a API dizendo "você não é
 * admin" sem confirmar que a área existe. Então o que se compartilha é o
 * vocabulário (`ErroApi`/`ErroRede`), não a função.
 */

import { ErroApi, ErroRede } from "@/api/cliente";

export interface NumeroDoPainel {
  chave: string;
  rotulo: string;
  valor: number;
  /** O que este número NÃO mede. Vazio quando não há ressalva. */
  ressalva: string;
}

export interface GrupoDoPainel {
  chave: string;
  titulo: string;
  numeros: NumeroDoPainel[];
}

/**
 * A resposta ruim, no vocabulário que as telas sabem ler.
 *
 * Estava copiada nas duas funções abaixo, com o mesmo texto e o mesmo defeito.
 * Regra que vale em mais de um lugar, reimplementada em cada um, diverge — e
 * aqui já tinha divergido do resto do app.
 */
function recusa(status: number): ErroApi {
  return new ErroApi(
    status,
    // 404 aqui não é "sumiu": é a API dizendo que esta conta não é admin, sem
    // confirmar que a área existe. A frase é escrita aqui porque o servidor,
    // de propósito, não manda uma.
    status === 404
      ? "Esta área é de quem modera o acervo."
      : `O servidor respondeu ${status}.`,
  );
}

async function pedir<T>(caminho: string): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`/api/v1${caminho}`, { credentials: "same-origin" });
  } catch (causa) {
    // Sem isto, cair a rede chega como `TypeError` e `ehErroDeRede` responde
    // "não é rede" para uma falha de rede — e a tela culpa a permissão.
    throw new ErroRede(causa);
  }
  if (!r.ok) throw recusa(r.status);
  return (await r.json()) as T;
}

export async function verMetricas(): Promise<GrupoDoPainel[]> {
  return (await pedir<{ grupos: GrupoDoPainel[] }>("/admin/metricas")).grupos;
}

/**
 * Uma linha de ranking. **Ponto, nunca pessoa** — a regra do painel é "diz
 * quantos, nunca quem", e ela vale aqui igual. Uma lista de pontos não é uma
 * lista de gente.
 */
export interface PontoNoRanking {
  id: string;
  titulo: string;
  orixa: string | null;
  /** Quem gravou o vídeo casado, quando o canal virou artista. */
  artista: string | null;
  quantos: number;
}

export const pontosMaisClicados = () =>
  pedir<PontoNoRanking[]>("/admin/metricas/pontos-mais-clicados");

export const pontosEmMaisGiras = () =>
  pedir<PontoNoRanking[]>("/admin/metricas/pontos-em-mais-giras");
