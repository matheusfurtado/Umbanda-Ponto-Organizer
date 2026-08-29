/**
 * A fila de quem pediu para sair das páginas de artista.
 *
 * ## O que esta tela decide
 *
 * O pedido **já tirou a página do ar** — esconde primeiro, revisa depois, e o
 * motivo está em `routers/artista.pedir_remocao`: o estrago é assimétrico.
 * Página escondida à toa volta com um clique daqui; pessoa publicada como "de
 * Umbanda" sem ter pedido não desfaz o que já foi visto.
 *
 * Então as duas ações não são "aprovar" e "recusar", e o texto não finge que
 * são: é **restaurar** (o pedido não procedia, a página volta) ou **manter
 * fora** (procedia, e a decisão sai da fila).
 *
 * ## Por que não exige nada de quem pediu
 *
 * Contato e explicação são opcionais, então a maioria dos cards vai chegar
 * vazia. Isso é esperado e não é sinal de má-fé: quem quer sair de um app de
 * Umbanda pode não querer deixar nem nome. A tela diz isso para quem modera
 * não ler o vazio como suspeita.
 */

import { useEffect, useState } from "react";
import { mensagemDeErro } from "@/api/cliente";
import { EyeOff, Loader2, RotateCcw, ShieldCheck } from "lucide-react";
import {
  filaDeRemocoes,
  manterArtistaOculto,
  restaurarArtista,
  type RemocaoNaFila,
} from "@/api/artista";

export function TelaRemocoesDeArtista() {
  const [fila, setFila] = useState<RemocaoNaFila[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  function carregar() {
    filaDeRemocoes()
      .then((f) => setFila(f ?? []))
      .catch((e) => setErro(mensagemDeErro(e, "Falha ao carregar.")));
  }

  useEffect(carregar, []);

  async function decidir(id: string, o_que: "restaurar" | "manter") {
    setOcupado(id);
    setErro(null);
    try {
      if (o_que === "restaurar") {
        await restaurarArtista(id);
      } else {
        await manterArtistaOculto(id);
      }
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
        <ShieldCheck className="h-6 w-6 text-primary" aria-hidden /> Pedidos para sair
      </h1>
      <p className="mb-6 mt-1 text-sm leading-relaxed text-muted-foreground">
        Estas páginas <strong className="text-foreground">já estão fora do ar</strong>.
        O pedido esconde na hora, e você decide se restaura. Contato e
        explicação são opcionais — pedido vazio é comum, não é sinal de má-fé.
      </p>

      {erro && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {erro}
        </p>
      )}

      {fila === null ? (
        <div aria-busy="true" className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted/40" />
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
              <p className="font-semibold text-foreground">{p.artistaNome}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(p.criadoEm).toLocaleString("pt-BR")}
              </p>

              {p.relato ? (
                <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/90">
                  {p.relato}
                </p>
              ) : (
                <p className="mt-3 text-sm italic text-muted-foreground">
                  Sem explicação.
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {p.contato ? `Contato: ${p.contato}` : "Sem contato para resposta."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void decidir(p.id, "manter")}
                  disabled={ocupado !== null}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm font-medium disabled:opacity-60"
                >
                  {ocupado === p.id && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                  <EyeOff className="h-4 w-4" aria-hidden /> Manter fora
                </button>
                <button
                  type="button"
                  onClick={() => void decidir(p.id, "restaurar")}
                  disabled={ocupado !== null}
                  className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm text-muted-foreground disabled:opacity-60"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden /> Restaurar a página
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
