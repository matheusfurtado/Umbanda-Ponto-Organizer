/**
 * Que plano a pessoa foi pagar, para a tela de retorno saber o que esperar.
 *
 * Existe por causa de uma armadilha concreta: durante o teste de 15 dias os
 * direitos são os do plano pago e `plano` vale `"teste"`. Uma tela de retorno
 * que perguntasse só "tem plano?" comemoraria na hora para quem está no teste
 * — inclusive se o pagamento tivesse falhado. E quem está no teste é
 * exatamente quem mais converte.
 *
 * Guardando o plano esperado, a confirmação vira "virou ESTE plano", que é o
 * que de fato aconteceu ou não.
 */

const CHAVE = "pagamento-pendente";
// Depois disso o registro não diz mais nada útil: se a pessoa voltar dias
// depois, o que vale é o estado da conta, não uma intenção velha.
const VALIDADE_MS = 6 * 60 * 60 * 1000;

interface Pendente {
  planoId: string;
  quando: number;
}

export function registrarPagamentoPendente(planoId: string): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify({ planoId, quando: Date.now() }));
  } catch {
    // Navegador sem localStorage (aba anônima com restrição) não pode derrubar
    // o checkout. A tela de retorno cai no modo genérico e ainda funciona.
  }
}

export function lerPagamentoPendente(): string | null {
  try {
    const cru = localStorage.getItem(CHAVE);
    if (!cru) return null;
    const { planoId, quando } = JSON.parse(cru) as Pendente;
    if (!planoId || Date.now() - quando > VALIDADE_MS) return null;
    return planoId;
  } catch {
    return null;
  }
}

export function limparPagamentoPendente(): void {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    /* nada a fazer, e não é motivo para quebrar a tela */
  }
}
