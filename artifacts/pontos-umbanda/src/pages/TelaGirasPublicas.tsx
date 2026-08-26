import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Globe } from "lucide-react";
import { CapaGira } from "@/componentes/CapaGira";
import { publicas, type GiraPublica } from "@/api/repertorio";

/**
 * A vitrine das giras que as pessoas escolheram compartilhar.
 *
 * **Não exige conta.** É por aqui que o app circula no boca a boca do
 * terreiro, que é o canal de aquisição gratuito do produto — pedir cadastro
 * para ver mataria justamente isso.
 *
 * Cada cartão mostra o APELIDO de quem montou, nunca o e-mail.
 */
export function TelaGirasPublicas() {
  const [giras, setGiras] = useState<GiraPublica[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    publicas()
      .then(setGiras)
      .catch((e) => setErro(e instanceof Error ? e.message : "Falha ao carregar."));
  }, []);

  return (
    <div className="max-w-5xl px-4 pb-24 pt-5 sm:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
        <Globe className="h-6 w-6 text-primary" aria-hidden /> Giras da comunidade
      </h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Sequências que outras casas montaram e quiseram compartilhar.
      </p>

      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}

      {giras === null ? (
        <div aria-busy="true" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl bg-card/60 p-3">
              <div className="mb-3 aspect-square animate-pulse rounded-xl bg-muted/50" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted/50" />
            </div>
          ))}
        </div>
      ) : giras.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhuma gira pública ainda. Se você montou uma que vale compartilhar,
          pode torná-la pública em <strong className="text-foreground">Minhas giras</strong>.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {giras.map((g) => (
            <Link key={g.id} href={`/gira/${g.id}`}>
              <a className="block rounded-xl bg-card/60 p-3 transition hover:bg-accent/50">
                <span className="mb-3 block aspect-square w-full">
                  <CapaGira nome={g.nome} />
                </span>
                <span className="block truncate font-semibold text-foreground">{g.nome}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {g.de} · {g.itens.length} {g.itens.length === 1 ? "ponto" : "pontos"}
                </span>
              </a>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
