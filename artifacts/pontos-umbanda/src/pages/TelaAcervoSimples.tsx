/**
 * O acervo do plano grátis: uma lista corrida, em ordem alfabética.
 *
 * Existe porque a tela de hierarquia **mentia** para quem não tem plano. O
 * servidor não envia orixás nem subcategorias (ADR 0002), então `TelaOrixas`
 * recebia lista vazia e mostrava "Nenhum Orixá ainda — toque em + para
 * adicionar" para alguém que tem 520 pontos na mão. Parecia app quebrado.
 *
 * Duas decisões de desenho:
 *
 * - **Ordenada, nunca embaralhada.** A ordem litúrgica é o produto pago;
 *   bagunçar de propósito num app religioso lê como sabotagem e mata o boca a
 *   boca do terreiro, que é o único canal de aquisição gratuito.
 * - **O convite ao plano não bloqueia nada.** Fica no rodapé, depois de a
 *   pessoa já ter o que veio buscar. Ninguém precisa passar por um anúncio para
 *   ler a letra de um ponto.
 */

import { useMemo, useState } from "react";
import { Link } from "wouter";
import { ChevronDown, Search, Sparkles } from "lucide-react";
import { MenuUsuario } from "@/components/MenuUsuario";
import { useApp } from "@/context";
import { destacar, semAcento } from "@/lib/destacar";
import type { Ponto } from "@/types";

function CardSimples({ ponto, busca }: { ponto: Ponto; busca: string }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="flex min-h-11 w-full items-start gap-2 px-3.5 py-3 text-left"
      >
        <span className="flex-1 text-sm font-medium leading-snug text-foreground">
          {destacar(ponto.titulo, busca)}
        </span>
        <ChevronDown
          className={`mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
            aberto ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>
      {aberto && (
        <div className="border-t border-border bg-muted/30 px-3.5 py-3">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
            {destacar(ponto.letra, busca)}
          </pre>
        </div>
      )}
    </div>
  );
}

export function TelaAcervoSimples() {
  const { dados, estado } = useApp();
  const [busca, setBusca] = useState("");

  const pontos = useMemo(() => {
    const termo = semAcento(busca.trim());
    const base = termo
      ? dados.pontos.filter(
          (p) => semAcento(p.titulo).includes(termo) || semAcento(p.letra).includes(termo),
        )
      : dados.pontos;
    // O servidor já manda ordenado, mas a lista é reordenada aqui também para a
    // busca não devolver resultados em ordem arbitrária.
    return [...base].sort((a, b) => semAcento(a.titulo).localeCompare(semAcento(b.titulo), "pt-BR"));
  }, [dados.pontos, busca]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg">
        <div className="px-4 pb-4 pt-8">
          <div className="mb-1 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Pontos de Umbanda</h1>
            <MenuUsuario />
          </div>
          <p className="text-sm text-muted-foreground">
            {dados.pontos.length} pontos · em ordem alfabética
          </p>
        </div>

        <div className="px-4 pb-3">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar pela letra ou pelo nome..."
              aria-label="Buscar pontos"
              className="min-h-11 w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="space-y-2 px-4 pb-4">
          {estado === "carregando" && dados.pontos.length === 0 ? (
            // Esqueleto, não texto de vazio: dizer "nenhum ponto" enquanto ainda
            // carrega é a mesma mentira que esta tela veio corrigir.
            <div aria-busy="true" className="space-y-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-muted/40" />
              ))}
            </div>
          ) : pontos.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="mb-3 text-4xl">🔎</p>
              <p className="font-medium">Nenhum ponto com “{busca}”</p>
              <p className="mt-1 text-sm">Tente outra palavra da letra.</p>
            </div>
          ) : (
            pontos.map((p) => <CardSimples key={p.id} ponto={p} busca={busca} />)
          )}
        </div>

        {/* O convite vem DEPOIS do acervo, nunca antes. Ninguém precisa passar
            por um anúncio para ler a letra de um ponto. */}
        <div className="px-4 pb-16">
          <Link href="/planos">
            <button className="w-full rounded-xl border border-primary/30 bg-primary/10 p-4 text-left transition-colors hover:bg-primary/15">
              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                Organize a sua gira
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">
                As letras são e continuam grátis. Com o plano, os pontos ficam
                agrupados por orixá na ordem da gira, cada um com o link do vídeo, e
                você monta seu repertório e usa offline. Ver planos →
              </span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
