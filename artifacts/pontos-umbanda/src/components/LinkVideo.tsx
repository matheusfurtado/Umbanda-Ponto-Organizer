/**
 * O link do vídeo do ponto — com a honestidade do casamento embutida.
 *
 * O vídeo foi achado por heurística (`buscar_pontos.py` casando letra com
 * título/descrição do YouTube). Dos 510 pontos com vídeo, **157 têm confiança
 * abaixo do corte**: são palpites plausíveis, não certezas.
 *
 * Mostrar palpite com a mesma cara de acerto é o tipo de mentira que só aparece
 * na hora errada — a pessoa aperta play no meio da gira e toca outra música.
 * Por isso `revisar` vem com aviso explícito e um convite a corrigir.
 *
 * O CANAL vai junto, e não é enfeite: é crédito de quem gravou e é o sinal de
 * procedência que deixa quem vai cantar decidir se confia naquela versão antes
 * de levá-la para a gira.
 */

import { AlertTriangle, Youtube } from "lucide-react";
import type { Ponto } from "@/types";

function duracao(segundos?: number | null): string | null {
  if (!segundos || segundos <= 0) return null;
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function LinkVideo({ ponto }: { ponto: Ponto }) {
  if (!ponto.videoUrl) return null;

  const incerto = ponto.videoStatus === "revisar";
  const tempo = duracao(ponto.videoDuracaoSeg);

  return (
    <div className="px-3.5 pb-3">
      <a
        href={ponto.videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={`flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
          incerto
            ? "bg-amber-400/10 text-amber-300 hover:bg-amber-400/20"
            : "bg-red-500/10 text-red-300 hover:bg-red-500/20"
        }`}
      >
        {incerto ? (
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <Youtube className="h-4 w-4 shrink-0" aria-hidden />
        )}
        <span className="min-w-0 flex-1 text-left">
          <span className="block">
            {incerto ? "Vídeo provável — confira antes de usar" : "Ouvir no YouTube"}
          </span>
          {ponto.videoCanal && (
            <span className="mt-0.5 block truncate text-[11px] font-normal opacity-80">
              {ponto.videoCanal.trim()}
              {tempo && ` · ${tempo}`}
            </span>
          )}
        </span>
      </a>
      {incerto && (
        <p className="mt-1 px-1 text-[11px] leading-snug text-muted-foreground">
          Achamos este vídeo pela letra, mas a correspondência ficou fraca
          {typeof ponto.videoConfianca === "number" &&
            ` (${Math.round(ponto.videoConfianca * 100)}% de confiança)`}
          . Pode não ser este ponto.
        </p>
      )}
    </div>
  );
}
