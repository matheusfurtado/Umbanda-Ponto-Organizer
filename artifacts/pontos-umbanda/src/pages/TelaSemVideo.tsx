/**
 * Pontos sem vídeo — e o pedido de ajuda à comunidade.
 *
 * ## O que ela resolve
 *
 * Recusar um casamento marca o ponto como `nao_encontrado`: a letra fica, o link
 * some. Até aqui esse ponto sumia de vista — não estava em fila nenhuma, e a
 * única forma de reencontrá-lo era topar com ele no acervo. Agora tem endereço,
 * separado por orixá.
 *
 * ## A letra vem inteira, e é o pedido
 *
 * É a letra que faz alguém reconhecer o ponto e lembrar de onde ouviu. Um título
 * solto não desperta memória de ninguém — e é memória que esta página está
 * pedindo emprestado. Por isso ela ocupa o espaço que ocuparia um resumo.
 *
 * ## Quem não tem conta lê e não indica
 *
 * A lista é pública porque a letra é grátis (ADR 0002) e porque é pedindo ajuda
 * que se recebe ajuda. Indicar exige conta pelo mesmo motivo que enviar ponto
 * exige: não é para cobrar, é para haver alguém do outro lado quando a indicação
 * estiver errada.
 */

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Loader2, VideoOff } from "lucide-react";
import { mensagemDeErro } from "@/api/cliente";
import { useAuth } from "@/auth/AuthContext";
import {
  indicarVideo, pontosSemVideo, type SemVideoPorOrixa,
} from "@/api/semVideo";

export function TelaSemVideo() {
  const { user } = useAuth();
  const [grupos, setGrupos] = useState<SemVideoPorOrixa[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [abertos, setAbertos] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [feitos, setFeitos] = useState<Record<string, string>>({});

  useEffect(() => {
    pontosSemVideo()
      .then(setGrupos)
      .catch((e) => setErro(mensagemDeErro(e, "Falha ao carregar.")));
  }, []);

  const total = (grupos ?? []).reduce((n, g) => n + g.pontos.length, 0);

  async function indicar(pontoId: string) {
    const url = (abertos[pontoId] ?? "").trim();
    if (!url) return;
    setOcupado(pontoId);
    setErro(null);
    try {
      const r = await indicarVideo(pontoId, url);
      setFeitos((f) => ({ ...f, [pontoId]: r.recado }));
      setAbertos((a) => ({ ...a, [pontoId]: "" }));
    } catch (problema) {
      setErro(mensagemDeErro(problema, "Não consegui agora."));
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div className="max-w-3xl px-4 pb-24 pt-5 sm:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
        <VideoOff className="h-6 w-6 text-primary" aria-hidden /> Pontos sem vídeo
      </h1>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">
        Estes pontos estão no app, mas ninguém consegue ouvir: não achamos a
        gravação, ou a que achamos não era essa.{" "}
        <strong className="text-foreground">Se você conhece o vídeo de algum,
        aponta pra gente.</strong>
      </p>

      {grupos !== null && total > 0 && (
        <p className="mb-6 rounded-lg border bg-muted/40 p-3 text-sm">
          <strong className="text-foreground">{total}</strong>{" "}
          {total === 1 ? "ponto esperando" : "pontos esperando"} um vídeo, em{" "}
          {grupos.length} {grupos.length === 1 ? "entidade" : "entidades"}.
        </p>
      )}

      {!user && (
        <p className="mb-6 rounded-lg border p-3 text-sm text-muted-foreground">
          Para apontar um vídeo é preciso{" "}
          <Link href="/login" className="font-medium text-primary underline underline-offset-2">
            entrar
          </Link>
          . A lista continua aberta para quem só quiser ver o que falta.
        </p>
      )}

      {erro && <p role="alert" className="mb-4 text-sm text-destructive">{erro}</p>}

      {grupos === null ? (
        erro ? null : (
          <div aria-busy="true" className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-muted/40" />
            ))}
          </div>
        )
      ) : total === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Todo ponto do app tem vídeo agora. Obrigado a quem ajudou.
        </p>
      ) : (
        <div className="space-y-6">
          {grupos.map((g) => (
            <section key={g.orixa}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                {g.orixa} · {g.pontos.length}
              </h2>
              <ul className="space-y-2">
                {g.pontos.map((p) => (
                  <li key={p.id} className="rounded-xl border bg-card/40 p-3">
                    <p className="font-semibold text-foreground">{p.titulo}</p>
                    <p className="text-xs text-muted-foreground">{p.subcategoria}</p>
                    {p.letra.trim() && (
                      <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-2 font-sans text-xs text-muted-foreground">
                        {p.letra}
                      </pre>
                    )}

                    {feitos[p.id] ? (
                      <p className="mt-2 flex items-start gap-1.5 text-sm text-foreground">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                        {feitos[p.id]}
                      </p>
                    ) : user ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <label className="flex-1">
                          <span className="sr-only">
                            Endereço do vídeo de {p.titulo}
                          </span>
                          <input
                            type="url"
                            inputMode="url"
                            value={abertos[p.id] ?? ""}
                            onChange={(e) =>
                              setAbertos((a) => ({ ...a, [p.id]: e.target.value }))
                            }
                            placeholder="Cole o link do YouTube"
                            className="min-h-11 w-full rounded-md border bg-background px-3 text-sm"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => void indicar(p.id)}
                          disabled={ocupado === p.id || !(abertos[p.id] ?? "").trim()}
                          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                        >
                          {ocupado === p.id && (
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                          )}
                          Indicar
                        </button>
                      </div>
                    ) : null}

                    {p.indicacoes > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {p.indicacoes}{" "}
                        {p.indicacoes === 1
                          ? "indicação esperando conferência"
                          : "indicações esperando conferência"}
                      </p>
                    )}
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
