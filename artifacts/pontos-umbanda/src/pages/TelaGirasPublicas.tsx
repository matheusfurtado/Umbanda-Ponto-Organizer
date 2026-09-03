import { useEffect, useMemo, useState } from "react";

import { semAcento } from "@/lib/destacar";
import { mensagemDeErro } from "@/api/cliente";
import { useAuth } from "@/auth/AuthContext";
import { girasDeQuemSigo, type GiraDeQuemSigo } from "@/api/perfil";
import { Globe, Users } from "lucide-react";
import { CartaoGira } from "@/componentes/CartaoGira";
import { publicas, type GiraNaVitrine } from "@/api/repertorio";

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
  const [giras, setGiras] = useState<GiraNaVitrine[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const { autenticado } = useAuth();
  const [deQuemSigo, setDeQuemSigo] = useState<GiraDeQuemSigo[]>([]);
  const [busca, setBusca] = useState("");

  // Por nome E por quem montou: numa vitrine de playlists de terreiro, "de
  // quem é" é metade do que se procura.
  const filtradas = useMemo(() => {
    if (giras === null) return null;
    const termo = semAcento(busca.trim());
    if (!termo) return giras;
    return giras.filter(
      (g) => semAcento(g.nome).includes(termo) || semAcento(g.de ?? "").includes(termo),
    );
  }, [busca, giras]);

  useEffect(() => {
    publicas()
      .then(setGiras)
      .catch((e) => setErro(mensagemDeErro(e, "Falha ao carregar.")));
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
        <Globe className="h-6 w-6 text-primary" aria-hidden /> Playlists
      </h1>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">
        Sequências que outras casas montaram e quiseram compartilhar.
      </p>

      {/* BUSCA por nome e por quem montou.
          
          Filtra o que já veio, sem ir ao servidor: a lista chega inteira nesta
          tela, e uma ida à rede a cada tecla daria espera onde não há
          necessidade. Se um dia ela crescer a ponto de vir paginada, é aqui que
          a busca passa a ser do servidor — e o campo já estará no lugar.
          
          Sem acento e sem caixa: quem procura "iemanja" tem de achar "Iemanjá".
          É a mesma regra do acervo, e a diferença entre as duas confundiria. */}
      <label className="mb-6 block">
        <span className="sr-only">Buscar playlist</span>
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar pelo nome da playlist ou por quem montou..."
          className="min-h-11 w-full rounded-md border bg-background px-3 text-sm"
        />
      </label>

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

      {/* O esqueleto some quando dá erro.
      
          `giras` fica `null` para sempre quando a busca falha, e o esqueleto
          olhava só para isso — então a página mostrava a mensagem de falha COM
          os cartões fantasmas animando embaixo, indefinidamente. Quem vê isso
          espera; e não há o que esperar, porque ninguém vai tentar de novo. */}
      {giras === null ? (
        erro ? null : (
          <div aria-busy="true" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-card/60 p-3">
                <div className="mb-3 aspect-square animate-pulse rounded-xl bg-muted/50" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted/50" />
              </div>
            ))}
          </div>
        )
      ) : filtradas!.length === 0 ? (
        // Duas ausências, duas frases: "não achei o que você procurou" e "ainda
        // não existe nenhuma" são coisas diferentes, e dizer a segunda para
        // quem buscou faz parecer que o acervo está vazio.
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {busca.trim() ? (
            <>Nenhuma playlist com esse nome ou de quem você procurou.</>
          ) : (
            <>
              Nenhuma playlist pública ainda. Se você montou uma que vale compartilhar,
              pode torná-la pública em{" "}
              <strong className="text-foreground">Minhas playlists</strong>.
            </>
          )}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtradas!.map((g) => (
            <CartaoGira
              key={g.id}
              id={g.id}
              nome={g.nome}
              de={g.de}
              pontos={g.pontos}
            />
          ))}
        </div>
      )}
    </div>
  );
}
