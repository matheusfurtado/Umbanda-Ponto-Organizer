import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Check, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useApp } from "@/context";
import { enviarPonto } from "@/api/comunidade";

/**
 * Mandar um ponto para o acervo.
 *
 * **Exige conta, não plano.** O acervo cresce por quem canta, e cobrar para
 * contribuir afastaria justamente quem tem ponto para dar.
 *
 * ## A tela diz o que vai acontecer ANTES de a pessoa escrever
 *
 * O ponto não entra no acervo de todos na hora: ele espera revisão. Descobrir
 * isso só depois de escrever uma letra inteira é o tipo de surpresa que faz a
 * pessoa achar que o envio falhou — e mandar de novo.
 */
export function TelaEnviarPonto() {
  const { dados } = useApp();
  const [, navegar] = useLocation();
  const [titulo, setTitulo] = useState("");
  const [letra, setLetra] = useState("");
  const [autor, setAutor] = useState("");
  const [orixaId, setOrixaId] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);

  const enviar = async () => {
    if (!titulo.trim() || !orixaId) return;
    setEnviando(true);
    setErro(null);
    try {
      await enviarPonto({
        titulo: titulo.trim(),
        letra,
        orixaId,
        autor: autor.trim() || null,
      });
      setPronto(true);
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : "Não consegui enviar.");
    } finally {
      setEnviando(false);
    }
  };

  if (pronto) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-8">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Check className="h-7 w-7 text-primary" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Ponto enviado</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Ele já aparece no seu acervo, marcado como <em>em aprovação</em>. Assim
          que alguém revisar, entra para todo mundo.
        </p>
        <div className="mt-8 flex flex-col gap-2">
          <Button onClick={() => { setPronto(false); setTitulo(""); setLetra(""); setAutor(""); }}>
            Enviar outro
          </Button>
          <Link href="/meus-envios">
            <Button variant="ghost" className="w-full">Ver meus envios</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl px-4 pb-24 pt-5 sm:px-8">
      <h1 className="text-2xl font-black text-foreground sm:text-3xl">Enviar um ponto</h1>
      <p className="mb-6 mt-1 max-w-lg text-sm text-muted-foreground">
        O ponto aparece no seu acervo imediatamente. Para entrar no acervo de
        todos, passa antes por revisão.
      </p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="orixa" className="mb-1 block text-sm text-muted-foreground">
            De qual orixá é
          </Label>
          <select
            id="orixa"
            value={orixaId}
            onChange={(e) => setOrixaId(e.target.value)}
            className="min-h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground"
          >
            <option value="">Escolha...</option>
            {dados.orixas.map((o) => (
              <option key={o.id} value={o.id}>{o.nome}</option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="titulo" className="mb-1 block text-sm text-muted-foreground">
            Início do ponto <span className="text-xs">(é o que aparece na lista)</span>
          </Label>
          <Input
            id="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex: Laroyê Exu, Exu mojubá..."
          />
        </div>

        <div>
          <Label htmlFor="autor-novo" className="mb-1 block text-sm text-muted-foreground">
            Autor <span className="text-xs">(se você souber)</span>
          </Label>
          <Input
            id="autor-novo"
            value={autor}
            onChange={(e) => setAutor(e.target.value)}
            placeholder="Deixe em branco se for de domínio popular"
          />
        </div>

        <div>
          <Label htmlFor="letra-nova" className="mb-1 block text-sm text-muted-foreground">
            Letra
          </Label>
          <Textarea
            id="letra-nova"
            value={letra}
            onChange={(e) => setLetra(e.target.value)}
            placeholder="Escreva a letra como se canta..."
            className="min-h-[220px] resize-none"
          />
          {/* A grafia do acervo é requisito funcional, não estética: o texto vai
              exatamente como for escrito, sem "corrigir" nada. */}
          <p className="mt-1 text-xs text-muted-foreground">
            A letra é guardada exatamente como você escrever.
          </p>
        </div>

        {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}

        <div className="flex gap-2">
          <Button onClick={enviar} disabled={enviando || !titulo.trim() || !orixaId}>
            {enviando ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
            ) : (
              <><Send className="mr-2 h-4 w-4" /> Enviar para revisão</>
            )}
          </Button>
          <Button variant="ghost" onClick={() => navegar("/")}>Cancelar</Button>
        </div>
      </div>
    </div>
  );
}
