import { useMemo } from "react";
import { Heart, Star } from "lucide-react";
import { Link } from "wouter";
import { Capa } from "@/componentes/Capa";
import { LinhaPonto } from "@/componentes/LinhaPonto";
import { useAcoesDePonto } from "@/componentes/AcoesDePonto";
import { useApp } from "@/context";
import { useEntitlements } from "@/billing/EntitlementsContext";
import type { Ponto } from "@/types";

/**
 * Os pontos marcados com a estrela, todos, agrupados por orixá.
 *
 * Existe porque a estrela não levava a lugar nenhum. Ela aparecia em toda linha
 * de ponto, guardava o favorito de verdade — e o único lugar que os mostrava era
 * uma seção do Início, limitada a oito e escondida quando vazia. Quem favoritava
 * de dentro de um orixá não via nada acontecer e concluía, com razão, que o
 * botão não fazia nada.
 *
 * Agrupado por orixá e não numa lista corrida pela mesma razão de "Novos do
 * mês": ponto de Umbanda sem o orixá é meio ponto, e quem separa favoritos está
 * quase sempre montando uma gira — que se pensa por orixá.
 *
 * ## A conta só é prometida a quem a tem
 *
 * Favorito é estado do acervo, e o acervo sobe pelo `PUT /acervo`, que exige o
 * direito `sync` — o plano grátis não o tem, e leva 402. Para essas pessoas o
 * favorito vive SÓ neste aparelho, e a frase de rodapé dizia "e na sua conta"
 * para todo mundo.
 */
export function TelaFavoritos() {
  // O CATÁLOGO, e não o acervo dela.
  //
  // Lendo `dados`, uma curtida sumia da tela no dia em que a pessoa tirasse o
  // ponto do acervo dela — e a curtida não vive mais lá desde o ADR 0009 (etapa
  // 3): ela é uma linha ligando pessoa e ponto canônico. A tela mostrava menos
  // do que o banco guardava, sem avisar.
  const { catalogo: dados, estado } = useApp();
  const { ent } = useEntitlements();
  const { adicionar, sugerir, modais } = useAcoesDePonto();

  const grupos = useMemo(() => {
    const favoritos = dados.pontos.filter((p) => p.favorito);
    const orixaDe = new Map(dados.orixas.map((o) => [o.id, o]));
    // Do orixá da subcategoria quando o ponto não trouxe `orixaId` — é o caso
    // do acervo que o próprio usuário organizou, onde a subcategoria é dele.
    const daSub = new Map(dados.subcategorias.map((s) => [s.id, s.orixaId]));

    const porOrixa = new Map<string, { orixa: (typeof dados.orixas)[number] | null; pontos: Ponto[] }>();
    for (const p of favoritos) {
      const id = p.orixaId || daSub.get(p.subcategoriaId) || "";
      const grupo = porOrixa.get(id);
      if (grupo) grupo.pontos.push(p);
      else porOrixa.set(id, { orixa: orixaDe.get(id) ?? null, pontos: [p] });
    }
    // Na ordem do acervo, que é litúrgica — não na ordem em que foram
    // favoritados, que não quer dizer nada para quem monta uma gira.
    return [...porOrixa.values()].sort(
      (a, b) => (a.orixa?.ordem ?? 999) - (b.orixa?.ordem ?? 999),
    );
  }, [dados.pontos, dados.orixas, dados.subcategorias]);

  const total = grupos.reduce((n, g) => n + g.pontos.length, 0);

  return (
    <div className="max-w-4xl px-4 pb-24 pt-5 sm:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
        <Heart className="h-6 w-6 fill-primary text-primary" aria-hidden /> Curtidas
      </h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        {total > 0
          ? `${total} ${total === 1 ? "ponto marcado" : "pontos marcados"} com a estrela.`
          : ent.sync
            ? "Ficam guardados neste aparelho e na sua conta."
            : // Sem `sync` os favoritos NÃO vão para a conta: o `PUT /acervo`
              // responde 402 sem esse direito. A frase única prometia conta a
              // quem não a tem — e é uma promessa sobre não perder o que se
              // marcou, dita justamente a quem ainda vai decidir se confia na
              // estrela.
              "Ficam guardados neste aparelho. Com o plano, vão também para a sua conta e voltam em qualquer aparelho."}
      </p>

      {/* "Você não tem favoritos" e "não consegui carregar o acervo" são coisas
          diferentes, e dizer a primeira quando a verdade é a segunda faz a
          pessoa achar que PERDEU o que marcou. O acervo é lido do cache de
          forma síncrona, então isto só aparece na primeiríssima visita ou
          quando a rede falhou antes de haver cache — que é justamente quando
          errar a mensagem dói mais. */}
      {dados.pontos.length === 0 && estado === "carregando" ? (
        <div aria-busy="true" aria-label="Carregando o acervo" className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/40" />
          ))}
        </div>
      ) : dados.pontos.length === 0 && estado === "erro" ? (
        <p role="alert" className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Não consegui carregar o acervo e não há nada guardado neste aparelho ainda,
          então não dá para saber quais são os seus favoritos. Confira a conexão e
          recarregue — nada foi perdido.
        </p>
      ) : total === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <Heart className="mx-auto mb-3 h-6 w-6 text-muted-foreground" aria-hidden />
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            Nenhum ponto curtido ainda. O coração aparece em toda linha de ponto —
            marque os que você mais canta e eles ficam aqui, à mão.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm font-medium text-primary underline">
            Ver o acervo
          </Link>
        </div>
      ) : (
        grupos.map(({ orixa, pontos }) => (
          <section key={orixa?.id ?? "sem-orixa"} className="mb-8">
            <div className="mb-2 flex items-center gap-3">
              <div className="h-11 w-11 shrink-0">
                <Capa cor={orixa?.cor} emoji={orixa?.emoji} />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold leading-tight text-foreground">
                  {orixa?.nome ?? "Sem orixá"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {pontos.length} {pontos.length === 1 ? "curtido" : "curtidos"}
                </p>
              </div>
            </div>
            {pontos.map((p, i) => (
              <LinhaPonto
                key={p.id}
                ponto={p}
                indice={i + 1}
                onAdicionar={adicionar}
                onSugerirAutor={sugerir}
              />
            ))}
          </section>
        ))
      )}
      {modais}
    </div>
  );
}
