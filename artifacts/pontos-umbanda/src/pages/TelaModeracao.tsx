import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/context";
import { aprovar, filaDeModeracao, recusar, type SubmissaoNaFila } from "@/api/comunidade";

/**
 * A fila de quem modera.
 *
 * ## O que a tela mostra sem precisar de outra
 *
 * Para um ponto novo: título, letra inteira, orixá e quem mandou.
 * Para uma autoria: o ponto, o que ele diz HOJE, e o que está sendo proposto.
 *
 * Esse "hoje" não é detalhe. Sem ele o revisor aprovaria "trocar para X" sem
 * saber se está preenchendo um campo vazio ou apagando uma autoria que outra
 * pessoa já conferiu.
 *
 * ## Recusar exige motivo
 *
 * O campo é obrigatório porque a recusa volta para quem enviou. Recusa muda
 * faz a pessoa reenviar a mesma coisa, e a fila recebe de novo o problema que
 * o revisor já decidiu.
 */
export function TelaModeracao() {
  const { dados, recarregar } = useApp();
  const [fila, setFila] = useState<SubmissaoNaFila[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [recusando, setRecusando] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");

  const carregar = useCallback(() => {
    filaDeModeracao()
      .then(setFila)
      .catch((e) => setErro(e instanceof Error ? e.message : "Não consegui carregar."));
  }, []);

  useEffect(carregar, [carregar]);

  const decidir = async (id: string, acao: () => Promise<unknown>) => {
    setOcupado(id);
    setErro(null);
    try {
      await acao();
      setRecusando(null);
      setMotivo("");
      carregar();
      // E o ACERVO junto, não só a fila.
      //
      // Aprovar acrescenta um ponto ao acervo de todo mundo, mas o `dados`
      // desta aba foi baixado ao abrir o app. Sem esta linha o revisor aprova,
      // vai ao orixá, e o ponto não está lá — só reaparece se ele recarregar a
      // página. Aconteceu exatamente assim, e a conclusão natural é "a
      // aprovação não funcionou", que é o pior lugar para deixar alguém.
      recarregar();
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : "Falhou.");
    } finally {
      setOcupado(null);
    }
  };

  const nomeDoOrixa = (id: string | null) =>
    dados.orixas.find((o) => o.id === id)?.nome ?? id ?? "—";

  return (
    <div className="max-w-3xl px-4 pb-24 pt-5 sm:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
        <ShieldCheck className="h-6 w-6 text-primary" aria-hidden /> Moderação
      </h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        O que a comunidade mandou, mais antigo primeiro.
      </p>

      {erro && <p role="alert" className="mb-4 text-sm text-destructive">{erro}</p>}

      {fila === null ? (
        <div aria-busy="true" className="space-y-2">
          {[0, 1].map((i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted/40" />)}
        </div>
      ) : fila.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nada esperando revisão.
        </p>
      ) : (
        <div className="space-y-3">
          {fila.map((s) => (
            <article key={s.id} className="rounded-xl border bg-card p-4">
              <header className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-accent-foreground">
                    {s.tipo === "ponto" ? "Ponto novo" : "Autoria"}
                  </span>
                  <p className="mt-1.5 font-semibold text-foreground">
                    {s.tipo === "ponto" ? s.titulo : s.tituloDoPonto}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{s.enviadoPor}</span>
              </header>

              {s.tipo === "ponto" ? (
                <>
                  <p className="mb-2 text-xs text-muted-foreground">
                    {nomeDoOrixa(s.orixaId)}
                    {s.autor && ` · autor indicado: ${s.autor}`}
                  </p>
                  <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-3 font-sans text-sm text-foreground/90">
                    {s.letra || "(sem letra)"}
                  </pre>
                </>
              ) : (
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">Diz hoje</dt>
                    <dd className="text-foreground">{s.autorAtual ?? "— (sem autor)"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">Proposta</dt>
                    <dd className="font-medium text-foreground">{s.autor}</dd>
                  </div>
                </dl>
              )}

              {recusando === s.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!motivo.trim()) return;
                    void decidir(s.id, () => recusar(s.id, motivo.trim()));
                  }}
                  className="mt-3 flex gap-2"
                >
                  <Input
                    autoFocus
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Por que está sendo recusado? (vai para quem enviou)"
                    aria-label="Motivo da recusa"
                  />
                  <Button type="submit" variant="destructive" disabled={!motivo.trim()}>
                    Recusar
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setRecusando(null)}>
                    Cancelar
                  </Button>
                </form>
              ) : (
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    disabled={ocupado === s.id}
                    onClick={() => void decidir(s.id, () => aprovar(s.id))}
                  >
                    {ocupado === s.id
                      ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      : <Check className="mr-2 h-4 w-4" />}
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setRecusando(s.id); setMotivo(""); }}
                  >
                    <X className="mr-2 h-4 w-4" /> Recusar
                  </Button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
