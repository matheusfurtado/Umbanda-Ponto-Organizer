import { useState } from "react";
import { Link } from "wouter";
import { Lock } from "lucide-react";
import { TelaOrixas } from "@/pages/TelaOrixas";
import { TelaSubcategorias } from "@/pages/TelaSubcategorias";
import { useApp } from "@/context";
import type { Orixa } from "@/types";

/**
 * O acervo em modo de EDIÇÃO — arrastar, renomear, criar, excluir.
 *
 * Isto era a tela principal de quem pagava. Deixou de ser: a maior parte do
 * tempo a pessoa está procurando um ponto para cantar, não reorganizando a
 * gira. Misturar as duas coisas deixava a navegação cheia de botões que só
 * servem uma vez por mês.
 *
 * Nada foi jogado fora — só saiu do caminho de quem quer achar um ponto.
 *
 * ## Sem plano, o editor não edita nada — e mentia duas vezes
 *
 * Quem não paga recebe o acervo ACHATADO pelo portão (ADR 0002):
 * `subcategorias: []`, `subcategoriaId` vazio, `ordem` zerada. E `persistir`
 * não enfileira envio para cópia reduzida (`dados.parcial`), de propósito —
 * mandá-la de volta apagaria no servidor a organização que a pessoa montou
 * enquanto pagava.
 *
 * O resultado é que a tela oferecia a superfície de edição inteira sobre um
 * acervo que ela não pode mudar. E o diálogo de excluir orixá dizia, ao mesmo
 * tempo, duas coisas falsas:
 *
 * - **"Ele está vazio."** — porque a cópia reduzida chega com 0 subcategorias
 *   e 0 pontos. O orixá tem dezenas de pontos no servidor.
 * - **"Isto não pode ser desfeito."** — a exclusão SE DESFAZ sozinha: o
 *   próximo `carregar()` grava o acervo do servidor por cima.
 *
 * As duas metades erram em direções opostas: uma esconde o que se perde, a
 * outra inventa uma permanência que não existe.
 *
 * Consertar as frases não bastaria — o editor continuaria sendo um teatro. A
 * tela passa a dizer o que é: aqui não há o que organizar sem plano, e o que
 * está na conta continua intacto.
 */
export function TelaOrganizarAcervo() {
  const { dados } = useApp();
  const [orixa, setOrixa] = useState<Orixa | null>(null);

  if (dados.parcial) {
    return (
      <div className="max-w-2xl px-4 pb-24 pt-5 sm:px-8">
        <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
          <Lock className="h-6 w-6 text-primary" aria-hidden /> Organizar o acervo
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Organizar por orixá e seção faz parte do plano. Sem ele, o servidor
          manda a lista corrida — e por isso não há hierarquia aqui para mexer.
        </p>
        {/* A frase que tira o medo, e que é verdade: a organização de quem já
            pagou continua na conta, intocada. É justamente porque o app NÃO
            manda a cópia reduzida de volta que ela sobrevive. */}
        <p className="mt-2 text-sm text-muted-foreground">
          Se você já organizou antes, <strong className="text-foreground">nada
          se perdeu</strong>: está guardado na sua conta e volta assim que o
          plano voltar.
        </p>
        <Link
          href="/planos"
          className="mt-4 inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          Ver planos
        </Link>
      </div>
    );
  }

  return orixa ? (
    <TelaSubcategorias orixa={orixa} onVoltar={() => setOrixa(null)} />
  ) : (
    <TelaOrixas onSelectOrixa={setOrixa} />
  );
}
