/**
 * Mandar um link daqui para o grupo do terreiro.
 *
 * É o mecanismo de descoberta que este app realmente tem: não há busca de
 * pessoas, e a vitrine só alcança quem publicou gira recente. O que circula é o
 * link, colado no WhatsApp da casa (ADR 0006).
 *
 * E não havia botão. A pessoa teria que copiar da barra de endereço — que no
 * PWA instalado muitas vezes nem aparece.
 *
 * Três caminhos, nesta ordem, porque cada um falta em algum lugar:
 *
 * 1. `navigator.share` — no celular abre a folha nativa, com o WhatsApp junto.
 *    É o caminho bom, e é o do aparelho que vai para a gira.
 * 2. `clipboard.writeText` — no desktop, e em navegador sem a folha nativa.
 * 3. Mostrar o endereço para copiar à mão — quando o navegador recusa a área de
 *    transferência (acontece fora de HTTPS, e em aba restrita).
 *
 * O passo 3 existe porque um botão de compartilhar que não faz nada é pior que
 * não ter botão: a pessoa toca, não acontece nada, e conclui que o app é
 * quebrado.
 */

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

type Estado = "parado" | "copiado" | "manual";

export function Compartilhar({
  titulo,
  caminho,
  rotulo = "Compartilhar",
}: {
  /** Vai no texto do compartilhamento nativo. */
  titulo: string;
  /** Caminho dentro do app, como `/perfil/Fulana`. */
  caminho: string;
  rotulo?: string;
}) {
  const [estado, setEstado] = useState<Estado>("parado");

  const endereco = `${window.location.origin}${caminho}`;

  // `typeof`, e não `navigator.share &&`: o tipo do DOM declara o método como
  // sempre presente, mas ele NÃO existe no Firefox de desktop nem em navegador
  // antigo. O TypeScript reclama da checagem que o runtime exige.
  const temFolhaNativa = typeof navigator.share === "function";

  async function compartilhar() {
    if (temFolhaNativa) {
      try {
        await navigator.share({ title: titulo, url: endereco });
        return;
      } catch (problema) {
        // Cancelar a folha nativa levanta `AbortError`. Isso é a pessoa
        // desistindo, e não uma falha — cair para a cópia aqui seria o app
        // insistindo depois de ela ter dito não.
        if (problema instanceof Error && problema.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(endereco);
      setEstado("copiado");
      setTimeout(() => setEstado("parado"), 2500);
    } catch {
      setEstado("manual");
    }
  }

  if (estado === "manual") {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-xs text-muted-foreground">Copie o endereço:</p>
        <input
          readOnly
          value={endereco}
          onFocus={(e) => e.currentTarget.select()}
          className="min-h-11 w-full rounded-md border bg-card px-3 text-xs text-foreground"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void compartilhar()}
      className="inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm font-medium"
    >
      {estado === "copiado" ? (
        <>
          <Check className="h-4 w-4" aria-hidden />
          Link copiado
        </>
      ) : (
        <>
          {temFolhaNativa ? (
            <Share2 className="h-4 w-4" aria-hidden />
          ) : (
            <Copy className="h-4 w-4" aria-hidden />
          )}
          {rotulo}
        </>
      )}
    </button>
  );
}
