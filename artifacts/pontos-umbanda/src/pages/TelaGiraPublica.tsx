import { useEffect, useState } from "react";
import { mensagemDeErro } from "@/api/cliente";
import { Link, useRoute } from "wouter";
import { Compartilhar } from "@/componentes/Compartilhar";
import { Denunciar } from "@/componentes/Denunciar";
import { useAuth } from "@/auth/AuthContext";
import { ArrowLeft, Globe, Youtube, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CapaGira } from "@/componentes/CapaGira";
import { giraPublica, type GiraPublica } from "@/api/repertorio";
import { registrarCliqueNoPonto } from "@/api/metricas";

/**
 * Uma gira pública, aberta por link — é assim que ela se compartilha.
 *
 * Abre sem conta. O portão continua valendo para QUEM OLHA: a letra e a
 * sequência vão, o link do vídeo só se quem está vendo tiver plano. Sem isso,
 * publicar uma gira seria caminho para entregar de graça o que o plano cobra.
 */
export function TelaGiraPublica() {
  // Denunciar exige conta: denúncia anônima não tem como ser contida.
  const { user } = useAuth();
  const autenticado = Boolean(user);
  const [, params] = useRoute("/gira/:id");
  const [gira, setGira] = useState<GiraPublica | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    giraPublica(params.id)
      .then(setGira)
      .catch((e) => setErro(mensagemDeErro(e, "Falha.")));
  }, [params?.id]);

  if (erro) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">{erro}</p>
        <Link href="/giras-publicas">
          <Button variant="ghost" className="mt-4">Ver outras giras</Button>
        </Link>
      </div>
    );
  }

  if (!gira) {
    return (
      <div aria-busy="true" className="max-w-3xl px-4 pt-5 sm:px-8">
        <div className="h-40 w-40 animate-pulse rounded-xl bg-muted/50" />
      </div>
    );
  }

  const duracao = gira.itens.reduce((t, i) => t + (i.videoDuracaoSeg ?? 0), 0);

  return (
    <div className="min-h-full">
      <div className="max-w-3xl px-4 pb-24 pt-5 sm:px-8">
        <Link href="/giras-publicas">
          <Button variant="ghost" size="sm" className="-ml-2 mb-4 gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Giras da comunidade
          </Button>
        </Link>

        <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end">
          <div className="h-32 w-32 shrink-0 sm:h-40 sm:w-40">
            <CapaGira nome={gira.nome} />
          </div>
          <div className="min-w-0 pb-1">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Globe className="h-3.5 w-3.5" aria-hidden /> Gira pública
            </p>
            <h1 className="mt-1 break-words text-3xl font-black leading-tight text-foreground sm:text-4xl">
              {gira.nome}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {/* Leva ao perfil de quem montou — é daqui que se descobre
                  gente para seguir, como no Spotify se chega ao artista pela
                  música. "Anônimo" não é link: é o rótulo de quando o apelido
                  falta, e não corresponde a perfil nenhum. */}
              por{" "}
              {gira.de && gira.de !== "Anônimo" ? (
                <Link
                  href={`/perfil/${encodeURIComponent(gira.de)}`}
                  className="font-medium text-foreground underline decoration-muted-foreground/40 underline-offset-2 hover:decoration-foreground"
                >
                  {gira.de}
                </Link>
              ) : (
                <strong className="font-medium text-foreground">{gira.de}</strong>
              )}
              {" · "}{gira.itens.length} {gira.itens.length === 1 ? "ponto" : "pontos"}
              {duracao > 0 && ` · cerca de ${Math.round(duracao / 60)} min`}
            </p>
            {/* A gira é o que circula no grupo do terreiro — e era o que menos
                tinha como circular: nem botão havia. Ver ADR 0006. */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Compartilhar titulo={`${gira.nome} — Pontos de Umbanda`} caminho={`/gira/${gira.id}`} />
              {autenticado && (
                <Denunciar alvoTipo="gira" alvoId={gira.id} oQueE="esta gira" />
              )}
            </div>
          </div>
        </div>

        {gira.itens.map((i, n) => {
          const incerto = i.videoStatus === "revisar";
          return (
            <div key={`${n}:${i.pontoId}`} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-accent/40">
              <span className="w-6 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
                {n + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-foreground">
                  {i.titulo ?? <em className="text-muted-foreground">ponto removido do acervo</em>}
                </span>
                {(i.autor || i.videoCanal?.trim() || i.secao) && (
                  <span className="block truncate text-xs text-muted-foreground">
                    {[i.secao, i.autor || i.videoCanal?.trim()].filter(Boolean).join(" · ")}
                  </span>
                )}
              </span>
              {i.videoDuracaoSeg ? (
                <span className="hidden w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground sm:block">
                  {Math.floor(i.videoDuracaoSeg / 60)}:
                  {String(i.videoDuracaoSeg % 60).padStart(2, "0")}
                </span>
              ) : null}
              {i.videoUrl && (
                <a
                  href={i.videoUrl}
                  onClick={() => registrarCliqueNoPonto(i.pontoId, "gira")}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Ouvir ${i.titulo ?? "ponto"} no YouTube`}
                  className={`flex min-h-11 shrink-0 items-center px-2 ${
                    incerto ? "text-amber-400" : "text-red-400"
                  }`}
                >
                  {incerto ? <AlertTriangle className="h-4 w-4" /> : <Youtube className="h-4 w-4" />}
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
