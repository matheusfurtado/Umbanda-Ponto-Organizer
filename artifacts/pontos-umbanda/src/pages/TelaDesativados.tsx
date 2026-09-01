/**
 * Fora do app — o que saiu por não ter gravação de artista.
 *
 * ## Por que uma tela, e não só um número no painel
 *
 * O acervo virou catálogo por artista, e o ponto sem nenhuma gravação aparecia
 * nas listas de orixá como linha muda. Ele sai "por hora" — a marca é
 * reversível e nada foi apagado.
 *
 * Sem esta tela a desativação seria invisível: 88 pontos sumiriam do app e o
 * único jeito de saber quais era abrir o banco. Num acervo litúrgico isso é o
 * começo de uma perda silenciosa — ninguém confere o que não consegue listar.
 *
 * ## Agrupada por orixá, e não por data
 *
 * A pergunta que se faz aqui é *que pedaço do acervo está fora*, e isso se lê
 * seguindo a hierarquia. Uma fila ordenada pelo relógio responderia "o que saiu
 * por último", que ninguém perguntou.
 *
 * ## Sem botão de reativar
 *
 * O caminho de volta é o ponto GANHAR uma gravação de artista — e aí
 * `desativar_sem_artista --reativar` devolve em bloco. Um botão aqui devolveria
 * o ponto ao app no mesmo estado mudo que o tirou de lá. O que a tela oferece é
 * o atalho para a fila de casamento, onde o palpite vira gravação.
 */

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArchiveX, ScanSearch, Youtube } from "lucide-react";
import { mensagemDeErro } from "@/api/cliente";
import { pontosDesativados, type PontoDesativado } from "@/api/desativados";

/** Preserva a ordem que o servidor mandou — que é a ordem litúrgica. */
function porOrixa(lista: PontoDesativado[]) {
  const grupos = new Map<string, PontoDesativado[]>();
  for (const p of lista) {
    const atual = grupos.get(p.orixa);
    if (atual) atual.push(p);
    else grupos.set(p.orixa, [p]);
  }
  return [...grupos.entries()];
}

export function TelaDesativados() {
  const [lista, setLista] = useState<PontoDesativado[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    pontosDesativados()
      .then(setLista)
      .catch((e) => setErro(mensagemDeErro(e, "Falha ao carregar.")));
  }, []);

  const comPalpite = lista?.filter((p) => p.candidatas > 0).length ?? 0;

  return (
    <div className="max-w-3xl px-4 pb-24 pt-5 sm:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
        <ArchiveX className="h-6 w-6 text-primary" aria-hidden /> Fora do app
      </h1>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">
        Pontos sem nenhuma gravação de artista. Eles{" "}
        <strong className="text-foreground">não foram apagados</strong> — saíram
        das listas por hora, e voltam sozinhos quando aparecer uma gravação.
      </p>

      {lista && lista.length > 0 && (
        <p className="mb-6 rounded-lg border bg-muted/40 p-3 text-sm">
          <strong className="text-foreground">{lista.length}</strong> fora do app
          {comPalpite > 0 && (
            <>
              {" — "}
              <strong className="text-foreground">{comPalpite}</strong> já têm
              palpite de vídeo esperando na{" "}
              <Link
                href="/moderacao/casamentos"
                className="font-medium text-primary underline underline-offset-2"
              >
                fila de casamento
              </Link>
              .
            </>
          )}
        </p>
      )}

      {erro && <p role="alert" className="mb-4 text-sm text-destructive">{erro}</p>}

      {lista === null ? (
        erro ? null : (
          <div aria-busy="true" className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/40" />
            ))}
          </div>
        )
      ) : lista.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum ponto fora do app — todos têm gravação de artista.
        </p>
      ) : (
        <div className="space-y-6">
          {porOrixa(lista).map(([orixa, pontos]) => (
            <section key={orixa}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                {orixa} · {pontos.length}
              </h2>
              <ul className="space-y-2">
                {pontos.map((p) => (
                  <li key={p.id} className="rounded-xl border bg-card/40 p-3">
                    <p className="font-semibold text-foreground">{p.titulo}</p>
                    <p className="text-xs text-muted-foreground">{p.subcategoria}</p>
                    {p.letra.trim() && (
                      <pre className="mt-2 max-h-24 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-2 font-sans text-xs text-muted-foreground">
                        {p.letra}
                      </pre>
                    )}
                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {p.candidatas > 0 ? (
                        <span className="inline-flex items-center gap-1.5">
                          <ScanSearch className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          {p.candidatas} palpite{p.candidatas > 1 ? "s" : ""} de vídeo
                        </span>
                      ) : (
                        <span>nenhum palpite de vídeo ainda</span>
                      )}
                      {p.temVideo && (
                        <span className="inline-flex items-center gap-1.5">
                          <Youtube className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          tem vídeo, de canal não curado
                        </span>
                      )}
                    </p>
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
