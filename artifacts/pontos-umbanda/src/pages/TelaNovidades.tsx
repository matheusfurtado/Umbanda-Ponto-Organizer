import { useEffect, useMemo, useState } from "react";
import { mensagemDeErro } from "@/api/cliente";
import { Sparkles } from "lucide-react";
import { Capa } from "@/componentes/Capa";
import { LinhaPonto } from "@/componentes/LinhaPonto";
import { useAcoesDePonto } from "@/componentes/AcoesDePonto";
import { useApp } from "@/context";
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
 *
 * **Agrupada por orixá**, e não numa lista corrida por data. Ponto de Umbanda
 * não se lê solto: saber que o ponto é de Omulu é metade do que ele é, e uma
 * fila de títulos sem esse rótulo obriga a abrir um por um para descobrir onde
 * cada um cai na gira. A ordem dos grupos ainda é a da aprovação — o orixá que
 * recebeu algo agora aparece primeiro.
 */

interface OrixaDaNovidade {
  id: string;
  nome: string;
  cor: string | null;
  emoji: string | null;
}

interface Grupo {
  orixa: OrixaDaNovidade;
  pontos: Ponto[];
}

export function TelaNovidades() {
  const [linhas, setLinhas] = useState<Array<{ ponto: Ponto; orixa: OrixaDaNovidade }> | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const { adicionar, sugerir, modais } = useAcoesDePonto();
  const { dados } = useApp();

  // O favorito NÃO vem desta rota — ele é do acervo, e mora no contexto.
  //
  // Estes pontos são objetos novos, montados a partir do JSON de `/novidades`.
  // Enquanto `favorito` vinha `false` fixo, clicar na estrela marcava de
  // verdade no acervo e a estrela continuava vazia na tela: o botão parecia
  // não funcionar justamente onde a pessoa acabou de descobrir o ponto.
  const favoritos = useMemo(
    () =>
      new Set(
        dados.pontos
          .filter((p) => p.favorito)
          // Os DOIS ids: quem organizou o acervo tem cópia com id próprio, e
          // esta lista fala no id canônico.
          .flatMap((p) => [p.id, p.origemId ?? ""]),
      ),
    [dados.pontos],
  );

  useEffect(() => {
    fetch("/api/v1/novidades")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("Falha ao carregar."))))
      .then((corpo) =>
        setLinhas(
          (corpo as Array<Record<string, unknown>>).map((p) => {
            const o = (p.orixa ?? {}) as Record<string, unknown>;
            const video = p.video as Record<string, unknown> | null;
            return {
              orixa: {
                id: String(o.id ?? ""),
                nome: String(o.nome ?? "Sem orixá"),
                cor: (o.cor as string | null) ?? null,
                emoji: (o.emoji as string | null) ?? null,
              },
              ponto: {
                id: String(p.id),
                subcategoriaId: String(p.subcategoria_id ?? ""),
                orixaId: String(o.id ?? ""),
                titulo: String(p.titulo ?? ""),
                letra: String(p.letra ?? ""),
                autor: (p.autor as string | null) ?? null,
                aprovadoEm: p.aprovado_em ? Date.parse(String(p.aprovado_em)) : null,
                enviadoPor: (p.enviado_por as string | null) ?? null,
                favorito: false, // resolvido na renderização, a partir do acervo
                ordem: Number(p.ordem ?? 0),
                criadoEm: 0,
                // O vídeo vem do servidor já respeitando o plano: sem plano ele
                // simplesmente não é enviado. Aqui só se lê o que chegou.
                videoUrl: (video?.url as string | null) ?? null,
                videoStatus: (video?.status as string | null) ?? null,
                videoCanal: (video?.canal as string | null) ?? null,
                videoTitulo: (video?.titulo as string | null) ?? null,
              } as Ponto,
            };
          }),
        ),
      )
      .catch((e) => setErro(mensagemDeErro(e, "Falha.")));
  }, []);

  // Agrupa preservando a ordem em que os orixás apareceram — que é a ordem de
  // aprovação que o servidor mandou. `Map` porque objeto reordena chave que
  // parece número, e id de orixá é texto mas nada garante que sempre será.
  const grupos = useMemo<Grupo[]>(() => {
    if (!linhas) return [];
    const porOrixa = new Map<string, Grupo>();
    for (const { ponto, orixa } of linhas) {
      const grupo = porOrixa.get(orixa.id);
      if (grupo) grupo.pontos.push(ponto);
      else porOrixa.set(orixa.id, { orixa, pontos: [ponto] });
    }
    return [...porOrixa.values()];
  }, [linhas]);

  const total = linhas?.length ?? 0;

  return (
    <div className="max-w-4xl px-4 pb-24 pt-5 sm:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
        <Sparkles className="h-6 w-6 text-primary" aria-hidden /> Novos do mês
      </h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        {total > 0
          ? `${total} ${total === 1 ? "ponto acrescentado" : "pontos acrescentados"} pela comunidade
             nos últimos 30 dias, em ${grupos.length} ${grupos.length === 1 ? "orixá" : "orixás"}.`
          : "Pontos que a comunidade acrescentou ao acervo nos últimos 30 dias."}
      </p>

      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}

      {linhas === null ? (
        <div aria-busy="true" className="space-y-2">
          {[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/40" />)}
        </div>
      ) : grupos.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum ponto novo neste mês ainda. Conhece um que falta?
        </p>
      ) : (
        grupos.map(({ orixa, pontos }) => (
          <section key={orixa.id} className="mb-8">
            <div className="mb-2 flex items-center gap-3">
              <div className="h-11 w-11 shrink-0">
                <Capa cor={orixa.cor ?? undefined} emoji={orixa.emoji ?? undefined} />
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold leading-tight text-foreground">
                  {orixa.nome}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {pontos.length} {pontos.length === 1 ? "ponto novo" : "pontos novos"}
                </p>
              </div>
            </div>
            {pontos.map((p, i) => (
              <LinhaPonto
                key={p.id}
                ponto={{ ...p, favorito: favoritos.has(p.id) }}
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
