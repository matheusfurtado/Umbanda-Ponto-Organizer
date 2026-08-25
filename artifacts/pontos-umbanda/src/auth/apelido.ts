/**
 * Como chamar a pessoa na tela.
 *
 * A API **não guarda nome** — de propósito. Convicção religiosa já é dado
 * sensível aqui; nome completo seria mais um dado a vazar sem necessidade
 * nenhuma (LGPD art. 6º, III: minimização). Campo que não existe não vaza.
 *
 * Então o rótulo sai do próprio e-mail. Não é o nome da pessoa e não finge ser:
 * é só um jeito de ela reconhecer a conta em que está.
 */

export function apelido(email?: string | null): string {
  const local = (email ?? "").split("@")[0]?.trim();
  return local || "Conta";
}

export function inicial(email?: string | null): string {
  return apelido(email).charAt(0).toUpperCase();
}
