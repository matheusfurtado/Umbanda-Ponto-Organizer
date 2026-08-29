/**
 * Como chamar a pessoa **enquanto ela não escolheu um nome público**.
 *
 * A API não guarda nome civil — de propósito. Convicção religiosa já é dado
 * sensível aqui; nome completo seria mais um dado a vazar sem necessidade
 * nenhuma (LGPD art. 6º, III: minimização). Campo que não existe não vaza.
 *
 * Então o rótulo sai do próprio e-mail. Não é o nome da pessoa e não finge ser:
 * é só um jeito de ela reconhecer a conta em que está.
 *
 * ## Isto é o RECUO, não o nome
 *
 * O docstring daqui dizia "a API não guarda nome" sem qualificação, e ficou
 * falso no dia em que nasceu o apelido público (`escolherApelido`, por causa
 * das giras publicadas). Quem escolheu apelido TEM nome guardado, e é ele que
 * deve aparecer: foi ele que a pessoa escolheu, e é ele que os outros veem
 * embaixo dos pontos que ela envia.
 *
 * Usar isto quando existe `user.apelido` mostra a ela um nome tirado do
 * e-mail, que é justamente o dado que este app promete não expor — e num
 * aparelho compartilhado, como o tablet do terreiro, quem olha de lado lê o
 * fragmento do e-mail em vez do apelido que ela pôs no lugar.
 */

export function apelido(email?: string | null): string {
  const local = (email ?? "").split("@")[0]?.trim();
  return local || "Conta";
}

export function inicial(email?: string | null): string {
  return apelido(email).charAt(0).toUpperCase();
}
