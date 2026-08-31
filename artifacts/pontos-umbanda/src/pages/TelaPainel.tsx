/**
 * O painel de quem administra.
 *
 * ## A ressalva fica na tela, não numa documentação
 *
 * Cada número vem do servidor com uma frase dizendo o que ele **não** mede, e
 * ela aparece embaixo do número. Não é rodapé nem tooltip: quem lê este painel
 * decide preço, prazo e o que construir depois, e a leitura errada acontece no
 * segundo em que o olho bate no número — não depois, num link de ajuda.
 *
 * O caso que justifica a regra é "pessoas que usaram em 7 dias". O app foi
 * feito para funcionar offline, na gira, sem falar com o servidor. Quem faz
 * exatamente isso — o uso que o produto promete — não aparece nessa conta. Um
 * painel que mostrasse o número sozinho ensinaria o dono a achar que ninguém
 * está usando.
 *
 * ## Números grandes, sem gráfico
 *
 * Não há série temporal aqui porque não há dado histórico: o banco guarda o
 * estado de agora, não uma foto por dia. Desenhar uma linha exigiria inventar
 * os pontos dela, e um gráfico que parece série sem ser é a mentira mais cara
 * que um painel pode contar.
 */

import { useCallback, useEffect, useState } from "react";
import { mensagemDeErro } from "@/api/cliente";
import { AlertCircle, BarChart3, Loader2, RefreshCw } from "lucide-react";
import { verMetricas, type GrupoDoPainel } from "@/api/painel";
import { pontosEmMaisGiras, pontosMaisClicados, type PontoNoRanking } from "@/api/painel";
import { RankingDePontos } from "@/componentes/RankingDePontos";

/** Centavos viram "R$ 9,90" — o painel é lido por gente, não por contador. */
function emReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function Numero({
  rotulo,
  valor,
  ressalva,
  chave,
}: {
  rotulo: string;
  valor: number;
  ressalva: string;
  chave: string;
}) {
  const naoMedido = ressalva.startsWith("NÃO MEDIDO");
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {rotulo}
      </p>
      <p
        className={`mt-1 text-3xl font-black tabular-nums ${
          naoMedido ? "text-muted-foreground/40" : "text-foreground"
        }`}
      >
        {naoMedido ? "—" : chave === "receita_mensal" ? emReais(valor) : valor.toLocaleString("pt-BR")}
      </p>
      {ressalva && (
        <p className="mt-2 text-xs leading-snug text-muted-foreground">{ressalva}</p>
      )}
    </div>
  );
}

export function TelaPainel() {
  const [grupos, setGrupos] = useState<GrupoDoPainel[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [buscando, setBuscando] = useState(false);

  const carregar = useCallback(() => {
    setBuscando(true);
    setErro(null);
    verMetricas()
      .then(setGrupos)
      .catch((problema) =>
        setErro(mensagemDeErro(problema, "Não consegui carregar.")),
      )
      .finally(() => setBuscando(false));
  }, []);

  const [clicados, setClicados] = useState<PontoNoRanking[] | null>(null);
  const [emGiras, setEmGiras] = useState<PontoNoRanking[] | null>(null);
  const [erroRanking, setErroRanking] = useState<string | null>(null);

  useEffect(carregar, [carregar]);

  // Os rankings carregam à parte dos números: são consultas mais caras, e uma
  // falha nelas não pode esconder o painel inteiro — quem abre isto quer os
  // números do negócio antes de qualquer lista.
  useEffect(() => {
    pontosMaisClicados().then(setClicados).catch((e) =>
      setErroRanking(mensagemDeErro(e, "Falha ao carregar.")),
    );
    pontosEmMaisGiras().then(setEmGiras).catch((e) =>
      setErroRanking(mensagemDeErro(e, "Falha ao carregar.")),
    );
  }, []);

  if (erro && !grupos) {
    return (
      <div className="max-w-3xl px-4 pb-24 pt-16 sm:px-8">
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden />
          <div>
            <p className="font-medium">{erro}</p>
            <button
              type="button"
              onClick={carregar}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md border px-4 font-medium"
            >
              <RefreshCw className="h-4 w-4" aria-hidden /> Tentar de novo
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!grupos) {
    return (
      <div aria-busy="true" className="max-w-5xl px-4 pb-24 pt-5 sm:px-8">
        <div className="h-8 w-56 animate-pulse rounded bg-muted/50" />
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-muted/40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="max-w-5xl px-4 pb-24 pt-5 sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
              <BarChart3 className="h-6 w-6 text-primary" aria-hidden />
              Painel
            </h1>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              Só contagens. Nenhuma lista de pessoas — a mesma regra do perfil e
              da fila: diz quantos, nunca quem.
            </p>
          </div>
          <button
            type="button"
            onClick={carregar}
            disabled={buscando}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-medium disabled:opacity-60"
          >
            {buscando ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="h-4 w-4" aria-hidden />
            )}
            Atualizar
          </button>
        </div>

        {erro && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {erro} — os números abaixo são da última leitura.
          </p>
        )}

        {grupos.map((grupo) => (
          <section key={grupo.chave} className="mt-8">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {grupo.titulo}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {grupo.numeros.map((n) => (
                <Numero
                  key={n.chave}
                  chave={n.chave}
                  rotulo={n.rotulo}
                  valor={n.valor}
                  ressalva={n.ressalva}
                />
              ))}
            </div>
          </section>
        ))}

        <RankingDePontos
          titulo="Pontos que mais levaram ao YouTube (30 dias)"
          ressalva="Conta cliques, não escutas — e não diz quem clicou: o servidor não guarda isso. A rota é aberta a quem não tem conta, então o número vale como sinal, não como medida exata."
          linhas={clicados}
          unidade={(n) => `${n} ${n === 1 ? "clique" : "cliques"}`}
          erro={erroRanking}
        />

        <RankingDePontos
          titulo="Pontos em mais playlists"
          ressalva="Sai dos repertórios montados, sem coleta nenhuma. Mede intenção de cantar, que é mais forte que clique — e por isso mexe devagar."
          linhas={emGiras}
          unidade={(n) => `${n} ${n === 1 ? "playlist" : "playlists"}`}
        />
      </div>
    </div>
  );
}
