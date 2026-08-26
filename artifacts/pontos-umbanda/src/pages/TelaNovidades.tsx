import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { LinhaPonto } from "@/componentes/LinhaPonto";
import type { Ponto } from "@/types";

/**
 * O que a comunidade acrescentou ao acervo nos últimos 30 dias.
 *
 * Vem calculada do servidor (`ponto.aprovado_em`), não guardada como playlist:
 * uma lista "novos do mês" que existisse como linha no banco precisaria de
 * alguém entrando e saindo dela todo dia, e ficaria errada no dia em que esse
 * alguém falhasse.
 *
 * Sem portão. Saber que o acervo cresceu é o que traz a pessoa de volta, e o
 * que se cobra é a ferramenta — a letra é grátis (ADR 0002).
 */
export function TelaNovidades({ onAdicionar }: { onAdicionar?: (p: Ponto) => void }) {
  const [pontos, setPontos] = useState<Ponto[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/novidades")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Falha ao carregar."))))
      .then((linhas) =>
        setPontos(
          (linhas as Array<Record<string, unknown>>).map((p) => ({
            id: String(p.id),
            subcategoriaId: String(p.subcategoria_id ?? ""),
            titulo: String(p.titulo ?? ""),
            letra: String(p.letra ?? ""),
            autor: (p.autor as string | null) ?? null,
            favorito: false,
            ordem: Number(p.ordem ?? 0),
            criadoEm: 0,
            videoUrl: (p.video as { url?: string } | null)?.url ?? null,
          })) as Ponto[],
        ),
      )
      .catch((e) => setErro(e instanceof Error ? e.message : "Falha."));
  }, []);

  return (
    <div className="max-w-3xl px-4 pb-24 pt-5 sm:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
        <Sparkles className="h-6 w-6 text-primary" aria-hidden /> Novos do mês
      </h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Pontos que a comunidade acrescentou ao acervo nos últimos 30 dias.
      </p>

      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}

      {pontos === null ? (
        <div aria-busy="true" className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/40" />)}
        </div>
      ) : pontos.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum ponto novo neste mês ainda. Conhece um que falta?
        </p>
      ) : (
        pontos.map((p, i) => (
          <LinhaPonto key={p.id} ponto={p} indice={i + 1} onAdicionar={onAdicionar} />
        ))
      )}
    </div>
  );
}
