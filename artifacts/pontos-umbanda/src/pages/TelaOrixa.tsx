import { useMemo, useState } from "react";
import { ArrowLeft, Search, X, Lock } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context";
import { useEntitlements } from "@/billing/EntitlementsContext";
import { Capa } from "@/componentes/Capa";
import { LinhaPonto } from "@/componentes/LinhaPonto";
import type { Orixa, Ponto } from "@/types";

/**
 * Um orixá, no formato de álbum: capa grande, título, e a lista de faixas.
 *
 * A mesma tela serve os dois planos, e a diferença aparece sozinha — com
 * subcategorias (pago) os pontos vêm em seções da gira; sem elas, numa lista
 * única. Uma tela e não duas porque duas divergem: já aconteceu aqui, com três
 * rotas resolvendo a herança de vídeo por conta própria até discordarem.
 *
 * O cabeçalho grande não é vaidade. Sem ele a tela abre igual à anterior e a
 * pessoa perde a noção de onde está — e "onde estou" é a primeira pergunta de
 * quem procura um ponto no meio da gira.
 */

function normalizar(t: string): string {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export function TelaOrixa({
  orixa,
  onVoltar,
  onAdicionar,
}: {
  orixa: Orixa;
  onVoltar: () => void;
  onAdicionar?: (p: Ponto) => void;
}) {
  const { dados } = useApp();
  const { ent } = useEntitlements();
  const [busca, setBusca] = useState("");

  const subs = useMemo(
    () => dados.subcategorias.filter((s) => s.orixaId === orixa.id),
    [dados.subcategorias, orixa.id],
  );

  const meus = useMemo(() => {
    const ids = new Set(subs.map((s) => s.id));
    return dados.pontos.filter((p) => p.orixaId === orixa.id || ids.has(p.subcategoriaId));
  }, [dados.pontos, subs, orixa.id]);

  const filtrados = useMemo<Ponto[]>(() => {
    const termo = normalizar(busca.trim());
    if (!termo) return meus;
    return meus.filter(
      (p) => normalizar(p.titulo).includes(termo) || normalizar(p.letra).includes(termo),
    );
  }, [busca, meus]);

  const secoes = useMemo(() => {
    if (subs.length === 0) return null;
    return subs
      .map((s) => ({ sub: s, pontos: filtrados.filter((p) => p.subcategoriaId === s.id) }))
      .filter((g) => g.pontos.length > 0);
  }, [subs, filtrados]);

  const soltos = useMemo(() => {
    if (!secoes) return filtrados;
    const dentro = new Set(secoes.flatMap((g) => g.pontos.map((p) => p.id)));
    return filtrados.filter((p) => !dentro.has(p.id));
  }, [secoes, filtrados]);

  const comVideo = meus.filter((p) => p.videoUrl).length;
  let n = 0;

  return (
    <div className="min-h-full">
      {/* O gradiente sai da cor do orixá e morre no fundo: dá identidade sem
          precisar de imagem, que aqui seria delicado de escolher. */}
      <div
        className="px-4 pb-6 pt-4 sm:px-8"
        style={{
          background: `linear-gradient(180deg, ${orixa.cor || "#7c4dff"}33, transparent)`,
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onVoltar}
          className="-ml-2 mb-4 gap-1.5 text-muted-foreground lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
          <div className="h-32 w-32 shrink-0 sm:h-44 sm:w-44">
            <Capa cor={orixa.cor} emoji={orixa.emoji} />
          </div>
          <div className="min-w-0 pb-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Orixá
            </p>
            <h1 className="mt-1 break-words text-4xl font-black leading-tight text-foreground sm:text-5xl">
              {orixa.nome}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {meus.length} {meus.length === 1 ? "ponto" : "pontos"}
              {comVideo > 0 && ` · ${comVideo} com vídeo`}
              {secoes && ` · ${secoes.length} ${secoes.length === 1 ? "seção" : "seções"}`}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl px-4 pb-24 sm:px-8">
        <div className="relative mb-5 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={`Buscar em ${orixa.nome}...`}
            aria-label={`Buscar pontos de ${orixa.nome}`}
            className="w-full rounded-full border bg-card py-2 pl-10 pr-9 text-sm text-foreground outline-none transition focus:border-primary/60"
          />
          {busca && (
            <button
              onClick={() => setBusca("")}
              aria-label="Limpar busca"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {filtrados.length === 0 && (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            {busca ? "Nenhum ponto com esse trecho aqui." : "Nenhum ponto neste orixá ainda."}
          </p>
        )}

        {secoes?.map(({ sub, pontos }) => (
          <section key={sub.id} className="mb-6">
            <h2 className="mb-1 px-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {sub.nome}
            </h2>
            {pontos.map((p) => (
              <LinhaPonto key={p.id} ponto={p} indice={++n} busca={busca} onAdicionar={onAdicionar} />
            ))}
          </section>
        ))}

        {soltos.length > 0 && (
          <section>
            {secoes && secoes.length > 0 && (
              <h2 className="mb-1 px-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Outros
              </h2>
            )}
            {soltos.map((p) => (
              <LinhaPonto key={p.id} ponto={p} indice={++n} busca={busca} onAdicionar={onAdicionar} />
            ))}
          </section>
        )}

        {!ent.acervoOrganizado && meus.length > 0 && (
          // No FIM, depois do que a pessoa veio buscar. No topo empurraria o
          // conteúdo para baixo e leria como pedágio.
          <div className="mt-10 rounded-xl border border-dashed p-6 text-center">
            <Lock className="mx-auto mb-2 h-5 w-5 text-muted-foreground" aria-hidden />
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              Estes {meus.length} pontos estão em ordem alfabética. Com o plano,{" "}
              <strong className="font-medium text-foreground">{orixa.nome}</strong> abre nas seções
              da gira, com o vídeo de cada ponto e seus repertórios — inclusive offline.
            </p>
            <Link href="/planos">
              <Button size="sm" className="mt-4">Ver planos</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
