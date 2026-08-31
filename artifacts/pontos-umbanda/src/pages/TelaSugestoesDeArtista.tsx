/**
 * A fila de "falta fulano aqui".
 *
 * ## O que esta fila decide, e o que ela NÃO decide
 *
 * A fila irmã (`TelaModerarArtistas`) responde *"esta pessoa é quem diz ser?"*
 * — e por isso mostra um código de prova. Esta responde outra coisa: *"este
 * canal merece uma página no acervo?"*. Não há o que provar, porque quem
 * sugeriu não controla o canal.
 *
 * Aprovar CRIA a página, curada e **sem dono**. Quem sugeriu não ganha poder
 * nenhum sobre ela; se quem mantém o canal quiser editá-la, o caminho continua
 * sendo o pedido com prova.
 *
 * ## Por que o aviso no topo
 *
 * Publicar alguém como "de Umbanda" sem essa pessoa ter pedido é exatamente o
 * que o pedido de remoção existe para desfazer — e o que se desfaz não apaga o
 * que já foi visto. Quem modera precisa ler isso antes de clicar, toda vez.
 *
 * ## Recusar exige motivo
 *
 * Sem ele a pessoa refaz a mesma sugestão para sempre. O botão só liga quando
 * há texto.
 */

import { useEffect, useState } from "react";
import { BadgeCheck, ExternalLink, Loader2, Mic2, XCircle } from "lucide-react";
import { mensagemDeErro } from "@/api/cliente";
import {
  aprovarSugestao,
  filaDeSugestoes,
  recusarSugestao,
  type SugestaoNaFila,
} from "@/api/sugestaoArtista";

export function TelaSugestoesDeArtista() {
  const [fila, setFila] = useState<SugestaoNaFila[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [motivos, setMotivos] = useState<Record<string, string>>({});

  function carregar() {
    filaDeSugestoes()
      .then(setFila)
      .catch((e) => setErro(mensagemDeErro(e, "Falha ao carregar.")));
  }

  useEffect(carregar, []);

  async function agir(id: string, oQue: "aprovar" | "recusar") {
    setOcupado(id);
    setErro(null);
    try {
      if (oQue === "aprovar") await aprovarSugestao(id);
      else await recusarSugestao(id, motivos[id] ?? "");
      carregar();
    } catch (problema) {
      setErro(mensagemDeErro(problema, "Não consegui agora."));
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="max-w-3xl px-4 pb-24 pt-5 sm:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
        <Mic2 className="h-6 w-6 text-primary" aria-hidden /> Sugestões de artista
      </h1>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">
        Canais que a comunidade apontou. Aprovar cria a página — <b>curada e sem
        dono</b>.
      </p>
      <p className="mb-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs leading-snug text-amber-200">
        Confira o canal antes. Publicar alguém como “de Umbanda” sem essa pessoa
        ter pedido é o que o pedido de remoção existe para desfazer — e o que se
        desfaz não apaga o que já foi visto.
      </p>

      {erro && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {erro}
        </p>
      )}

      {fila === null ? (
        erro ? null : (
          <div aria-busy="true" className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-muted/40" />
            ))}
          </div>
        )
      ) : fila.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhuma sugestão esperando.
        </p>
      ) : (
        <ul className="space-y-4">
          {fila.map((s) => (
            <li key={s.id} className="rounded-xl border bg-card/40 p-4">
              <p className="font-semibold text-foreground">{s.nomeDoCanal}</p>
              <p className="text-xs text-muted-foreground">
                sugerido por {s.apelido ?? "—"}
              </p>

              {/* O endereço é OPCIONAL de propósito — quem lembra do canal nem
                  sempre tem o link. Sem ele, quem modera procura pelo nome, e a
                  tela diz isso em vez de mostrar um botão morto. */}
              <div className="mt-3 rounded-lg bg-muted/40 p-3 text-sm">
                {s.canalUrl ? (
                  <a
                    href={s.canalUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex min-h-11 items-center gap-1.5 font-medium text-primary underline underline-offset-2"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden /> Abrir o canal
                  </a>
                ) : (
                  <span className="text-muted-foreground">
                    Sem endereço — procure pelo nome no YouTube.
                  </span>
                )}
              </div>

              {s.recado && (
                <p className="mt-2 text-sm text-muted-foreground">“{s.recado}”</p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void agir(s.id, "aprovar")}
                  disabled={ocupado === s.id}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {ocupado === s.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <BadgeCheck className="h-4 w-4" aria-hidden />
                  )}
                  Conferi o canal — criar a página
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-end gap-2">
                <label className="min-w-0 flex-1 text-xs">
                  <span className="mb-1 block text-muted-foreground">
                    Para recusar, diga por quê:
                  </span>
                  <input
                    value={motivos[s.id] ?? ""}
                    onChange={(e) => setMotivos((m) => ({ ...m, [s.id]: e.target.value }))}
                    maxLength={500}
                    placeholder="não é canal de Umbanda"
                    className="min-h-11 w-full rounded-md border bg-background p-2 text-sm"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void agir(s.id, "recusar")}
                  disabled={ocupado === s.id || (motivos[s.id] ?? "").trim().length < 3}
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
