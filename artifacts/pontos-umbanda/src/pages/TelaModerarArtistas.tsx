/**
 * A fila de "este canal é meu".
 *
 * ## O que o moderador precisa ter à mão, e por quê
 *
 * O código e o link, lado a lado. A conferência é literalmente: abrir o canal,
 * procurar o código na descrição. Sem os dois na mesma linha, quem modera vai
 * caçar informação e vai errar por cansaço — e errar aqui é entregar a página
 * de um artista de verdade para outra pessoa.
 *
 * ## Recusar exige motivo
 *
 * Sem motivo, a pessoa refaz o mesmo pedido para sempre e a fila enche do mesmo
 * caso. O botão de recusar só liga quando há texto.
 */

import { useEffect, useState } from "react";
import { BadgeCheck, ExternalLink, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { mensagemDeErro } from "@/api/cliente";
import {
  aprovarPedidoDeArtista,
  filaDePedidosDeArtista,
  recusarPedidoDeArtista,
  type PedidoNaFila,
} from "@/api/pedidoArtista";

export function TelaModerarArtistas() {
  const [fila, setFila] = useState<PedidoNaFila[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [motivos, setMotivos] = useState<Record<string, string>>({});

  function carregar() {
    filaDePedidosDeArtista()
      .then(setFila)
      .catch((e) => setErro(mensagemDeErro(e, "Falha ao carregar.")));
  }

  useEffect(carregar, []);

  async function agir(id: string, o_que: "aprovar" | "recusar") {
    setOcupado(id);
    setErro(null);
    try {
      if (o_que === "aprovar") {
        await aprovarPedidoDeArtista(id);
      } else {
        await recusarPedidoDeArtista(id, motivos[id] ?? "");
      }
      carregar();
    } catch (problema) {
      setErro(
        mensagemDeErro(problema, "Não consegui agora."),
      );
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="max-w-3xl px-4 pb-24 pt-5 sm:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
        <ShieldCheck className="h-6 w-6 text-primary" aria-hidden /> Perfis de artista
      </h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Abra o canal e procure o código na descrição. É isso que prova que o
        canal é de quem pediu.
      </p>

      {erro && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {erro}
        </p>
      )}

      {fila === null ? (
        <div aria-busy="true" className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : fila.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum pedido esperando.
        </p>
      ) : (
        <ul className="space-y-4">
          {fila.map((p) => (
            <li key={p.id} className="rounded-xl border bg-card/40 p-4">
              <p className="font-semibold text-foreground">{p.nomeDoCanal}</p>
              <p className="text-xs text-muted-foreground">
                pedido por {p.apelido ?? "—"}
                {p.artistaId ? " · reivindicação" : " · canal novo"}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-muted/40 p-3">
                <code className="select-all rounded bg-background px-2 py-1 text-sm font-semibold tracking-wide text-foreground">
                  {p.codigo}
                </code>
                <a
                  href={p.canalUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-2"
                >
                  <ExternalLink className="h-4 w-4" aria-hidden /> Abrir o canal
                </a>
              </div>

              {p.recado && (
                <p className="mt-2 text-sm text-muted-foreground">“{p.recado}”</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void agir(p.id, "aprovar")}
                  disabled={ocupado === p.id}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {ocupado === p.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <BadgeCheck className="h-4 w-4" aria-hidden />
                  )}
                  Achei o código — aprovar
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-end gap-2">
                <label className="min-w-0 flex-1 text-xs">
                  <span className="mb-1 block text-muted-foreground">
                    Para recusar, diga por quê:
                  </span>
                  <input
                    value={motivos[p.id] ?? ""}
                    onChange={(e) =>
                      setMotivos((m) => ({ ...m, [p.id]: e.target.value }))
                    }
                    maxLength={500}
                    placeholder="o código não está na descrição do canal"
                    className="min-h-11 w-full rounded-md border bg-background p-2 text-sm"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void agir(p.id, "recusar")}
                  disabled={ocupado === p.id || (motivos[p.id] ?? "").trim().length < 3}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm font-medium disabled:opacity-60"
                >
                  <XCircle className="h-4 w-4" aria-hidden /> Recusar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
