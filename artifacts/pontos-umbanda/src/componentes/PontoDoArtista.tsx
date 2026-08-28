/**
 * Uma linha da página do artista — que ABRE.
 *
 * Antes ela não abria nada: nem a letra, nem link para o acervo. Clicar no
 * título não fazia coisa nenhuma, e quem tentava concluía que o app tinha
 * travado. Agora a letra abre no lugar, com o mesmo desenho da lista do acervo.
 *
 * ## O botão de ouvir fica FORA do que abre
 *
 * A linha inteira é o gatilho da letra, e o "Ouvir" é uma âncora dentro dela.
 * Sem `stopPropagation`, clicar em ouvir também abriria a letra — e a pessoa
 * voltaria do YouTube para uma tela mexida sem ter pedido.
 */

import { useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { registrarCliqueNoPonto } from "@/api/metricas";
import type { PontoDoArtista as Ponto } from "@/api/artista";

export function PontoDoArtista({
  ponto,
  posicao,
}: {
  ponto: Ponto;
  /** Número na lista dos mais ouvidos. Ausente nas listas por entidade. */
  posicao?: number;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <li className="rounded-lg transition hover:bg-accent/40">
      <div className="flex items-center gap-3 px-2 py-1.5">
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          {posicao !== undefined && (
            <span className="w-4 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {posicao}
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-sm text-foreground">
              {ponto.titulo}
            </span>
            {ponto.videoStatus === "revisar" && (
              /* A nota de confiança viaja SEMPRE com a URL: apresentar um
                 casamento duvidoso como certo é mentir para quem clica. */
              <span className="block text-xs text-muted-foreground">
                casamento a conferir
              </span>
            )}
          </span>
        </button>

        {ponto.cliques > 0 && (
          <span
            className="shrink-0 text-xs tabular-nums text-muted-foreground"
            title={`${ponto.cliques} ${ponto.cliques === 1 ? "vez" : "vezes"} que alguém abriu o vídeo`}
          >
            {ponto.cliques}
          </span>
        )}

        {ponto.videoUrl && (
          <a
            href={ponto.videoUrl}
            onClick={(e) => {
              // Sem isto, ouvir também abre a letra — e a pessoa volta do
              // YouTube para uma tela mexida sem ter pedido.
              e.stopPropagation();
              registrarCliqueNoPonto(ponto.id, "artista");
            }}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`Ouvir ${ponto.titulo} no YouTube`}
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-2"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            Ouvir
          </a>
        )}

        <ChevronDown
          aria-hidden
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
            aberto ? "rotate-180" : ""
          }`}
        />
      </div>

      {aberto && (
        <pre className="whitespace-pre-wrap px-2 pb-3 pl-9 font-sans text-sm leading-relaxed text-foreground/90">
          {/* 47 dos 520 pontos estão com a letra em branco no acervo. Dizer
              isso é melhor que abrir um vazio, que parece defeito da tela. */}
          {ponto.letra?.trim() || "A letra deste ponto ainda não está no acervo."}
        </pre>
      )}
    </li>
  );
}
