/**
 * As playlists da comunidade, na tela inicial — com o botão de guardar.
 *
 * ## O caminho que ele descreveu
 *
 * *"quero acessar todas no início, organizar acervo nasce vazio, e do início
 * acesso playlist e salvo elas pra aparecer em organizar acervo"* (02/09).
 *
 * A vitrine de playlists existia só atrás de um item de menu (`/giras-publicas`),
 * e guardar só era possível de dentro de cada uma. Os dois passos do caminho que
 * ele descreve — achar e guardar — estavam a dois cliques e um menu de
 * distância do lugar onde as pessoas chegam.
 *
 * ## Prateleira horizontal, e poucas
 *
 * Mesma decisão da estante de artistas, e pelo mesmo motivo: a tela inicial é
 * um índice, e o que a maioria vem buscar é o orixá. Uma grade que cresce
 * empurraria isso para baixo da dobra.
 */

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ListMusic } from "lucide-react";
import { publicas, type GiraNaVitrine } from "@/api/repertorio";
import { BotaoGuardar } from "@/componentes/BotaoGuardar";

/** Quantas cabem sem empurrar os orixás para fora da tela. */
const NA_PRATELEIRA = 8;

export function PlaylistsEmDestaque() {
  const [giras, setGiras] = useState<GiraNaVitrine[] | null>(null);

  useEffect(() => {
    publicas()
      .then((lista) => setGiras(lista.slice(0, NA_PRATELEIRA)))
      // Silêncio de propósito: a vitrine de playlists é um convite, não o
      // conteúdo da tela. Um erro aqui não pode empurrar os orixás para baixo
      // de uma mensagem vermelha.
      .catch(() => setGiras([]));
  }, []);

  if (giras !== null && giras.length === 0) return null;

  return (
    <section aria-label="Playlists da comunidade" className="mt-8">
      <div className="mb-3 flex items-center justify-between px-2">
        <h2 className="text-lg font-bold text-foreground">
          Playlists da comunidade
        </h2>
        <Link
          href="/giras-publicas"
          className="text-sm font-medium text-primary underline underline-offset-2"
        >
          Ver mais
        </Link>
      </div>

      {giras === null ? (
        <div aria-busy="true" className="flex gap-3 overflow-x-auto px-2 pb-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 w-56 shrink-0 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : (
        <ul className="flex gap-3 overflow-x-auto px-2 pb-2">
          {giras.map((g) => (
            <li
              key={g.id}
              className="flex w-56 shrink-0 flex-col justify-between rounded-xl border bg-card/40 p-3"
            >
              <Link href={`/gira/${g.id}`} className="min-w-0">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ListMusic className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {g.pontos} {g.pontos === 1 ? "ponto" : "pontos"}
                </span>
                <span className="mt-1 block truncate font-semibold text-foreground">
                  {g.nome}
                </span>
                {g.de && (
                  <span className="block truncate text-xs text-muted-foreground">
                    de {g.de}
                  </span>
                )}
              </Link>
              {/* GUARDAR daqui, que é o passo que faltava: achar e guardar no
                  mesmo lugar. */}
              <div className="mt-2">
                <BotaoGuardar alvoTipo="playlist" alvoId={g.id} nome={g.nome} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
