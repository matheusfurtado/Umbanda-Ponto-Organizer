import { useEffect, useState } from "react";
import { mensagemDeErro } from "@/api/cliente";
import { Link, useRoute } from "wouter";
import { BotaoGuardar } from "@/componentes/BotaoGuardar";
import { Compartilhar } from "@/componentes/Compartilhar";
import { Denunciar } from "@/componentes/Denunciar";
import { useAuth } from "@/auth/AuthContext";
import { ArrowLeft, Globe, Youtube, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CapaGira } from "@/componentes/CapaGira";
import { giraPorLink, giraPublica, type GiraPublica } from "@/api/repertorio";
import { registrarCliqueNoPonto } from "@/api/metricas";
import { duracao } from "@/lib/duracao";
import { ConviteParaAssinar } from "@/componentes/ConviteParaAssinar";

/**
 * Uma gira de outra pessoa — pela vitrine (`/gira/:id`) ou pelo link que o dono
 * mandou (`/g/:token`).
 *
 * ## Duas portas, uma tela
 *
 * A gira da vitrine é achável por qualquer um; a do link não aparece em lista
 * nenhuma e só abre para quem tem o endereço. O que a pessoa VÊ é idêntico, e
 * por isso é a mesma tela: duplicá-la faria as duas envelhecerem separadas.
 *
 * ## O que mudou em 03/09
 *
 * - **Pede conta.** Antes abria para anônimo. Decisão dele: *"acho que o link a
 *   pessoa precisa estar logada também"*. É conta, não plano — a gira
 *   compartilhada é o ANÚNCIO do produto, e anúncio que só o cliente vê não
 *   anuncia nada.
 * - **O vídeo vai para todo mundo.** Este arquivo dizia que o link do vídeo
 *   dependia do plano de quem olha; deixou de depender no mesmo dia (ADR 0002).
 */
export function TelaGiraPublica() {
  // Denunciar exige conta: denúncia anônima não tem como ser contida.
  const { user } = useAuth();
  const autenticado = Boolean(user);
  // As duas portas. `useRoute` devolve nulo para a que não casou, então a
  // ordem aqui não é preferência — é só qual delas existe nesta URL.
  const [, porId] = useRoute("/gira/:id");
  const [, porLink] = useRoute("/g/:token");
  const token = porLink?.token ?? null;
  const chave = token ?? porId?.id ?? null;
  const [gira, setGira] = useState<GiraPublica | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // O `Route path="/gira/:id"` NÃO remonta quando só o parâmetro muda — ir de
  // uma gira para outra (voltar/avançar do navegador entre dois links de gira)
  // deixava a anterior na tela até a nova chegar, e a resposta atrasada da
  // primeira podia vencer a da segunda. É o mesmo desenho do `TelaArtista`.
  useEffect(() => {
    if (!chave) return;
    setGira(null);
    setErro(null);
    let atual = true;
    (token ? giraPorLink(token) : giraPublica(chave))
      .then((g) => {
        if (atual) setGira(g);
      })
      .catch((e) => {
        if (atual) setErro(mensagemDeErro(e, "Não consegui abrir esta playlist."));
      });
    return () => {
      atual = false;
    };
  }, [chave, token]);

  if (erro) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">{erro}</p>
        <Link href="/giras-publicas">
          <Button variant="ghost" className="mt-4">Ver outras playlists</Button>
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

  // Segundos somados da gira inteira. Nome diferente do helper `duracao`
  // de propósito: um é total em segundos, o outro formata um item.
  const segundosDaGira = gira.itens.reduce((t, i) => t + (i.videoDuracaoSeg ?? 0), 0);

  return (
    <div className="min-h-full">
      <div className="max-w-3xl px-4 pb-24 pt-5 sm:px-8">
        <Link href="/giras-publicas">
          <Button variant="ghost" size="sm" className="-ml-2 mb-4 gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Playlists
          </Button>
        </Link>

        <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end">
          <div className="h-32 w-32 shrink-0 sm:h-40 sm:w-40">
            <CapaGira nome={gira.nome} />
          </div>
          <div className="min-w-0 pb-1">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Globe className="h-3.5 w-3.5" aria-hidden /> Playlist pública
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
              {segundosDaGira > 0 &&
                ` · cerca de ${Math.round(segundosDaGira / 60)} min`}
            </p>
            {/* A gira é o que circula no grupo do terreiro — e era o que menos
                tinha como circular: nem botão havia. Ver ADR 0006. */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Compartilhar titulo={`${gira.nome} — Pontos de Umbanda`} caminho={`/gira/${gira.id}`} />
              {/* GUARDAR, e não copiar (ADR 0009): a playlist continua sendo de
                  quem montou, e o que entra na minha biblioteca é a referência.
                  Copiar congelaria o estado de hoje e me daria uma segunda
                  playlist com o mesmo nome. */}
              <BotaoGuardar alvoTipo="playlist" alvoId={gira.id} nome={gira.nome} />
              {autenticado && (
                <Denunciar alvoTipo="gira" alvoId={gira.id} oQueE="esta playlist" />
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
              {duracao(i.videoDuracaoSeg) && (
                <span className="hidden w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground sm:block">
                  {duracao(i.videoDuracaoSeg)}
                </span>
              )}
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

      {/* O CONVITE VAI AQUI, e não no topo.
          Quem abriu esta tela acabou de ver a gira de outra pessoa montada —
          com seções, ordem e duração. É o único lugar do app onde a pessoa já
          entendeu o que o plano faz antes de alguém lhe dizer. Pôr a faixa
          antes da lista invertia isso: vendia a ferramenta para quem ainda não
          tinha visto o que ela produz. */}
      <div className="mt-8">
        <ConviteParaAssinar
          motivo={`${gira.de} montou esta playlist no app. Monte a sua.`}
        />
      </div>
    </div>
  );
}
