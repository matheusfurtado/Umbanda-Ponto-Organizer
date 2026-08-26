import { useState } from "react";
import { ChevronDown, Star, Youtube, AlertTriangle, Plus } from "lucide-react";
import { useApp } from "@/context";
import { destacar } from "@/lib/destacar";
import type { Ponto } from "@/types";

/**
 * Um ponto como LINHA de lista — no formato de faixa.
 *
 * ## O que mudou e por quê
 *
 * Antes o ponto era um cartão que só mostrava o título; letra e vídeo só
 * apareciam depois de expandir. O dono do produto abriu o app e perguntou onde
 * estava o link do YouTube — ele existia, escondido atrás de um clique que
 * ninguém adivinha.
 *
 * Agora a linha carrega o que se usa: título, autor, canal, duração e o botão
 * do vídeo **visível**. Expandir passou a ser só para ler a letra inteira.
 *
 * ## A honestidade do casamento continua
 *
 * Dos 510 pontos com vídeo, 157 são palpite (`revisar`). Palpite com a mesma
 * cara de acerto é o tipo de mentira que aparece na pior hora: a pessoa aperta
 * play no meio da gira e toca outra música. Por isso o ícone e a cor mudam.
 */
export function LinhaPonto({
  ponto,
  indice,
  busca = "",
  onAdicionar,
}: {
  ponto: Ponto;
  indice: number;
  busca?: string;
  onAdicionar?: (p: Ponto) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const { toggleFavorito } = useApp();

  const incerto = ponto.videoStatus === "revisar";
  const tempo = ponto.videoDuracaoSeg
    ? `${Math.floor(ponto.videoDuracaoSeg / 60)}:${String(ponto.videoDuracaoSeg % 60).padStart(2, "0")}`
    : null;

  return (
    <div className="group rounded-lg transition hover:bg-accent/40">
      <div className="flex items-center gap-3 px-2 py-2 sm:px-3">
        <span className="w-6 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
          {indice}
        </span>

        <button
          onClick={() => setAberto((v) => !v)}
          className="min-w-0 flex-1 text-left"
          aria-expanded={aberto}
        >
          <span className="block truncate text-sm font-medium text-foreground">
            {destacar(ponto.titulo, busca)}
          </span>
          {/* Só quando há o que dizer. Um "—" em 520 linhas é ruído em toda
              a lista, e sugere lacuna a preencher onde não há: no plano
              grátis o canal simplesmente não vem, e a maior parte do acervo
              não tem autoria conhecida. */}
          {(ponto.autor || ponto.videoCanal?.trim()) && (
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {ponto.autor || ponto.videoCanal?.trim()}
            </span>
          )}
        </button>

        {tempo && (
          <span className="hidden w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground sm:block">
            {tempo}
          </span>
        )}

        <div className="flex shrink-0 items-center gap-1">
          {onAdicionar && (
            <button
              onClick={() => onAdicionar(ponto)}
              title="Adicionar a um repertório"
              aria-label={`Adicionar ${ponto.titulo} a um repertório`}
              className="rounded-md p-2 text-muted-foreground opacity-0 transition hover:bg-accent hover:text-foreground focus:opacity-100 group-hover:opacity-100"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={() => toggleFavorito(ponto.id)}
            title={ponto.favorito ? "Desfavoritar" : "Favoritar"}
            aria-label={ponto.favorito ? "Desfavoritar" : "Favoritar"}
            className={`rounded-md p-2 transition hover:bg-accent ${
              ponto.favorito
                ? "text-amber-400"
                : "text-muted-foreground opacity-0 focus:opacity-100 group-hover:opacity-100"
            }`}
          >
            <Star className={`h-4 w-4 ${ponto.favorito ? "fill-current" : ""}`} />
          </button>

          {ponto.videoUrl ? (
            <a
              href={ponto.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={incerto ? "Vídeo provável — confira antes de usar" : "Ouvir no YouTube"}
              aria-label={`Ouvir ${ponto.titulo} no YouTube`}
              className={`rounded-md p-2 transition ${
                incerto
                  ? "text-amber-400 hover:bg-amber-400/15"
                  : "text-red-400 hover:bg-red-500/15"
              }`}
            >
              {incerto ? <AlertTriangle className="h-4 w-4" /> : <Youtube className="h-4 w-4" />}
            </a>
          ) : (
            // Espaço reservado: sem ele as linhas com e sem vídeo desalinham,
            // e a lista inteira fica serrilhada.
            <span className="block h-8 w-8" aria-hidden />
          )}

          <button
            onClick={() => setAberto((v) => !v)}
            aria-label={aberto ? "Fechar letra" : "Abrir letra"}
            className="rounded-md p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${aberto ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {aberto && (
        <div className="px-3 pb-3 pl-11">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
            {destacar(ponto.letra, busca)}
          </pre>
          {incerto && (
            <p className="mt-2 text-[11px] leading-snug text-amber-400/80">
              Achamos este vídeo pela letra, mas a correspondência ficou fraca
              {typeof ponto.videoConfianca === "number" &&
                ` (${Math.round(ponto.videoConfianca * 100)}%)`}
              . Pode não ser este ponto.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
