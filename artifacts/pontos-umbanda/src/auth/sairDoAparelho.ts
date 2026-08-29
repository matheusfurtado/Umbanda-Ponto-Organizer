/**
 * Sair: avisa o servidor se der, e **sempre** limpa o aparelho.
 *
 * ## Por que isto é uma função
 *
 * Era uma linha dentro do `AuthContext`, e a linha estava errada:
 * `await sairDaApi()` fora de qualquer `try`. Sem rede — a do terreiro, que é
 * onde este app vive — a chamada joga, a função morre ali, e **nada do
 * aparelho é apagado**: acervo, giras, fila de envio e e-mail continuam na
 * tela para a próxima pessoa que pegar o tablet. O comentário logo abaixo já
 * prometia "sair tem que valer mesmo se a rede cair no meio"; era a única
 * parte que não valia.
 *
 * O caminho de apagar a conta é pior ainda: lá o servidor já apagou tudo, e o
 * aparelho ficava com a cópia local de uma conta que não existe mais.
 *
 * Virou função porque a garantia — "a limpeza local acontece, aconteça o que
 * acontecer com a rede" — não é testável dentro de um contexto React, e
 * garantia sem teste é comentário. É a mesma lição que este projeto já pagou
 * em `escopo.do_dono`: invariante que vale em vários caminhos vira função, não
 * linha repetida.
 *
 * ## Engolir a falha do servidor é o certo
 *
 * O cookie é `httpOnly` e expira sozinho, e o servidor derruba a sessão no
 * próximo login. O que não pode falhar é a parte local, que é a única que a
 * próxima pessoa vê.
 */
export async function sairDoAparelho(
  avisarOServidor: () => Promise<unknown>,
  limparAqui: () => void,
): Promise<void> {
  try {
    await avisarOServidor();
  } catch {
    /* sem rede, sem sessão do outro lado, tanto faz: a limpeza é o que importa */
  } finally {
    limparAqui();
  }
}
