/**
 * Os números do painel de administração.
 *
 * Cada número vem com a **ressalva** do que ele não mede, e a tela mostra essa
 * frase junto. É de propósito: quem lê este painel decide preço, prazo e
 * prioridade, e um número lido como outra coisa custa mais caro que número
 * nenhum. Ver `servicos/metricas.py`.
 */

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

export async function verMetricas(): Promise<GrupoDoPainel[]> {
  const r = await fetch("/api/v1/admin/metricas", { credentials: "same-origin" });
  if (!r.ok) {
    const erro = new Error(
      // 404 aqui não é "sumiu": é a API dizendo que esta conta não é admin,
      // sem confirmar que a área existe. A tela traduz para linguagem de gente.
      r.status === 404
        ? "Esta área é de quem modera o acervo."
        : `O servidor respondeu ${r.status}.`,
    ) as Error & { status?: number };
    erro.status = r.status;
    throw erro;
  }
  return ((await r.json()) as { grupos: GrupoDoPainel[] }).grupos;
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

async function ranking(caminho: string): Promise<PontoNoRanking[]> {
  const r = await fetch(`/api/v1${caminho}`, { credentials: "same-origin" });
  if (!r.ok) {
    const erro = new Error(
      r.status === 404
        ? "Esta área é de quem modera o acervo."
        : `O servidor respondeu ${r.status}.`,
    ) as Error & { status?: number };
    erro.status = r.status;
    throw erro;
  }
  return (await r.json()) as PontoNoRanking[];
}

export const pontosMaisClicados = () =>
  ranking("/admin/metricas/pontos-mais-clicados");

export const pontosEmMaisGiras = () =>
  ranking("/admin/metricas/pontos-em-mais-giras");
