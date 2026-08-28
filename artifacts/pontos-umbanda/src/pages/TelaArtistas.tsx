/**
 * Todos os artistas do acervo — a porta de entrada para as páginas deles.
 *
 * Ordenado por quantidade de pontos, porque é o que aproxima de "quem mais
 * aparece neste acervo". Não é ranking de qualidade e a tela não sugere que
 * seja.
 */

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Mic2, Music2 } from "lucide-react";
import { listarArtistas, type ArtistaResumo } from "@/api/artista";

export function TelaArtistas() {
  const [artistas, setArtistas] = useState<ArtistaResumo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarArtistas()
      .then(setArtistas)
      .catch((e) => setErro(e instanceof Error ? e.message : "Falha ao carregar."));
  }, []);

  return (
    <div className="max-w-3xl px-4 pb-24 pt-5 sm:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
        <Mic2 className="h-6 w-6 text-primary" aria-hidden /> Artistas
      </h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Quem canta os pontos do acervo. Siga para ter na sua biblioteca.
      </p>

      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}

      {artistas === null ? (
        <div aria-busy="true" className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : artistas.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum artista no acervo ainda.
        </p>
      ) : (
        <div className="space-y-2">
          {artistas.map((a) => (
            <Link
              key={a.id}
              href={`/artista/${encodeURIComponent(a.id)}`}
              className="flex items-center justify-between gap-3 rounded-xl border bg-card/40 p-3 transition hover:border-primary/40"
            >
              <span className="min-w-0 font-semibold text-foreground">
                <span className="block truncate">{a.nome}</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
                  <Music2 className="h-3.5 w-3.5" aria-hidden />
                  {a.pontos} {a.pontos === 1 ? "ponto" : "pontos"}
                  {a.seguidores > 0 && <> · {a.seguidores} seguindo</>}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
