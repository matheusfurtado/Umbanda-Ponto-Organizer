/**
 * A página de um artista: quem é, e os pontos que ele gravou.
 *
 * ## De onde vem "artista"
 *
 * Do canal do vídeo casado com cada ponto — é a única pista de autoria que o
 * acervo tem, porque `ponto.autor` está vazio nos 520 (a tradição é oral).
 * Por isso o aviso de coletânea: parte dos canais reúne gravação de terceiros,
 * e chamar isso de "artista" sem ressalva seria dar crédito errado.
 *
 * ## O link do canal ainda não é o canal
 *
 * Guardamos o NOME do canal, não o endereço. Até o outro cron preencher, o
 * botão leva a uma BUSCA no YouTube — e diz que é busca. Prometer "canal
 * oficial" e entregar resultado de busca é o tipo de mentirinha que corrói a
 * confiança em tudo mais que a tela afirma.
 */

import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import { AlertTriangle, ExternalLink, Music2, Users } from "lucide-react";
import {
  buscaNoYoutube,
  verArtista,
  type Artista,
} from "@/api/artista";
import { BotaoSeguirArtista } from "@/componentes/BotaoSeguirArtista";

export function TelaArtista() {
  const [, params] = useRoute("/artista/:id");
  const id = params?.id ?? "";
  const [artista, setArtista] = useState<Artista | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setArtista(null);
    setErro(null);
    verArtista(id)
      .then(setArtista)
      .catch((e) =>
        setErro(e instanceof Error ? e.message : "Falha ao carregar."),
      );
  }, [id]);

  if (erro) {
    return (
      <div className="max-w-3xl px-4 pb-24 pt-5 sm:px-8">
        <p role="alert" className="text-sm text-destructive">{erro}</p>
        <Link href="/artistas" className="mt-4 inline-block text-sm text-primary underline">
          Ver todos os artistas
        </Link>
      </div>
    );
  }

  if (artista === null) {
    return (
      <div aria-busy="true" className="max-w-3xl space-y-3 px-4 pb-24 pt-5 sm:px-8">
        <div className="h-24 animate-pulse rounded-2xl bg-muted/40" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/40" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl px-4 pb-24 pt-5 sm:px-8">
      <header className="rounded-2xl border bg-card/40 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Artista
        </p>
        <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">
          {artista.nome}
        </h1>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Music2 className="h-4 w-4" aria-hidden />
            {artista.pontos} {artista.pontos === 1 ? "ponto" : "pontos"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4" aria-hidden />
            {artista.seguidores}{" "}
            {artista.seguidores === 1 ? "seguidor" : "seguidores"}
          </span>
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <BotaoSeguirArtista
            artistaId={artista.id}
            seguindo={artista.seguindo}
            onMudou={(s) =>
              setArtista((a) =>
                a === null
                  ? a
                  : { ...a, seguindo: s, seguidores: a.seguidores + (s ? 1 : -1) },
              )
            }
          />
          <a
            href={artista.canalUrl ?? buscaNoYoutube(artista.nome)}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-2"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
            {artista.canalUrl ? "Abrir o canal" : "Procurar no YouTube"}
          </a>
        </div>

        {!artista.curado && (
          <p className="mt-4 flex gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              Reunimos estes pontos pelo canal de onde veio cada vídeo. Alguns
              canais são coletâneas e reúnem gravação de outras pessoas — ainda
              não conferimos um a um.
            </span>
          </p>
        )}
      </header>

      <h2 className="mb-2 mt-8 px-1 text-lg font-bold text-foreground">Pontos</h2>
      {artista.pontosDoArtista.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum ponto ligado a este artista por enquanto.
        </p>
      ) : (
        <ul className="space-y-2">
          {artista.pontosDoArtista.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-xl border bg-card/40 p-3"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium text-foreground">
                  {p.titulo}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {p.orixa}
                  {p.videoStatus === "revisar" && (
                    // A nota de confiança viaja SEMPRE com a URL: apresentar um
                    // casamento duvidoso como certo é mentir para quem clica.
                    <> · casamento a conferir</>
                  )}
                </span>
              </span>
              {p.videoUrl && (
                <a
                  href={p.videoUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-2"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  Ouvir
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
