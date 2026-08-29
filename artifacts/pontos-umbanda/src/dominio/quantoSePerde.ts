/**
 * Quanto se perde ao apagar — em número, não em "todos".
 *
 * ## A lição veio da gira
 *
 * O `ModalConfirmar` de apagar uma gira diz o tamanho ("A gira tem 12 pontos")
 * e o que NÃO se perde ("os pontos continuam no acervo, a sequência é que se
 * vai"). As exclusões do acervo organizado diziam só **"isso também excluirá
 * todas as subcategorias e pontos deste Orixá"**.
 *
 * "Todos os pontos" é uma abstração até a pessoa saber que são 47. Quem confirma
 * sem o número está confirmando outra coisa — e aqui não há volta: são as
 * cópias DELA. O acervo canônico continua no servidor, mas o acervo organizado
 * dela não volta sozinho; recuperar exige o arquivo de "baixar meus dados",
 * que é justamente o que ninguém baixa antes de precisar.
 *
 * ## Por que num módulo, e não em cada tela
 *
 * São três exclusões em duas telas, e a frase precisa ser a mesma nas três.
 * Já divergiu: a de orixá escreve `Excluir Exu?` e a de subcategoria
 * `Excluir "Chegada"?`, com aspas numa e não na outra.
 */

/** Plural em português sem sobrar "(s)" na tela. */
function contar(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/**
 * A frase de confirmação de apagar um orixá inteiro.
 *
 * `subcategorias` e `pontos` são o que cascateia junto — o que a pessoa não vê
 * na tela de onde está apagando.
 */
export function apagarOrixa(subcategorias: number, pontos: number): string {
  const arrasta =
    pontos === 0 && subcategorias === 0
      ? "Ele está vazio."
      : `Vai junto: ${[
          subcategorias > 0 && contar(subcategorias, "subcategoria", "subcategorias"),
          pontos > 0 && contar(pontos, "ponto", "pontos"),
        ]
          .filter(Boolean)
          .join(" e ")}.`;
  return `${arrasta} Isto não pode ser desfeito — é o seu acervo organizado, e ele não volta sozinho.`;
}

/** A mesma frase, para uma subcategoria. */
export function apagarSubcategoria(pontos: number): string {
  const arrasta =
    pontos === 0
      ? "Ela está vazia."
      : `Vão junto ${contar(pontos, "ponto", "pontos")}.`;
  return `${arrasta} Isto não pode ser desfeito — é o seu acervo organizado, e ele não volta sozinho.`;
}
