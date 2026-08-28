/**
 * A página de um artista: quem é, e os pontos que ele gravou.
 *
 * ## De onde vem "artista"
 *
 * Do canal do vídeo casado com cada ponto — é a única pista de autoria que o
 * acervo tem, porque `ponto.autor` está vazio nos 520 (a tradição é oral).
 *
 * **Canal que publica ponto é artista**, decidido pelo dono em 28/08, e isso
 * inclui canal de festival e de terreiro. Eu tinha proposto separar "artista"
 * de "coletânea"; ele descartou a distinção, e a razão é boa: para quem usa o
 * app, o canal é onde se acha o ponto e é o que se segue.
 *
 * O aviso que sobrou é sobre CONFERÊNCIA, não sobre tipo: o corte que traz um
 * canal para cá é automático, e automático não é conferido.
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
  agruparPorEntidade,
  buscaNoYoutube,
  verArtista,
  type Artista,
} from "@/api/artista";
import { BotaoSeguirArtista } from "@/componentes/BotaoSeguirArtista";
import { Denunciar } from "@/componentes/Denunciar";
import { EditarArtista } from "@/componentes/EditarArtista";
import { registrarCliqueNoPonto } from "@/api/metricas";

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
        <div className="flex items-start gap-4">
          {artista.foto ? (
            <img
              src={artista.foto}
              alt=""
              width={72}
              height={72}
              className="h-18 w-18 shrink-0 rounded-full object-cover"
              style={{ width: 72, height: 72 }}
            />
          ) : (
            // Sem foto, a inicial do nome. Vazio deixaria o cabeçalho torto e
            // faria a página parecer quebrada em vez de simplesmente nova.
            <span
              aria-hidden
              className="flex shrink-0 items-center justify-center rounded-full bg-primary/15 text-2xl font-black text-primary"
              style={{ width: 72, height: 72 }}
            >
              {artista.nome.trim().charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Artista
            </p>
            <h1 className="mt-1 text-2xl font-black text-foreground sm:text-3xl">
              {artista.nome}
            </h1>
          </div>
        </div>
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

        {artista.bio && (
          <p className="mt-4 whitespace-pre-line text-sm text-foreground/90">
            {artista.bio}
          </p>
        )}

        {artista.possoEditar && (
          <div className="mt-4">
            <EditarArtista
              artista={artista}
              onMudou={(a) => setArtista(a)}
            />
          </div>
        )}

        {!artista.curado && (
          <p className="mt-4 flex gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>
              Reunimos estes pontos pelo canal de onde veio cada vídeo, e este
              canal ainda não foi conferido por uma pessoa.
            </span>
          </p>
        )}
      </header>

      {/* Discreto e no fim do cabeçalho, nunca ao lado de "Seguir": botão de
          denúncia em destaque convida a denúncia por desavença. A bio é texto
          público escrito por quem não modera, e sem este caminho a única
          remediação seria apagar o artista — levando junto os pontos e quem
          seguia. */}
      <div className="mt-3">
        <Denunciar alvoTipo="artista" alvoId={artista.id} oQueE="esta página" />
      </div>

      <h2 className="mb-2 mt-8 px-1 text-lg font-bold text-foreground">Pontos</h2>
      {artista.pontosDoArtista.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum ponto ligado a este artista por enquanto.
        </p>
      ) : (
        /* SEPARADO POR ENTIDADE, como o Spotify separa por álbum.

           O ganho está no que SAIU: o nome do orixá repetia em toda linha, e
           subir para o cabeçalho do bloco deixa a lista mais leve, não mais
           pesada. Era esse o pedido de "algo mais sutil".

           Cabeçalho e não card: um card por entidade transformaria os 8 grupos
           da Juliana em 8 caixas, e a página viraria uma parede. Aqui é uma
           linha com o emoji e a contagem, e um filete da cor da entidade à
           esquerda dos pontos — amarra o bloco sem desenhar moldura. */
        <div className="space-y-6">
          {agruparPorEntidade(artista.pontosDoArtista).map((grupo) => (
            <section key={grupo.id || "sem-orixa"} aria-label={grupo.nome}>
              <h3 className="mb-2 flex items-baseline gap-2 px-1">
                <span aria-hidden className="text-base">
                  {grupo.emoji}
                </span>
                <span className="font-semibold text-foreground">{grupo.nome}</span>
                <span className="text-xs text-muted-foreground">
                  {grupo.pontos.length}
                  {grupo.pontos.length === 1 ? " ponto" : " pontos"}
                </span>
              </h3>
              <ul
                className="space-y-1 border-l-2 pl-3"
                /* A cor da entidade, e só ela: um filete. Pintar o fundo com a
                   cor do orixá deixaria a página listrada, e cor forte compete
                   com o título, que é o que a pessoa está procurando. */
                style={{ borderColor: grupo.cor ?? "transparent" }}
              >
                {grupo.pontos.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 transition hover:bg-accent/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-foreground">
                        {p.titulo}
                      </span>
                      {p.videoStatus === "revisar" && (
                        /* A nota de confiança viaja SEMPRE com a URL:
                           apresentar um casamento duvidoso como certo é mentir
                           para quem clica. */
                        <span className="block text-xs text-muted-foreground">
                          casamento a conferir
                        </span>
                      )}
                    </span>
                    {p.videoUrl && (
                      <a
                        href={p.videoUrl}
                        onClick={() => registrarCliqueNoPonto(p.id, "artista")}
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={`Ouvir ${p.titulo} no YouTube`}
                        className="inline-flex min-h-11 shrink-0 items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-2"
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden />
                        Ouvir
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
