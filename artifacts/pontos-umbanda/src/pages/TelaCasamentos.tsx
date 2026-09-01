/**
 * Conferir casamento — ponto × vídeo, um de cada vez.
 *
 * ## O que esta tela decide
 *
 * O casamento com o YouTube é heurístico, e a nota separa três estados. O
 * `revisar` é aquele em que a heurística **não teve certeza**. Até 01/09 o app
 * mostrava assim mesmo, com ícone diferente e o aviso "confira antes de usar" —
 * e quem está no meio da gira aperta o play e ouve outra coisa.
 *
 * Agora esses saem do acervo e vêm parar aqui. **Vale mais um ponto sem link do
 * que um link errado numa gira.**
 *
 * ## As três coisas na mesma tela
 *
 * Letra, vídeo e lugar do ponto (topo/seção) ficam juntos de propósito: o
 * trabalho é ler o primeiro verso, abrir o vídeo e decidir. Se qualquer uma
 * exigir outra tela, quem confere erra por cansaço — e errar aqui é pôr o ponto
 * de uma entidade no vídeo de outra.
 *
 * O topo é mostrado em destaque porque é o erro mais comum e o mais grave: um
 * ponto de Oxalá casado com vídeo de Pomba Gira.
 */

import { useEffect, useState } from "react";
import { BadgeCheck, ExternalLink, Loader2, Link2Off, ScanSearch, XCircle } from "lucide-react";
import { mensagemDeErro } from "@/api/cliente";
import {
  confirmarCasamento, filaDeCasamentos, POR_VEZ, quantosCasamentos,
  recusarCasamento, type CasamentoNaFila, type QuantosFaltam,
} from "@/api/casamento";

export function TelaCasamentos() {
  const [fila, setFila] = useState<CasamentoNaFila[] | null>(null);
  const [quantos, setQuantos] = useState<QuantosFaltam | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [temMais, setTemMais] = useState(false);
  const [buscando, setBuscando] = useState(false);

  /**
   * Traz mais um pedaço, a partir de quantos já estão na tela.
   *
   * `desde = lista.length` e não um número de página: cada decisão tira a
   * linha do `revisar`, então a fila ENCOLHE enquanto se trabalha nela. Quem
   * conferisse 10 itens e pedisse a "página 1" pularia 10 que nunca viu.
   *
   * Dedupe por id ao juntar: entre a decisão e a busca, o servidor pode ter
   * mandado o mesmo item em outra posição, e ponto repetido na fila é decisão
   * repetida.
   */
  async function trazerMais(atual: CasamentoNaFila[]) {
    setBuscando(true);
    try {
      const novos = await filaDeCasamentos(atual.length);
      setTemMais(novos.length === POR_VEZ);
      const vistos = new Set(atual.map((c) => c.id));
      setFila([...atual, ...novos.filter((c) => !vistos.has(c.id))]);
    } catch (problema) {
      setErro(mensagemDeErro(problema, "Falha ao carregar."));
      setFila((f) => f ?? []);
    } finally {
      setBuscando(false);
    }
  }

  function carregar() {
    void trazerMais([]);
    quantosCasamentos().then(setQuantos).catch(() => undefined);
  }

  useEffect(carregar, []);

  async function decidir(id: number, oQue: "confirmar" | "recusar") {
    setOcupado(id);
    setErro(null);
    try {
      if (oQue === "confirmar") await confirmarCasamento(id);
      else await recusarCasamento(id);
      // Tira da lista na hora, sem recarregar tudo: a fila tem centenas, e
      // recarregar a cada decisão faria a pessoa esperar por decisão.
      const restam = (fila ?? []).filter((c) => c.id !== id);
      setFila(restam);
      // Esvaziou: busca o próximo pedaço sozinha. Antes disto a tela ficava
      // vazia com o contador ainda dizendo que faltavam centenas, e a única
      // saída era recarregar o navegador — oito vezes às cegas para vencer 395.
      if (restam.length === 0) void trazerMais(restam);
      setQuantos((q) =>
        q === null ? q : { total: q.total - 1, principais: q.principais },
      );
    } catch (problema) {
      setErro(mensagemDeErro(problema, "Não consegui agora."));
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="max-w-3xl px-4 pb-24 pt-5 sm:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
        <ScanSearch className="h-6 w-6 text-primary" aria-hidden /> Verificar casamento
      </h1>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">
        Vídeos que a busca automática não confirmou. Enquanto estão aqui, o app
        <strong className="text-foreground"> não mostra o link</strong> — vale
        mais um ponto sem link do que um link errado numa gira.
      </p>

      {quantos && (
        <p className="mb-6 rounded-lg border bg-muted/40 p-3 text-sm">
          <strong className="text-foreground">{quantos.total}</strong> para
          conferir
          {quantos.principais > 0 && (
            <>
              {" — "}
              <strong className="text-foreground">{quantos.principais}</strong>{" "}
              deixam um ponto do acervo sem link enquanto esperam.
            </>
          )}
        </p>
      )}

      {erro && (
        <p role="alert" className="mb-4 text-sm text-destructive">{erro}</p>
      )}

      {fila === null ? (
        erro ? null : (
          <div aria-busy="true" className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-xl bg-muted/40" />
            ))}
          </div>
        )
      ) : fila.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nada para conferir.
        </p>
      ) : (
        <ul className="space-y-4">
          {fila.map((c) => (
            <li key={c.id} className="rounded-xl border bg-card/40 p-4">
              {/* O LUGAR primeiro: o erro mais comum e mais grave é o ponto de
                  uma entidade casado com vídeo de outra, e isso se vê aqui. */}
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {c.orixa} · {c.subcategoria}
              </p>
              <p className="mt-1 font-semibold text-foreground">{c.titulo}</p>
              {c.letra.trim() && (
                <pre className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-2 font-sans text-xs text-muted-foreground">
                  {c.letra}
                </pre>
              )}

              <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                <p className="text-sm text-foreground">{c.videoTitulo ?? "—"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {c.canal ?? "canal desconhecido"}
                  {c.confianca !== null && ` · confiança ${c.confianca.toFixed(2)}`}
                  {c.artistaNome && ` · artista: ${c.artistaNome}`}
                </p>
                {c.url && (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-2"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden /> Abrir o vídeo
                  </a>
                )}
              </div>

              {c.principal && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Link2Off className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  É o vídeo que o acervo mostraria. Recusar deixa este ponto sem
                  link até aparecer outro.
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void decidir(c.id, "confirmar")}
                  disabled={ocupado === c.id}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {ocupado === c.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <BadgeCheck className="h-4 w-4" aria-hidden />
                  )}
                  É este ponto
                </button>
                <button
                  type="button"
                  onClick={() => void decidir(c.id, "recusar")}
                  disabled={ocupado === c.id}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm font-medium disabled:opacity-60"
                >
                  <XCircle className="h-4 w-4" aria-hidden /> Não é
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Adiantar sem decidir. A busca automática cobre quem trabalha a fila
          até o fim; este botão é para quem quer pular adiante e escolher o que
          conferir — e é o que dá saída ao caso em que 50 itens seguidos são
          difíceis e ninguém quer decidir nenhum agora. */}
      {fila !== null && fila.length > 0 && temMais && (
        <button
          type="button"
          onClick={() => void trazerMais(fila)}
          disabled={buscando}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm font-medium disabled:opacity-60"
        >
          {buscando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Ver mais
        </button>
      )}

    </div>
  );
}
