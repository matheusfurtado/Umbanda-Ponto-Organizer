/**
 * Cancelar a assinatura, de dentro do app.
 *
 * ## Por que existe
 *
 * Não existia caminho nenhum: assinar levava um clique e cancelar não tinha
 * como. Isso é exigência do CDC — quem contrata pela internet tem de poder
 * rescindir pelo mesmo caminho — e este app não tem suporte por e-mail para
 * onde mandar a pessoa.
 *
 * ## A confirmação diz o que acontece, não pergunta "tem certeza?"
 *
 * "Tem certeza?" não informa nada. O que a pessoa precisa saber antes de
 * clicar é que **o acesso continua até o fim do período já pago** e que **nada
 * do que é dela é apagado** — sem isso ela adia o cancelamento por medo, ou
 * cancela achando que vai perder as giras.
 */

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cancelarAssinatura, type Assinatura } from "@/lib/apiBilling";

export function CancelarAssinatura({
  assinatura,
  onCancelou,
}: {
  assinatura: Assinatura;
  onCancelou: (a: Assinatura | null) => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (assinatura.cancelada_em || assinatura.status === "cancelada") {
    return (
      <p className="text-sm text-muted-foreground">
        Assinatura cancelada. Você continua com acesso até o fim do período já
        pago.
      </p>
    );
  }

  async function cancelar() {
    setEnviando(true);
    setErro(null);
    try {
      onCancelou(await cancelarAssinatura());
      setConfirmando(false);
    } catch (problema) {
      setErro(
        problema instanceof Error ? problema.message : "Não consegui cancelar agora.",
      );
    } finally {
      setEnviando(false);
    }
  }

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="min-h-11 text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        Cancelar assinatura
      </button>
    );
  }

  return (
    <div className="rounded-lg border p-3">
      <p className="text-sm text-foreground">Cancelar a assinatura?</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
        <li>Você continua com acesso até o fim do período já pago.</li>
        <li>
          <strong className="text-foreground">Nada do que é seu é apagado.</strong>{" "}
          As letras, os pontos que você escreveu e seus favoritos continuam aqui.
        </li>
        <li>Depois disso saem a organização por orixá, o link do vídeo, as giras e o uso sem internet.</li>
        <li>Você pode assinar de novo quando quiser.</li>
      </ul>

      {erro && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {erro}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void cancelar()}
          disabled={enviando}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm font-medium disabled:opacity-60"
        >
          {enviando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Sim, cancelar
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          disabled={enviando}
          className="min-h-11 px-3 text-sm text-muted-foreground disabled:opacity-60"
        >
          Manter assinatura
        </button>
      </div>
    </div>
  );
}
