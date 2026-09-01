/**
 * A estante: orixás e playlists que a pessoa guardou.
 *
 * ADR 0009, palavras dele: *"seria uma biblioteca de playlist, algo parecido
 * como o meus artistas, só que com playlist"*.
 *
 * ## Vazia é o estado NORMAL, e a tela diz o que fazer
 *
 * *"o organizar acervo tem que nascer vazio"*. Uma estante vazia com uma
 * mensagem de erro, ou vazia e muda, faria parecer defeito — quando é o começo
 * previsto. O vazio aqui é convite, com os dois caminhos de saída.
 *
 * ## Nome e contagem vêm do servidor a cada leitura
 *
 * Guardar é referência, não cópia: a playlist pode ter ganhado pontos desde que
 * foi guardada, o orixá pode ter perdido. Congelar o número na hora de guardar
 * reproduziria o defeito do acervo copiado, que envelhece sozinho.
 */

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { BookMarked, ListMusic, Loader2, Sparkles } from "lucide-react";
import { mensagemDeErro } from "@/api/cliente";
import { minhaBiblioteca, tirarDaBiblioteca, type ItemGuardado } from "@/api/biblioteca";

export function Estante() {
  const [itens, setItens] = useState<ItemGuardado[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  useEffect(() => {
    minhaBiblioteca()
      .then(setItens)
      .catch((e) => setErro(mensagemDeErro(e, "Falha ao carregar.")));
  }, []);

  async function tirar(item: ItemGuardado) {
    const chave = `${item.alvoTipo}:${item.alvoId}`;
    setOcupado(chave);
    setErro(null);
    try {
      await tirarDaBiblioteca(item.alvoTipo, item.alvoId);
      setItens((l) =>
        l === null
          ? l
          : l.filter((i) => !(i.alvoTipo === item.alvoTipo && i.alvoId === item.alvoId)),
      );
    } catch (problema) {
      setErro(mensagemDeErro(problema, "Não consegui agora."));
    } finally {
      setOcupado(null);
    }
  }

  const onde = (i: ItemGuardado) =>
    i.alvoTipo === "orixa" ? `/orixa/${i.alvoId}` : `/gira/${i.alvoId}`;

  return (
    <section>
      <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
        <BookMarked className="h-5 w-5 text-primary" aria-hidden /> Minha biblioteca
      </h2>

      {erro && <p role="alert" className="mt-2 text-sm text-destructive">{erro}</p>}

      {itens === null ? (
        erro ? null : (
          <div aria-busy="true" className="mt-3 space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/40" />
            ))}
          </div>
        )
      ) : itens.length === 0 ? (
        <div className="mt-3 rounded-xl border border-dashed p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Sua biblioteca está vazia — e é assim que ela começa. Guarde um orixá
            ou uma playlist e ele aparece aqui.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm font-medium"
            >
              <Sparkles className="h-4 w-4" aria-hidden /> Ver os orixás
            </Link>
            <Link
              href="/giras-publicas"
              className="inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm font-medium"
            >
              <ListMusic className="h-4 w-4" aria-hidden /> Playlists da comunidade
            </Link>
          </div>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {itens.map((i) => (
            <li
              key={`${i.alvoTipo}:${i.alvoId}`}
              className="flex items-center gap-3 rounded-xl border bg-card/40 p-3"
            >
              <Link href={onde(i)} className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-foreground">
                  {i.nome}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {i.alvoTipo === "orixa" ? "Orixá" : "Playlist"}
                  {i.de && ` de ${i.de}`}
                  {" · "}
                  {i.pontos} {i.pontos === 1 ? "ponto" : "pontos"}
                </span>
              </Link>
              <button
                type="button"
                onClick={() => void tirar(i)}
                disabled={ocupado === `${i.alvoTipo}:${i.alvoId}`}
                aria-label={`Tirar ${i.nome} da biblioteca`}
                className="inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm font-medium disabled:opacity-60"
              >
                {ocupado === `${i.alvoTipo}:${i.alvoId}` && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                )}
                Tirar
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
