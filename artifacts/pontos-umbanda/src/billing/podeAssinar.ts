/**
 * Quem pode abrir o checkout, e o que a tela diz sobre isso.
 *
 * ## Por que é uma função, e não um `if` dentro do JSX
 *
 * A regra estava escrita como `disabled={... || ent.plano !== "gratis"}` no
 * meio do botão, e nessa forma ela era invisível: ninguém lia aquilo como
 * "quem está no teste de 15 dias não consegue pagar". Mas era isso que ela
 * dizia, e o servidor concordava com um 409 — **o funil inteiro do lançamento
 * estava fechado**, com testes verdes dos dois lados.
 *
 * Fora do JSX ela pode ser testada, e a decisão fica com nome.
 *
 * ## A regra
 *
 * Só um plano PAGO e ativo barra. O teste de cortesia não barra: é exatamente
 * durante ele que a pessoa decide. Quem cancelou também não: `cancelada` vale
 * até a data paga, e assinar de novo é o que ela quer fazer.
 *
 * Espelha `abrir_checkout` no `routers/assinatura.py`. As duas metades
 * precisam concordar — botão habilitado contra 409 do servidor é pior que
 * botão desabilitado, porque a pessoa clica e leva erro.
 */

export type EstadoDeAssinatura = "gratis" | "teste" | "pago";

export function estadoDoPlano(plano: string): EstadoDeAssinatura {
  if (plano === "gratis") return "gratis";
  if (plano === "teste") return "teste";
  return "pago";
}

export function podeAssinar(plano: string): boolean {
  return estadoDoPlano(plano) !== "pago";
}

/**
 * O aviso que fica acima dos planos. `null` quando não há o que avisar.
 *
 * Para quem está no teste, o aviso é a informação que decide: **o que sobra
 * não se perde**. Sem dizer isso, assinar no 3º dia parece jogar fora 12 dias
 * pagos com nada — e a pessoa espera o teste acabar, que é justamente quando
 * ela some.
 */
export function avisoDoPlano(
  plano: string,
  diasRestantes: number | null | undefined,
): string | null {
  const estado = estadoDoPlano(plano);
  if (estado === "gratis") return null;
  if (estado === "pago") return `Você já tem o plano ${plano} ativo.`;

  const dias =
    typeof diasRestantes === "number" && diasRestantes > 0
      ? `${diasRestantes} dia${diasRestantes === 1 ? "" : "s"}`
      : null;
  return dias
    ? `Você está no teste e faltam ${dias}. Se assinar agora, ${dias} entram no plano — não se perde nada.`
    : "Você está no teste. Se assinar agora, o que sobrar dele entra no plano.";
}
