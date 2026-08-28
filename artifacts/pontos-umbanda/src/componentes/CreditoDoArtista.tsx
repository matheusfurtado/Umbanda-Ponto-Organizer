/**
 * "Gravado por X" — o caminho do ponto para a página de quem gravou.
 *
 * ## Por que isto existe
 *
 * A página do artista foi construída e não era alcançável a partir do ponto:
 * quem estava lendo uma letra via o nome do canal em texto e não tinha como
 * chegar a quem cantou. A porta de entrada era só o menu.
 *
 * ## Aparece sem plano, e isso não é furo no portão
 *
 * `artistaNome` vem do servidor mesmo para quem não paga. O ADR 0007 já publica
 * este mapeamento — a página do artista lista os pontos dele para qualquer um,
 * com link. Cortar aqui não esconderia nada de quem abrisse aquela página; só
 * tiraria o caminho de ida. O que continua fechado é o LINK do vídeo.
 *
 * ## Crédito, não autoria
 *
 * "Gravado por" e nunca "de": o canal é quem publicou aquela gravação, e a
 * maior parte dos pontos é de tradição oral, sem autor conhecido. Chamar o
 * intérprete de autor atribuiria obra religiosa a quem não a fez — é a mesma
 * distinção que o `LinhaPonto` já faz entre autor e quem enviou.
 */

import { Link } from "wouter";
import { Mic2 } from "lucide-react";
import type { Ponto } from "@/types";

export function CreditoDoArtista({
  ponto,
  className = "",
}: {
  ponto: Ponto;
  /** O card precisa do recuo dele; a linha aberta já vem recuada. */
  className?: string;
}) {
  if (!ponto.artistaId || !ponto.artistaNome) return null;

  return (
    <p className={`text-xs text-muted-foreground ${className}`}>
      Gravado por{" "}
      <Link
        href={`/artista/${encodeURIComponent(ponto.artistaId)}`}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1 font-medium text-primary underline underline-offset-2"
      >
        <Mic2 className="h-3 w-3" aria-hidden />
        {ponto.artistaNome}
      </Link>
    </p>
  );
}
