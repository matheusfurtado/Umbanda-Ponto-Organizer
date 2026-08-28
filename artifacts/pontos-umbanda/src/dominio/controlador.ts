/**
 * Quem responde pelos dados, e por quanto tempo eles ficam.
 *
 * ## Por que num arquivo só, com sentinela
 *
 * A LGPD (art. 9º) obriga a informar **quem** trata o dado e **por quanto
 * tempo**. Esses são fatos que o código não sabe: dependem de o Matheus decidir
 * se o controlador é ele como pessoa física ou uma PJ, qual e-mail atende o
 * titular, e qual o prazo de retenção.
 *
 * Escrevê-los como `[preencher]` no meio do texto seria a pior saída: some no
 * meio de duas mil palavras e vai ao ar sem ninguém ver. Aqui eles são
 * constantes com uma sentinela, e **enquanto qualquer uma estiver pendente as
 * páginas mostram um aviso no topo** — impossível de não ver, tanto para ele
 * quanto para quem abrir.
 */

/** O valor que significa "o Matheus ainda não disse". */
export const PENDENTE = "«pendente»";

export const CONTROLADOR = {
  /** Nome ou razão social de quem responde pelo tratamento. */
  nome: PENDENTE,
  /** CNPJ ou CPF. Pode ficar vazio se o controlador for pessoa física. */
  documento: PENDENTE,
  /** Para onde o titular escreve para exercer os direitos do art. 18. */
  contato: PENDENTE,
  /** Por quanto tempo o dado fica depois que a conta é apagada. */
  retencao: PENDENTE,
} as const;

/** O que ainda falta ele preencher. Vazio = a página está completa. */
export function faltaPreencher(): string[] {
  const rotulos: Record<keyof typeof CONTROLADOR, string> = {
    nome: "quem é o controlador",
    documento: "CNPJ ou CPF do controlador",
    contato: "e-mail de contato do titular",
    retencao: "prazo de retenção",
  };
  return (Object.keys(CONTROLADOR) as (keyof typeof CONTROLADOR)[])
    .filter((k) => CONTROLADOR[k] === PENDENTE)
    .map((k) => rotulos[k]);
}

/** A data da última revisão do texto. */
export const ATUALIZADO_EM = "28 de agosto de 2026";
