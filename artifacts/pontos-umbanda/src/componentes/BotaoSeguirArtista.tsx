/**
 * Seguir e deixar de seguir um artista.
 *
 * ## Estado de envio e mensagem de erro, sempre
 *
 * `void promessa` num `onClick` engole falha de rede: o botão não muda, nada
 * aparece, e a pessoa não sabe se aconteceu. Este projeto já pisou nessa
 * armadilha e ela está escrita no `PROGRESSO.md` — toda ação de rede num
 * clique precisa de estado de envio e de erro visível.
 *
 * ## Otimista, mas com volta
 *
 * O botão muda na hora, porque esperar a ida e volta faz o clique parecer
 * perdido. Se a chamada falhar, ele volta ao que era E diz o que houve — o
 * pior dos mundos seria mostrar "Seguindo" para quem não está seguindo.
 */

import { useState } from "react";
import { Check, Loader2, Plus } from "lucide-react";
import { deixarDeSeguirArtista, seguirArtista } from "@/api/artista";

export function BotaoSeguirArtista({
  artistaId,
  seguindo,
  onMudou,
}: {
  artistaId: string;
  /** `null` = visitante não logado. */
  seguindo: boolean | null;
  onMudou: (seguindo: boolean) => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (seguindo === null) {
    return (
      <p className="text-sm text-muted-foreground">
        <a href="/login" className="font-medium text-primary underline">
          Entre
        </a>{" "}
        para seguir e ter este artista na sua biblioteca.
      </p>
    );
  }

  async function alternar() {
    const antes = seguindo as boolean;
    setEnviando(true);
    setErro(null);
    onMudou(!antes);
    try {
      await (antes ? deixarDeSeguirArtista(artistaId) : seguirArtista(artistaId));
    } catch (problema) {
      onMudou(antes);
      setErro(
        problema instanceof Error ? problema.message : "Não consegui agora.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void alternar()}
        disabled={enviando}
        aria-pressed={seguindo}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition disabled:opacity-60 ${
          seguindo
            ? "border bg-card text-foreground hover:border-primary/40"
            : "bg-primary text-primary-foreground hover:opacity-90"
        }`}
      >
        {enviando ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : seguindo ? (
          <Check className="h-4 w-4" aria-hidden />
        ) : (
          <Plus className="h-4 w-4" aria-hidden />
        )}
        {seguindo ? "Seguindo" : "Seguir"}
      </button>
      {erro && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}
