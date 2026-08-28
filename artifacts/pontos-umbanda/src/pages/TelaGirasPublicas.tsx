import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { girasDeQuemSigo, type GiraDeQuemSigo } from "@/api/perfil";
import { Globe, Users } from "lucide-react";
import { CartaoGira } from "@/componentes/CartaoGira";
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
  const { autenticado } = useAuth();
  const [deQuemSigo, setDeQuemSigo] = useState<GiraDeQuemSigo[]>([]);

  useEffect(() => {
    publicas()
      .then(setGiras)
      .catch((e) => setErro(e instanceof Error ? e.message : "Falha ao carregar."));
  }, []);

  // O que dá sentido ao seguir. Sem isto, seguir alguém só mexia num número no
  // perfil dela — e ninguém segue para mudar um número.
  //
  // Falha em silêncio de propósito: se este pedaço não carregar, a vitrine
  // continua inteira logo abaixo. Um erro aqui não pode esvaziar a página que
  // é o canal de aquisição do produto.
  useEffect(() => {
    if (!autenticado) return;
    girasDeQuemSigo().then(setDeQuemSigo).catch(() => setDeQuemSigo([]));
  }, [autenticado]);

  return (
    <div className="max-w-5xl px-4 pb-24 pt-5 sm:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
        <Globe className="h-6 w-6 text-primary" aria-hidden /> Giras da comunidade
      </h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Sequências que outras casas montaram e quiseram compartilhar.
      </p>

      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}

      {deQuemSigo.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
            <Users className="h-4 w-4 text-primary" aria-hidden /> De quem você segue
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {deQuemSigo.map((g) => (
              <CartaoGira key={g.id} id={g.id} nome={g.nome} de={g.de} pontos={g.pontos} />
            ))}
          </div>
        </section>
      )}

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
            <CartaoGira
              key={g.id}
              id={g.id}
              nome={g.nome}
              de={g.de}
              pontos={g.itens.length}
            />
          ))}
        </div>
      )}
    </div>
  );
}
