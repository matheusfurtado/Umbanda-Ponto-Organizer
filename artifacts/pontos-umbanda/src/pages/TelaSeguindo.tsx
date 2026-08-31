import { useEffect, useState } from "react";
import { mensagemDeErro } from "@/api/cliente";
import { Link } from "wouter";
import { Library, Mic2, Music2, Users } from "lucide-react";
import { Avatar } from "@/componentes/Avatar";
import { quemEuSigo, type PerfilResumo } from "@/api/perfil";
import { minhaBiblioteca, type ArtistaResumo } from "@/api/artista";

/**
 * A biblioteca: os artistas e as pessoas que eu sigo.
 *
 * **Só eu vejo esta lista.** Ela não aparece no meu perfil nem no de ninguém:
 * quem alguém segue num app de Umbanda é um mapa da rede religiosa dela, e o
 * servidor nem devolve os nomes para terceiros — só a contagem. Isso vale para
 * a metade de gente; artista seguido não revela pessoa nenhuma, mas a lista
 * inteira continua privada porque o conjunto também diz muito.
 *
 * Artista vem primeiro: é a metade que tem conteúdo do primeiro dia, enquanto
 * seguir gente depende de a comunidade existir.
 */
export function TelaSeguindo() {
  const [gente, setGente] = useState<PerfilResumo[] | null>(null);
  const [artistas, setArtistas] = useState<ArtistaResumo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    quemEuSigo()
      .then(setGente)
      .catch((e) => setErro(mensagemDeErro(e, "Falha ao carregar.")));
    minhaBiblioteca()
      .then(setArtistas)
      .catch((e) => setErro(mensagemDeErro(e, "Falha ao carregar.")));
  }, []);

  return (
    <div className="max-w-3xl px-4 pb-24 pt-5 sm:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
        <Library className="h-6 w-6 text-primary" aria-hidden /> Biblioteca
      </h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Esta lista é sua. Ninguém mais vê quem você segue.
      </p>

      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}

      <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-foreground">
        <Mic2 className="h-5 w-5 text-muted-foreground" aria-hidden /> Artistas
      </h2>
      {/* O esqueleto some quando dá erro. Sem isto, a metade que falhou fica
          com os cartões fantasmas animando ao lado da mensagem, para sempre —
          quem vê espera, e não há o que esperar. Mesmo defeito que a vitrine
          tinha. */}
      {artistas === null ? (
        erro ? null : (
          <div aria-busy="true" className="mb-8 space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/40" />
            ))}
          </div>
        )
      ) : artistas.length === 0 ? (
        <div className="mb-8 rounded-xl border border-dashed p-8 text-center">
          <Mic2 className="mx-auto mb-3 h-6 w-6 text-muted-foreground" aria-hidden />
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            Você ainda não segue nenhum artista.
          </p>
          <Link
            href="/artistas"
            className="mt-4 inline-block text-sm font-medium text-primary underline"
          >
            Ver os artistas do acervo
          </Link>
        </div>
      ) : (
        <div className="mb-8 space-y-2">
          {artistas.map((a) => (
            <Link
              key={a.id}
              href={`/artista/${encodeURIComponent(a.id)}`}
              className="flex items-center gap-3 rounded-xl border bg-card/40 p-3 transition hover:border-primary/40"
            >
              <span className="min-w-0">
                <span className="block truncate font-semibold text-foreground">
                  {a.nome}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Music2 className="h-3.5 w-3.5" aria-hidden />
                  {a.pontos} {a.pontos === 1 ? "ponto" : "pontos"}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}

      <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-foreground">
        <Users className="h-5 w-5 text-muted-foreground" aria-hidden /> Pessoas
      </h2>
      {gente === null ? (
        erro ? null : (
          <div aria-busy="true" className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/40" />
            ))}
          </div>
        )
      ) : gente.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <Users className="mx-auto mb-3 h-6 w-6 text-muted-foreground" aria-hidden />
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            Você ainda não segue ninguém. Nas playlists da comunidade dá para abrir o
            perfil de quem montou.
          </p>
          <Link
            href="/giras-publicas"
            className="mt-4 inline-block text-sm font-medium text-primary underline"
          >
            Ver playlists da comunidade
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {gente.map((p) => (
            <Link
              key={p.apelido}
              href={`/perfil/${encodeURIComponent(p.apelido)}`}
              className="flex items-center gap-3 rounded-xl border bg-card/40 p-3 transition hover:border-primary/40"
            >
              <Avatar apelido={p.apelido} foto={p.foto} />
              <span className="min-w-0">
                <span className="block truncate font-semibold text-foreground">
                  {p.apelido}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {p.giras} {p.giras === 1 ? "playlist pública" : "playlists públicas"}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
