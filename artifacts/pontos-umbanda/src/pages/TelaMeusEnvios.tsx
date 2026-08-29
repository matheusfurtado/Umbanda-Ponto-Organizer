import { useEffect, useState } from "react";
import { mensagemDeErro } from "@/api/cliente";
import { Link } from "wouter";
import { Clock, Check, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { meusEnvios, type Submissao } from "@/api/comunidade";

/**
 * O que eu mandei e em que pé está.
 *
 * A recusa mostra o MOTIVO. Sem ele a pessoa reenvia a mesma coisa achando
 * que houve engano — e a fila do admin enche do mesmo problema, que ele já
 * decidiu uma vez.
 */

const CARA = {
  pendente: { icone: Clock, cor: "text-amber-400", texto: "Esperando revisão" },
  aprovada: { icone: Check, cor: "text-emerald-400", texto: "Aprovado — está no acervo" },
  recusada: { icone: X, cor: "text-destructive", texto: "Recusado" },
} as const;

function quando(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function TelaMeusEnvios() {
  const [envios, setEnvios] = useState<Submissao[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    meusEnvios()
      .then(setEnvios)
      .catch((e) => setErro(mensagemDeErro(e, "Não consegui carregar.")));
  }, []);

  return (
    <div className="max-w-2xl px-4 pb-24 pt-5 sm:px-8">
      <h1 className="text-2xl font-black text-foreground sm:text-3xl">Meus envios</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Pontos e autorias que você mandou para o acervo.
      </p>

      {erro && <p role="alert" className="mb-4 text-sm text-destructive">{erro}</p>}

      {envios === null ? (
        <div aria-busy="true" className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : envios.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <Send className="mx-auto mb-3 h-7 w-7 text-muted-foreground" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Você ainda não enviou nada. Conhece um ponto que falta no acervo?
          </p>
          <Link href="/enviar-ponto">
            <Button size="sm" className="mt-4">Enviar um ponto</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {envios.map((e) => {
            const { icone: Icone, cor, texto } = CARA[e.status];
            return (
              <div key={e.id} className="rounded-xl border bg-card p-4">
                <div className="flex items-start gap-3">
                  <Icone className={`mt-0.5 h-4 w-4 shrink-0 ${cor}`} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {e.tipo === "ponto"
                        ? e.titulo
                        : <>Autoria: <span className="font-normal">{e.autor}</span></>}
                    </p>
                    <p className={`mt-0.5 text-xs ${cor}`}>{texto}</p>
                    {e.motivo && (
                      // O motivo é o que evita o reenvio idêntico.
                      <p className="mt-2 rounded-lg bg-muted/50 p-2 text-xs text-muted-foreground">
                        {e.motivo}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {quando(e.criadoEm)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
