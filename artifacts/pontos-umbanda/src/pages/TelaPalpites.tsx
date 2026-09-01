/**
 * Escolher outro palpite de vídeo.
 *
 * ## O que faltava
 *
 * O casamento guarda os candidatos que não venceram, e o modelo do servidor diz
 * desde sempre que eles são "o que a tela de correção oferece". A tela nunca foi
 * feita — 1.538 candidatas paradas.
 *
 * A fila de `/moderacao/casamentos` só sabe dizer sim ou não ao palpite que a
 * heurística escolheu: recusar deixa o ponto **sem link nenhum**, mesmo quando
 * o vídeo certo está na lista, uma posição abaixo. E ela só enxerga `revisar`,
 * então os pontos marcados `nao_encontrado` ficavam fora de qualquer fila com
 * as candidatas deles intactas.
 *
 * ## A letra fica ao lado dos palpites
 *
 * Quem escolhe compara o VERSO com o título do vídeo. Se a letra exigir outra
 * tela, a escolha vira sorteio — e errar aqui é pôr o ponto de uma entidade no
 * vídeo de outra, que é o erro mais grave que este app pode cometer.
 *
 * ## Por que alguns dizem "volta ao app" e outros não
 *
 * A regra do acervo é "só fica o que tem gravação de artista conferida". Se o
 * canal do vídeo escolhido é de um artista curado, o ponto volta na hora; se
 * não é, ele ganha o link e continua fora. A tela diz qual dos dois aconteceu,
 * porque a diferença não é adivinhável de fora.
 */

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, ExternalLink, Loader2, Wand2 } from "lucide-react";
import { mensagemDeErro } from "@/api/cliente";
import {
  escolherPalpite, filaDePalpites, POR_VEZ, quantosPalpites,
  type PontoComPalpites, type QuantosPalpites,
} from "@/api/palpite";

export function TelaPalpites() {
  const [fila, setFila] = useState<PontoComPalpites[] | null>(null);
  const [quantos, setQuantos] = useState<QuantosPalpites | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [recado, setRecado] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [temMais, setTemMais] = useState(false);
  const [buscando, setBuscando] = useState(false);

  /**
   * `desde = quantos ainda estão na tela`, e não número de página: cada escolha
   * tira o ponto da fila, então ela encolhe enquanto se trabalha nela.
   */
  const trazer = useCallback(async (atual: PontoComPalpites[]) => {
    setBuscando(true);
    try {
      const novos = await filaDePalpites(atual.length);
      setTemMais(novos.length === POR_VEZ);
      const vistos = new Set(atual.map((p) => p.id));
      setFila([...atual, ...novos.filter((p) => !vistos.has(p.id))]);
    } catch (problema) {
      setErro(mensagemDeErro(problema, "Falha ao carregar."));
      setFila((f) => f ?? []);
    } finally {
      setBuscando(false);
    }
  }, []);

  useEffect(() => {
    void trazer([]);
    quantosPalpites().then(setQuantos).catch(() => undefined);
  }, [trazer]);

  async function escolher(pontoId: string, palpiteId: number) {
    setOcupado(palpiteId);
    setErro(null);
    setRecado(null);
    try {
      const r = await escolherPalpite(palpiteId);
      setRecado(
        r.voltouAoApp
          ? "Pronto — o canal é de artista curado, e o ponto voltou ao app."
          : "Vídeo escolhido. O ponto segue fora do app: o canal não é de "
            + "artista curado, e a regra é só ficar o que tem gravação conferida.",
      );
      const restam = (fila ?? []).filter((p) => p.id !== pontoId);
      setFila(restam);
      setQuantos((q) => (q === null ? q : { ...q, total: q.total - 1 }));
      if (restam.length === 0) void trazer(restam);
    } catch (problema) {
      setErro(mensagemDeErro(problema, "Não consegui agora."));
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="max-w-3xl px-4 pb-24 pt-5 sm:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
        <Wand2 className="h-6 w-6 text-primary" aria-hidden /> Outros palpites
      </h1>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">
        Pontos sem vídeo conferido que ainda têm candidatos guardados da busca
        automática. Aqui dá para escolher <strong className="text-foreground">
        outro</strong> — na fila de casamento só cabe sim ou não ao primeiro.
      </p>

      {quantos && (
        <p className="mb-6 rounded-lg border bg-muted/40 p-3 text-sm">
          <strong className="text-foreground">{quantos.total}</strong> pontos com
          palpite guardado
          {quantos.no_app > 0 && (
            <>
              {" — "}
              <strong className="text-foreground">{quantos.no_app}</strong> estão
              no app, e um link neles é ouvido hoje.
            </>
          )}
        </p>
      )}

      {recado && (
        <p className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          {recado}
        </p>
      )}
      {erro && <p role="alert" className="mb-4 text-sm text-destructive">{erro}</p>}

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
          Nenhum palpite esperando escolha.
        </p>
      ) : (
        <ul className="space-y-4">
          {fila.map((p) => (
            <li key={p.id} className="rounded-xl border bg-card/40 p-4">
              {/* O LUGAR primeiro: ponto de Oxalá casado com vídeo de Pomba
                  Gira é o erro mais comum, e só se vê comparando o topo do
                  ponto com o título do vídeo. */}
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                {p.orixa} · {p.subcategoria}
              </p>
              <p className="mt-1 font-semibold text-foreground">
                {p.titulo}
                {!p.noApp && (
                  <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
                    fora do app
                  </span>
                )}
              </p>
              {p.letra.trim() && (
                <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-2 font-sans text-xs text-muted-foreground">
                  {p.letra}
                </pre>
              )}

              <ul className="mt-3 space-y-2">
                {p.palpites.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3"
                  >
                    <p className="text-sm text-foreground">{c.titulo ?? "—"}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {c.canal ?? "canal desconhecido"}
                      {c.nota !== null && ` · nota ${c.nota.toFixed(2)}`}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-2"
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden /> Abrir o vídeo
                      </a>
                      <button
                        type="button"
                        onClick={() => void escolher(p.id, c.id)}
                        disabled={ocupado === c.id}
                        className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                      >
                        {ocupado === c.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                          <BadgeCheck className="h-4 w-4" aria-hidden />
                        )}
                        É este
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}

      {fila !== null && fila.length > 0 && temMais && (
        <button
          type="button"
          onClick={() => void trazer(fila)}
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
