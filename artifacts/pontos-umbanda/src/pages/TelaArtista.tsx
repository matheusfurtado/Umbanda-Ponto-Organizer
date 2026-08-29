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
import { mensagemDeErro } from "@/api/cliente";
import { Link, useRoute } from "wouter";
import { AlertTriangle, ExternalLink, Music2, Users } from "lucide-react";
import {
  agruparPorEntidade,
  buscaNoYoutube,
  maisOuvidos,
  verArtista,
  type Artista,
} from "@/api/artista";
import { PontoDoArtista as PontoDoArtistaLinha } from "@/componentes/PontoDoArtista";
import { BotaoSeguirArtista } from "@/componentes/BotaoSeguirArtista";
import { Denunciar } from "@/componentes/Denunciar";
import { PedirRemocao } from "@/componentes/PedirRemocao";
import { EditarArtista } from "@/componentes/EditarArtista";
import { registrarCliqueNoPonto } from "@/api/metricas";

export function TelaArtista() {
  const [, params] = useRoute("/artista/:id");
  const id = params?.id ?? "";
  const [artista, setArtista] = useState<Artista | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  /** `null` = todos. O id da entidade quando a pessoa escolhe um "álbum". */
  const [filtro, setFiltro] = useState<string | null>(null);

  // O componente NÃO é remontado quando só o `:id` muda — o `Route` é o mesmo.
  // Então tudo que é sobre o artista anterior precisa ser zerado à mão aqui, e
  // esquecer um estado não dá erro nenhum: dá a tela do outro artista.
  useEffect(() => {
    if (!id) return;
    setArtista(null);
    setErro(null);
    // O filtro é do artista que ficou para trás. Sem isto, ir de um artista
    // para outro (link, deep link, voltar/avançar entre dois `/artista/...`)
    // carregava o segundo já filtrado por uma entidade do primeiro — e se o
    // novo não gravou nada daquela entidade, a lista vinha VAZIA, sem estado
    // de vazio, porque `pontosDoArtista.length` não é zero. Uma página de
    // artista que parece não ter ponto nenhum.
    setFiltro(null);

    // E a resposta que chegar atrasada não escreve na tela do artista errado.
    // Duas trocas rápidas e a primeira requisição podia responder por último,
    // deixando o nome, a foto e os pontos de A embaixo da URL de B.
    let atual = true;
    verArtista(id)
      .then((a) => {
        if (atual) setArtista(a);
      })
      .catch((e) => {
        if (atual) setErro(mensagemDeErro(e, "Falha ao carregar."));
      });
    return () => {
      atual = false;
    };
  }, [id]);

  // Fora de `useMemo` por simplicidade: são até 44 pontos, e a página só
  // re-renderiza ao seguir, editar ou trocar de filtro.
  const grupos = artista ? agruparPorEntidade(artista.pontosDoArtista) : [];
  const visiveis = grupos.filter((g) => filtro === null || g.id === filtro);
  const populares = artista ? maisOuvidos(artista.pontosDoArtista) : [];

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
      <div className="mt-3 flex flex-col items-start gap-2">
        <Denunciar alvoTipo="artista" alvoId={artista.id} oQueE="esta página" />
        {/* Texto próprio, e não só "denunciar": quem é a pessoa da página não
            procura "denunciar esta página" — procura alguma coisa que diga
            "tire isto". Se o único caminho fosse a denúncia, a saída existiria
            e ninguém acharia. */}
        <PedirRemocao artistaId={artista.id} />
      </div>

      <h2 className="mb-3 mt-8 px-1 text-lg font-bold text-foreground">Pontos</h2>
      {artista.pontosDoArtista.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum ponto ligado a este artista por enquanto.
        </p>
      ) : (
        <>
          {/* MAIS OUVIDOS — a seção que o Spotify chama de "Popular".
              
              Some quando ninguém clicou ainda: um ranking de zeros ordenado
              por desempate é ruído com cara de informação. */}
          {populares.length > 0 && (
            <section aria-label="Mais ouvidos" className="mb-8">
              <h3 className="mb-2 px-1 text-sm font-semibold text-foreground">
                Mais ouvidos
              </h3>
              <ul className="space-y-1">
                {populares.map((p, i) => (
                  <PontoDoArtistaLinha key={p.id} ponto={p} posicao={i + 1} />
                ))}
              </ul>
            </section>
          )}

          {/* AS ENTIDADES COMO ÁLBUM. Chips e não abas de verdade: **9 no
              maior artista do acervo hoje** (medido: `pontos-de-umbanda`),
              mais o chip "Todos" — dez, que o `flex-wrap` acomoda em duas
              linhas. Um componente de aba com rolagem horizontal seria peso
              para uma escolha desse tamanho.
              
              O comentário dizia "até 8", e a decisão de desenho é justificada
              por esse número. Errado por um não muda o `flex-wrap`, mas é a
              razão escrita da escolha — e quem for reavaliar parte dela. */}
          <div className="mb-3 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setFiltro(null)}
              aria-pressed={filtro === null}
              className={`min-h-11 rounded-full px-3 text-sm transition ${
                filtro === null
                  ? "bg-primary text-primary-foreground"
                  : "border text-muted-foreground hover:border-primary/40"
              }`}
            >
              Todos
            </button>
            {grupos.map((g) => (
              <button
                key={g.id || "sem-orixa"}
                type="button"
                onClick={() => setFiltro(filtro === g.id ? null : g.id)}
                aria-pressed={filtro === g.id}
                className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm transition ${
                  filtro === g.id
                    ? "bg-primary text-primary-foreground"
                    : "border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <span aria-hidden>{g.emoji}</span>
                {g.nome}
                <span className="text-xs opacity-70">{g.pontos.length}</span>
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {/* Rede de segurança, e não o conserto: o filtro é zerado ao trocar
                de artista, então esta lista não deveria ficar vazia. Se ficar,
                a tela DIZ — em branco ela parece app quebrado, e quem vê um app
                quebrado não tenta de novo. */}
            {visiveis.length === 0 && (
              <div className="px-1 text-sm text-muted-foreground">
                <p>Nenhum ponto neste filtro.</p>
                <button
                  type="button"
                  onClick={() => setFiltro(null)}
                  className="mt-1 min-h-11 text-primary underline underline-offset-2"
                >
                  Ver todos
                </button>
              </div>
            )}
            {visiveis
              .map((grupo) => (
                <section key={grupo.id || "sem-orixa"} aria-label={grupo.nome}>
                  {/* O cabeçalho some quando já se filtrou por ele: o chip
                      aceso acima já diz o que se está vendo, e repetir logo
                      abaixo é ruído. */}
                  {filtro === null && (
                    <h3 className="mb-2 flex items-baseline gap-2 px-1">
                      <span aria-hidden className="text-base">
                        {grupo.emoji}
                      </span>
                      <span className="font-semibold text-foreground">
                        {grupo.nome}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {grupo.pontos.length}
                        {grupo.pontos.length === 1 ? " ponto" : " pontos"}
                      </span>
                    </h3>
                  )}
                  <ul
                    className="space-y-1 border-l-2 pl-3"
                    /* A cor da entidade como filete, e não como fundo: fundo
                       colorido deixaria a página listrada e competiria com o
                       título, que é o que a pessoa procura. */
                    style={{ borderColor: grupo.cor ?? "transparent" }}
                  >
                    {grupo.pontos.map((p) => (
                      <PontoDoArtistaLinha key={p.id} ponto={p} />
                    ))}
                  </ul>
                </section>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
