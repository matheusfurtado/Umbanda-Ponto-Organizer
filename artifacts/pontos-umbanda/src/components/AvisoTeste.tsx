/**
 * A faixa do teste de 15 dias.
 *
 * Existe para a pessoa **nunca ser surpreendida**. Descobrir que o teste acabou
 * no meio de uma gira, com o celular na mão e o terreiro esperando, é a pior
 * hora possível — e é uma falha nossa, não dela.
 *
 * Por isso o aviso aparece o tempo todo, e fica mais firme perto do fim. Não
 * bloqueia nada em momento nenhum.
 *
 * ## E não conta o que não sabe
 *
 * `diasRestantes` é opcional dos dois lados: o servidor manda `null` quando a
 * assinatura não tem data de fim. O `?? 0` que estava aqui transformava "não
 * sei" em **"Seu teste termina hoje"**, com o estilo de urgência junto — o
 * mesmo defeito do achado #10, numa linha: afirmar sobre o plano o que não se
 * conferiu.
 *
 * Alarme falso custa a credibilidade de todos os avisos seguintes, e esta é
 * justamente a faixa que precisa ser acreditada no dia em que estiver certa.
 * Sem o número, ela diz que o teste existe e o que acontece no fim — que é o
 * que ela sabe.
 */

import { Clock } from "lucide-react";
import { Link } from "wouter";
import { useEntitlements } from "@/billing/EntitlementsContext";

export function AvisoTeste() {
  const { ent } = useEntitlements();
  if (ent.plano !== "teste") return null;

  // `null` é "não sei", e é diferente de zero. Ver o docstring.
  const dias = ent.diasRestantes ?? null;
  const urgente = dias !== null && dias <= 3;

  return (
    <div
      role="status"
      className={`mx-3 my-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
        urgente
          ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
          : "border-border bg-muted/60 text-muted-foreground"
      }`}
    >
      <Clock className="h-4 w-4 shrink-0" aria-hidden />
      <span className="flex-1">
        {dias === null
          ? "Você está no período de teste."
          : dias === 0
            ? "Seu teste termina hoje."
            : dias === 1
              ? "Falta 1 dia do seu teste."
              : `Faltam ${dias} dias do seu teste.`}{" "}
        {/* Diz o que continua, não só o que acaba: a letra nunca é tirada.

            O LINK DO VÍDEO saiu desta lista em 03/09 — ele deixou de ser do
            plano e vai para todo mundo (ADR 0002). Prometer que ele some seria
            ameaçar com uma perda que não acontece, e um aviso que erra uma vez
            deixa de ser lido nas outras.

            No lugar dele entrou o OFFLINE, que é o que de fato dói: em terreiro
            o sinal falha, e é justamente aí que o app é aberto. */}
        Depois, suas letras e os vídeos continuam aqui — o que sai é a
        organização por orixá, seus repertórios, e o app funcionando sem
        internet.
      </span>
      <Link href="/planos">
        <span className="min-h-11 shrink-0 px-2 font-medium underline underline-offset-2">
          Ver planos
        </span>
      </Link>
    </div>
  );
}
