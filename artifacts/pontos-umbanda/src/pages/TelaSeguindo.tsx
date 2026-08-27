import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Users } from "lucide-react";
import { Avatar } from "@/componentes/Avatar";
import { quemEuSigo, type PerfilResumo } from "@/api/perfil";

/**
 * Quem eu sigo.
 *
 * **Só eu vejo esta lista.** Ela não aparece no meu perfil nem no de ninguém:
 * quem alguém segue num app de Umbanda é um mapa da rede religiosa dela, e o
 * servidor nem devolve os nomes para terceiros — só a contagem.
 */
export function TelaSeguindo() {
  const [gente, setGente] = useState<PerfilResumo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    quemEuSigo()
      .then(setGente)
      .catch((e) => setErro(e instanceof Error ? e.message : "Falha ao carregar."));
  }, []);

  return (
    <div className="max-w-3xl px-4 pb-24 pt-5 sm:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
        <Users className="h-6 w-6 text-primary" aria-hidden /> Seguindo
      </h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Esta lista é sua. Ninguém mais vê quem você segue.
      </p>

      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}

      {gente === null ? (
        <div aria-busy="true" className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : gente.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <Users className="mx-auto mb-3 h-6 w-6 text-muted-foreground" aria-hidden />
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            Você ainda não segue ninguém. Nas giras da comunidade dá para abrir o
            perfil de quem montou.
          </p>
          <Link
            href="/giras-publicas"
            className="mt-4 inline-block text-sm font-medium text-primary underline"
          >
            Ver giras da comunidade
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
                  {p.giras} {p.giras === 1 ? "gira pública" : "giras públicas"}
                </span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
