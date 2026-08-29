/**
 * O que sai do aparelho quando alguém sai da conta.
 *
 * ## Por que existe
 *
 * O logout limpava o cookie e o usuário guardado, e **deixava o resto**: o
 * acervo, as giras, a fila de envio. No tablet do terreiro — que é como este
 * app é usado de verdade, um aparelho e várias pessoas — a próxima pessoa
 * abria e via o acervo de quem tinha acabado de sair.
 *
 * Não é uma lista de pontos qualquer. Quais entidades alguém trabalha, o que
 * ela apagou, que giras ela monta: é convicção religiosa detalhada (LGPD
 * art. 5º, II), e ela ficava visível sem nem precisar de senha.
 *
 * ## O que fica
 *
 * A paleta. Preferência de tela não diz nada sobre religião, e zerá-la faria a
 * pessoa reconfigurar o aparelho toda vez que alguém saísse da conta.
 *
 * ## A lista é conferida por teste
 *
 * `esquecer.test.ts` varre o `src/` atrás de toda chave de `localStorage` e
 * exige que cada uma esteja aqui ou na lista de exceção com o motivo escrito.
 * Sem isso, a chave nova de daqui a dois meses simplesmente não seria apagada,
 * e ninguém descobriria — o defeito é invisível para quem está usando.
 */

/** Chaves que guardam algo da pessoa. Saiu da conta, saem do aparelho. */
export const CHAVES_PESSOAIS = [
  "pontos-umbanda-data",
  "pontos-umbanda-repertorios",
  "pontos-umbanda-repertorios-fila",
  "pontos-umbanda-pendente",
  "pontos-umbanda-usuario",
  "pagamento-pendente",
  // Qual plano a pessoa tem. Não é trava de segurança — o servidor confere em
  // toda rota —, mas dizer a quem pegar o aparelho depois qual plano o
  // anterior assinava é informação sobre ele.
  "pontos-umbanda-plano",
  // Não guarda dado, mas guarda uma DECISÃO sobre dado que não existe mais:
  // ela marca "já ofereci migrar o acervo local". Deixando-a de pé, a próxima
  // pessoa que usar o aparelho sem conta, montar um acervo e se cadastrar
  // nunca receberia a oferta — e perderia o que montou.
  "migracao-oferecida",
] as const;

/** Chaves que ficam, e por quê. */
export const CHAVES_QUE_FICAM: Record<string, string> = {
  paleta: "preferência de tela; não diz nada sobre a pessoa e reconfigurar a cada logout irrita",
  "instalar-dispensado":
    "decisão sobre o APARELHO, não sobre a pessoa: quem dispensou a faixa de " +
    "instalar dispensou naquele aparelho, e trazê-la de volta a cada logout " +
    "repetiria a insistência que ela veio calar",
};

/**
 * Apaga do aparelho o que era da conta.
 *
 * Engole falha de `localStorage` (aba anônima restrita, cota estourada): sair
 * precisa funcionar mesmo quando gravar não funciona.
 */
export function esquecerDoAparelho(): void {
  for (const chave of CHAVES_PESSOAIS) {
    try {
      localStorage.removeItem(chave);
    } catch {
      /* sem storage não há o que apagar */
    }
  }
}
