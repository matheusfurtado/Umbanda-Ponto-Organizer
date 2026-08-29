/**
 * O botão de denunciar, e o que ele pergunta.
 *
 * ## Discreto de propósito
 *
 * Fica pequeno e no fim das ações, nunca ao lado de "seguir". Um botão de
 * denúncia em destaque convida a denúncia por desavença — e num app onde as
 * pessoas se conhecem do terreiro, desavença é o motivo mais provável de
 * alguém apontar alguém.
 *
 * ## Motivos fechados
 *
 * Texto livre obrigatório faz a pessoa desistir no meio; texto livre opcional
 * faz chegar denúncia sem nada dentro. Cinco motivos e uma caixa que só aparece
 * (e só é exigida) em "outro" resolvem os dois.
 *
 * ## O que a tela promete
 *
 * "Uma pessoa vai olhar." Nada de "vamos remover" — nada é removido sozinho, e
 * prometer o que não acontece é como se perde a confiança de quem denunciou de
 * verdade.
 */

import { useState } from "react";
import { mensagemDeErro } from "@/api/cliente";
import { Flag, Loader2 } from "lucide-react";
import {
  denunciar,
  type AlvoDeDenuncia,
  type MotivoDeDenuncia,
} from "@/api/denuncia";

const MOTIVOS: { valor: MotivoDeDenuncia; rotulo: string }[] = [
  { valor: "ofensivo", rotulo: "Conteúdo ofensivo ou desrespeitoso" },
  { valor: "imagem_impropria", rotulo: "Imagem imprópria" },
  { valor: "nao_e_ponto", rotulo: "Não é ponto de Umbanda" },
  { valor: "engano", rotulo: "Está errado ou engana quem canta" },
  { valor: "outro", rotulo: "Outro motivo" },
];

type Fase = "fechado" | "escolhendo" | "enviado";

export function Denunciar({
  alvoTipo,
  alvoId,
  oQueE,
}: {
  alvoTipo: AlvoDeDenuncia;
  alvoId: string;
  /** "este perfil", "esta gira" — entra na frase da tela. */
  oQueE: string;
}) {
  const [fase, setFase] = useState<Fase>("fechado");
  const [motivo, setMotivo] = useState<MotivoDeDenuncia>("ofensivo");
  const [detalhe, setDetalhe] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar() {
    setEnviando(true);
    setErro(null);
    try {
      await denunciar(alvoTipo, alvoId, motivo, detalhe.trim() || undefined);
      setFase("enviado");
    } catch (problema) {
      setErro(
        mensagemDeErro(problema, "Não consegui enviar agora."),
      );
    } finally {
      setEnviando(false);
    }
  }

  if (fase === "enviado") {
    return (
      <p className="text-xs text-muted-foreground">
        Denúncia enviada. Uma pessoa vai olhar.
      </p>
    );
  }

  if (fase === "fechado") {
    return (
      <button
        type="button"
        onClick={() => setFase("escolhendo")}
        className="inline-flex min-h-11 items-center gap-1.5 text-xs text-muted-foreground underline underline-offset-2"
      >
        <Flag className="h-3.5 w-3.5" aria-hidden />
        Denunciar {oQueE}
      </button>
    );
  }

  const faltaDetalhe = motivo === "outro" && !detalhe.trim();

  return (
    <div className="max-w-md rounded-lg border bg-card p-3">
      <p className="text-sm font-medium text-foreground">Denunciar {oQueE}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Uma pessoa vai olhar. Nada é removido automaticamente.
      </p>

      <div className="mt-3 flex flex-col gap-1.5">
        {MOTIVOS.map((m) => (
          <label key={m.valor} className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="radio"
              name="motivo-da-denuncia"
              checked={motivo === m.valor}
              onChange={() => setMotivo(m.valor)}
            />
            {m.rotulo}
          </label>
        ))}
      </div>

      {motivo === "outro" && (
        <textarea
          value={detalhe}
          onChange={(e) => setDetalhe(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Conte em uma linha o que aconteceu."
          aria-label="O que aconteceu"
          className="mt-2 w-full rounded-md border bg-background p-2 text-sm outline-none focus:border-primary/60"
        />
      )}

      {erro && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {erro}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void enviar()}
          disabled={enviando || faltaDetalhe}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm font-medium disabled:opacity-60"
        >
          {enviando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Enviar denúncia
        </button>
        <button
          type="button"
          onClick={() => setFase("fechado")}
          disabled={enviando}
          className="min-h-11 px-3 text-sm text-muted-foreground disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
