import { useMemo, useState } from "react";
import { Heart, Search, X, ListMusic, Star } from "lucide-react";
import { Link } from "wouter";
import { useApp } from "@/context";
import { useAuth } from "@/auth/AuthContext";
import { ArtistasEmDestaque } from "@/componentes/ArtistasEmDestaque";
import { PlaylistsEmDestaque } from "@/componentes/PlaylistsEmDestaque";
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
      className="group flex flex-col gap-2 rounded-lg bg-card/60 p-2 text-left transition hover:bg-accent/50 active:scale-[0.99]"
    >
      <div className="aspect-square w-full">
        <Capa cor={orixa.cor} emoji={orixa.emoji} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{orixa.nome}</p>
        <p className="text-[11px] text-muted-foreground">{quantos}</p>
      </div>
    </button>
  );
}

export function TelaInicio({
  onAbrirOrixa,
  onAdicionar,
  onSugerirAutor,
  focarBusca = false,
}: {
  onAbrirOrixa: (o: Orixa) => void;
  onAdicionar?: (p: Ponto) => void;
  onSugerirAutor?: (p: Ponto) => void;
  /** Ligado quando se chega por "Buscar": o campo já vem pronto para digitar. */
  focarBusca?: boolean;
}) {
  // O CATÁLOGO, e não o acervo dela: esta tela responde "o que existe?".
  //
  // Lendo `dados`, apagar um ponto do acervo pessoal o apagava daqui — *"eu
  // apaguei do acervo e sumiu da principal também, isso tá errado"* (02/09).
  // Tirar da minha gira não pode sumir do catálogo.
  const { catalogo: dados, estado } = useApp();
  const { autenticado } = useAuth();
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

  // `tipo` ausente conta como orixá: é o cache de quem abriu o app antes desta
  // versão, e sumir com os cartões dele seria pior que mostrá-los juntos.
  //
  // Os três grupos são exaustivos DE PROPÓSITO — cada um testa o seu valor, e
  // o dos orixás recolhe o desconhecido. Enquanto isto era "orixás" e "o
  // resto", o terceiro tipo nasceu dentro do grid dos orixás sem que nada
  // avisasse; um quarto tipo, amanhã, aparece entre os orixás em vez de sumir
  // da tela, que é o modo menos ruim de errar.
  const entidades = useMemo(
    () => dados.orixas.filter((o) => o.tipo !== "momento" && o.tipo !== "linha"),
    [dados.orixas],
  );
  const linhas = useMemo(
    () => dados.orixas.filter((o) => o.tipo === "linha"),
    [dados.orixas],
  );
  const momentos = useMemo(
    () => dados.orixas.filter((o) => o.tipo === "momento"),
    [dados.orixas],
  );
  const buscando = busca.trim().length >= 2;

  return (
    <div className="min-h-full px-4 pb-24 pt-5 sm:px-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground sm:text-3xl">Acervo</h1>
          <p className="text-sm text-muted-foreground">
            {dados.pontos.length} pontos em {entidades.length} orixás
          </p>
        </div>
        <MenuUsuario />
      </header>

      <div className="relative mb-8 max-w-xl">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          // `autoFocus` só quando se chegou pela aba Buscar. Na abertura normal
          // do app ele abriria o teclado do celular por cima do acervo, que é
          // justamente o que a pessoa veio ver.
          autoFocus={focarBusca}
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
            <LinhaPonto key={p.id} ponto={p} indice={i + 1} busca={busca} onAdicionar={onAdicionar} onSugerirAutor={onSugerirAutor} />
          ))}
        </section>
      ) : (
        <>
          {autenticado && favoritos.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-2 flex items-center gap-2 px-2 text-lg font-bold text-foreground">
                <Heart className="h-4 w-4 fill-primary text-primary" aria-hidden />
                Curtidas
                {/* Só os oito primeiros cabem aqui. Sem esta saída, o nono
                    favorito simplesmente desaparecia do app. */}
                <Link href="/favoritos" className="ml-auto text-xs font-medium text-primary underline">
                  {favoritos.length > 8 ? `ver todos os ${favoritos.length}` : "ver todos"}
                </Link>
              </h2>
              {favoritos.slice(0, 8).map((p, i) => (
                <LinhaPonto key={p.id} ponto={p} indice={i + 1} onAdicionar={onAdicionar} onSugerirAutor={onSugerirAutor} />
              ))}
            </section>
          )}

          {/* ACIMA dos orixás.
              
              Ficou embaixo na primeira versão e, numa tela de celular, isso é
              longe o bastante para não existir. Subiu por decisão do Matheus.
              O custo é real — empurra o índice de orixás, que é o que a maioria
              vem buscar — e é por isso que a seção é uma prateleira horizontal
              de altura fixa, e não um grid que cresce. */}
          <ArtistasEmDestaque />

          {/* As playlists logo abaixo dos artistas: é o caminho que ele
              descreveu — "do início acesso playlist e salvo elas pra aparecer
              em organizar acervo". Achar e guardar no mesmo lugar. */}
          <PlaylistsEmDestaque />

          <section aria-label="Orixás">
            <h2 className="mb-3 px-2 text-lg font-bold text-foreground">Orixás</h2>
            {dados.orixas.length === 0 && estado === "carregando" ? (
              // Primeiríssima visita: não há cache e o acervo está a caminho.
              // Antes, a mensagem de "confira sua conexão" aparecia AQUI —
              // acusando a rede de quem só precisava esperar dois segundos.
              // Quem já visitou nunca vê isto: o cache é lido de forma
              // síncrona e os cartões aparecem prontos.
              <div aria-busy="true" aria-label="Carregando o acervo"
                   className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
                {Array.from({ length: 14 }, (_, i) => (
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
              // Mais colunas = capa menor. Treze cartões grandes viravam uma
              // parede de cor que exigia rolar para ver o acervo inteiro; o
              // ponto da grade é caber tudo de uma olhada.
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
                {entidades.map((o) => (
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

          {/* Também não são orixás — são falanges. Preto Velho e Beijada
              estavam no grid dos orixás desde sempre; Boiadeiro, Malandro,
              Cigano e Marujo nascem aqui, ainda sem ponto dentro. */}
          {linhas.length > 0 && (
            <section aria-label="Linhas" className="mt-8">
              <h2 className="mb-1 px-2 text-lg font-bold text-foreground">Linhas</h2>
              <p className="mb-3 px-2 text-sm text-muted-foreground">
                Falanges que se saúdam na gira. Não são orixás.
              </p>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
                {linhas.map((o) => (
                  <CardOrixa
                    key={o.id}
                    orixa={o}
                    quantos={porOrixa.get(o.id) ?? 0}
                    onClick={() => onAbrirOrixa(o)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Separado dos orixás porque NÃO é orixá.
              "Início" é a abertura da gira — dentro dela vêm Defumação, Almas,
              Exu, Oxalá, Anjo de Guarda, Saudações. Misturado no grid, ele
              aparecia ao lado de Iemanjá como se fosse uma entidade, e quem
              procurava Oxalá o encontrava com zero pontos: os de Oxalá estão
              aqui dentro. */}
          {momentos.length > 0 && (
            <section aria-label="Momentos da gira" className="mt-8">
              <h2 className="mb-1 px-2 text-lg font-bold text-foreground">
                Momentos da gira
              </h2>
              <p className="mb-3 px-2 text-sm text-muted-foreground">
                Não são orixás: são partes da sequência, na ordem em que se canta.
              </p>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
                {momentos.map((o) => (
                  <CardOrixa
                    key={o.id}
                    orixa={o}
                    quantos={porOrixa.get(o.id) ?? 0}
                    onClick={() => onAbrirOrixa(o)}
                  />
                ))}
              </div>
            </section>
          )}

          {!ent.repertorios && dados.orixas.length > 0 && (
            <section className="mt-10 rounded-xl border border-dashed p-6">
              <ListMusic className="mb-2 h-5 w-5 text-muted-foreground" aria-hidden />
              <h3 className="font-semibold text-foreground">Monte a sua playlist</h3>
              <p className="mt-1 max-w-lg text-sm text-muted-foreground">
                Com o plano você cria repertórios na ordem em que vai cantar e leva
                a sequência pronta para o terreiro.
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
