import { useMemo, useState } from "react";
import { Search, X, ListMusic, Star } from "lucide-react";
import { Link } from "wouter";
import { useApp } from "@/context";
import { useEntitlements } from "@/billing/EntitlementsContext";
import { MenuUsuario } from "@/components/MenuUsuario";
import { Capa } from "@/componentes/Capa";
import { LinhaPonto } from "@/componentes/LinhaPonto";
import { semAcento } from "@/lib/destacar";
import type { Orixa, Ponto } from "@/types";

/**
 * A entrada do acervo — a mesma para quem paga e para quem não paga.
 *
 * Em GRADE, e não em lista vertical. Catorze linhas de texto empilhadas numa
 * coluna estreita eram um índice de arquivo; a grade com capa colorida deixa
 * reconhecer o orixá pela cor antes de ler o nome, e usa a tela em vez de
 * deixar dois terços dela vazios.
 *
 * A busca vem antes de tudo porque em gira ninguém navega: a pessoa lembra um
 * trecho da letra e precisa achar agora.
 */

function CardOrixa({ orixa, quantos, onClick }: {
  orixa: Orixa; quantos: number; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col gap-3 rounded-xl bg-card/60 p-3 text-left transition hover:bg-accent/50 active:scale-[0.99]"
    >
      <div className="aspect-square w-full">
        <Capa cor={orixa.cor} emoji={orixa.emoji} />
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold text-foreground">{orixa.nome}</p>
        <p className="text-xs text-muted-foreground">
          {quantos} {quantos === 1 ? "ponto" : "pontos"}
        </p>
      </div>
    </button>
  );
}

export function TelaInicio({
  onAbrirOrixa,
  onAdicionar,
}: {
  onAbrirOrixa: (o: Orixa) => void;
  onAdicionar?: (p: Ponto) => void;
}) {
  const { dados, estado } = useApp();
  const { ent } = useEntitlements();
  const [busca, setBusca] = useState("");

  const porOrixa = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const p of dados.pontos) {
      const id =
        p.orixaId || dados.subcategorias.find((s) => s.id === p.subcategoriaId)?.orixaId;
      if (id) mapa.set(id, (mapa.get(id) ?? 0) + 1);
    }
    return mapa;
  }, [dados.pontos, dados.subcategorias]);

  const achados = useMemo<Ponto[]>(() => {
    const termo = semAcento(busca.trim());
    if (termo.length < 2) return [];
    return dados.pontos
      .filter((p) => semAcento(p.titulo).includes(termo) || semAcento(p.letra).includes(termo))
      .slice(0, 60);
  }, [busca, dados.pontos]);

  const favoritos = useMemo(() => dados.pontos.filter((p) => p.favorito), [dados.pontos]);
  const buscando = busca.trim().length >= 2;

  return (
    <div className="min-h-full px-4 pb-24 pt-5 sm:px-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">Acervo</h1>
          <p className="text-sm text-muted-foreground">
            {dados.pontos.length} pontos em {dados.orixas.length} orixás
          </p>
        </div>
        <MenuUsuario />
      </header>

      <div className="relative mb-8 max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar pelo nome ou por um trecho da letra..."
          aria-label="Buscar pontos"
          className="w-full rounded-full border bg-card py-3 pl-11 pr-10 text-foreground outline-none transition focus:border-primary/60"
        />
        {busca && (
          <button
            onClick={() => setBusca("")}
            aria-label="Limpar busca"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {buscando ? (
        <section aria-label="Resultados da busca">
          <p className="mb-2 px-2 text-sm text-muted-foreground">
            {achados.length === 0
              ? "Nenhum ponto com esse trecho."
              : `${achados.length} ${achados.length === 1 ? "ponto" : "pontos"}`}
          </p>
          {achados.map((p, i) => (
            <LinhaPonto key={p.id} ponto={p} indice={i + 1} busca={busca} onAdicionar={onAdicionar} />
          ))}
        </section>
      ) : (
        <>
          {favoritos.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-2 flex items-center gap-2 px-2 text-lg font-bold text-foreground">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                Seus favoritos
              </h2>
              {favoritos.slice(0, 8).map((p, i) => (
                <LinhaPonto key={p.id} ponto={p} indice={i + 1} onAdicionar={onAdicionar} />
              ))}
            </section>
          )}

          <section aria-label="Orixás">
            <h2 className="mb-3 px-2 text-lg font-bold text-foreground">Orixás</h2>
            {dados.orixas.length === 0 && estado === "carregando" ? (
              // Primeiríssima visita: não há cache e o acervo está a caminho.
              // Antes, a mensagem de "confira sua conexão" aparecia AQUI —
              // acusando a rede de quem só precisava esperar dois segundos.
              // Quem já visitou nunca vê isto: o cache é lido de forma
              // síncrona e os cartões aparecem prontos.
              <div aria-busy="true" aria-label="Carregando o acervo"
                   className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="rounded-xl bg-card/60 p-3">
                    <div className="mb-3 aspect-square w-full animate-pulse rounded-xl bg-muted/50" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-muted/50" />
                    <div className="mt-1.5 h-3 w-1/3 animate-pulse rounded bg-muted/40" />
                  </div>
                ))}
              </div>
            ) : dados.orixas.length === 0 ? (
              // Aqui sim é estado final sem nada: ou a rede falhou na primeira
              // abertura, ou o acervo veio vazio de verdade.
              <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                {estado === "erro"
                  ? "Não consegui carregar o acervo e não há nada guardado neste aparelho ainda. Confira sua conexão e recarregue."
                  : "Nenhum orixá no acervo."}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {dados.orixas.map((o) => (
                  <CardOrixa
                    key={o.id}
                    orixa={o}
                    quantos={porOrixa.get(o.id) ?? 0}
                    onClick={() => onAbrirOrixa(o)}
                  />
                ))}
              </div>
            )}
          </section>

          {!ent.repertorios && dados.orixas.length > 0 && (
            <section className="mt-10 rounded-xl border border-dashed p-6">
              <ListMusic className="mb-2 h-5 w-5 text-muted-foreground" aria-hidden />
              <h3 className="font-semibold text-foreground">Monte a sua gira</h3>
              <p className="mt-1 max-w-lg text-sm text-muted-foreground">
                Com o plano você cria repertórios na ordem em que vai cantar, com o
                vídeo de cada ponto, e leva tudo no celular — inclusive sem sinal.
              </p>
              <Link
                href="/planos"
                className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
              >
                Ver planos
              </Link>
            </section>
          )}
        </>
      )}
    </div>
  );
}
