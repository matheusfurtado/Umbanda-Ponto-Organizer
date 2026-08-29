import { useMemo, useState } from "react";
import { ArrowLeft, Search, X, Lock, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context";
import { useEntitlements } from "@/billing/EntitlementsContext";
import { Capa } from "@/componentes/Capa";
import { LinhaPonto } from "@/componentes/LinhaPonto";
import { semAcento } from "@/lib/destacar";
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

export function TelaOrixa({
  orixa,
  onVoltar,
  onAdicionar,
  onSugerirAutor,
}: {
  orixa: Orixa;
  onVoltar: () => void;
  onAdicionar?: (p: Ponto) => void;
  onSugerirAutor?: (p: Ponto) => void;
}) {
  const { dados } = useApp();
  const { ent } = useEntitlements();
  const [busca, setBusca] = useState("");

  // ORDENADO por `ordem`, e não pela ordem do vetor.
  //
  // Arrastar grava `ordem` e NÃO mexe no vetor (`context.reordenarPontos` e
  // `reordenarSubcategorias`). A tela de organizar já ordenava; esta não — e
  // esta é a tela onde se canta. A pessoa reorganizava a gira, vinha cantar, e
  // encontrava a ordem antiga; o novo só aparecia depois de o app fechar e
  // reabrir, quando o servidor devolve o acervo já ordenado.
  //
  // Num app cujo produto pago É a ordem da gira, isso é o produto não
  // acontecendo — no pior momento, que é com o terreiro esperando.
  //
  // `sort` do JS é ESTÁVEL, e isso é o que preserva o plano grátis: lá o
  // servidor zera todo `ordem` e manda em ordem alfabética, então empate
  // mantém o que ele mandou. Ordenar aqui não desfaz a ordem do servidor —
  // aplica a mesma chave que ele usou.
  const subs = useMemo(
    () =>
      dados.subcategorias
        .filter((s) => s.orixaId === orixa.id)
        .sort((a, b) => a.ordem - b.ordem),
    [dados.subcategorias, orixa.id],
  );

  const meus = useMemo(() => {
    const ids = new Set(subs.map((s) => s.id));
    return dados.pontos
      .filter((p) => p.orixaId === orixa.id || ids.has(p.subcategoriaId))
      .sort((a, b) => a.ordem - b.ordem);
  }, [dados.pontos, subs, orixa.id]);

  // Os que a comunidade acrescentou há pouco.
  //
  // Eles JÁ estão na lista abaixo, na seção "Enviados pela comunidade" — que é
  // a última do orixá, depois de dezenas de pontos. Quem enviou não achava o
  // próprio ponto. Este atalho no topo resolve sem mexer na ordem da gira, que
  // é conteúdo litúrgico e não pode ser reorganizada por conveniência.
  const novos = useMemo(
    () => meus.filter((p) => {
      if (!p.aprovadoEm) return false;
      return Date.now() - p.aprovadoEm < 30 * 24 * 60 * 60 * 1000;
    }),
    [meus],
  );

  const filtrados = useMemo<Ponto[]>(() => {
    const termo = semAcento(busca.trim());
    if (!termo) return meus;
    return meus.filter(
      (p) => semAcento(p.titulo).includes(termo) || semAcento(p.letra).includes(termo),
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

        {!busca && novos.length > 0 && (
          <section className="mb-6 rounded-xl border border-primary/25 bg-primary/[0.04] p-3">
            <h2 className="mb-1 flex items-center gap-1.5 px-1 text-sm font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden />
              Novos em {orixa.nome}
            </h2>
            <p className="mb-2 px-1 text-xs text-muted-foreground">
              Acrescentados pela comunidade nos últimos 30 dias. Também estão na
              sequência abaixo.
            </p>
            {novos.map((p, i) => (
              <LinhaPonto key={`novo-${p.id}`} ponto={p} indice={i + 1}
                          onAdicionar={onAdicionar} onSugerirAutor={onSugerirAutor} />
            ))}
          </section>
        )}

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
              <LinhaPonto key={p.id} ponto={p} indice={++n} busca={busca} onAdicionar={onAdicionar} onSugerirAutor={onSugerirAutor} />
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
              <LinhaPonto key={p.id} ponto={p} indice={++n} busca={busca} onAdicionar={onAdicionar} onSugerirAutor={onSugerirAutor} />
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
