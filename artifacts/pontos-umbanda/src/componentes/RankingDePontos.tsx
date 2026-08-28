/**
 * Uma lista de pontos ordenada por um número, no painel.
 *
 * **Pontos, nunca pessoas.** A regra do painel é "diz quantos, nunca quem", e
 * ela vale aqui: uma lista de pontos não é uma lista de gente. O que este
 * componente NÃO pode mostrar nunca é quem clicou — e o servidor nem sabe, que
 * é a garantia de verdade (ver `models/metrica.py`).
 *
 * Cada ranking carrega a ressalva do que ele não mede, como todo número deste
 * painel. Um ranking sem ressalva é um número que finge precisão.
 */

import type { PontoNoRanking } from "@/api/painel";

export function RankingDePontos({
  titulo,
  ressalva,
  linhas,
  unidade,
  erro,
}: {
  titulo: string;
  ressalva: string;
  /** `null` enquanto carrega. */
  linhas: PontoNoRanking[] | null;
  unidade: (n: number) => string;
  erro?: string | null;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {titulo}
      </h2>
      <p className="mb-3 text-xs text-muted-foreground/80">{ressalva}</p>

      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}

      {linhas === null ? (
        <div aria-busy="true" className="space-y-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-11 animate-pulse rounded-lg bg-muted/40" />
          ))}
        </div>
      ) : linhas.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Ainda não há o que contar aqui.
        </p>
      ) : (
        <ol className="space-y-1.5">
          {linhas.map((p, i) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-lg border bg-card/40 px-3 py-2"
            >
              <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-foreground">
                  {p.titulo}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {p.orixa}
                  {p.artista && ` · ${p.artista}`}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {unidade(p.quantos)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
