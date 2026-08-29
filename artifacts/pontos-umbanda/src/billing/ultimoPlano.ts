/**
 * O último plano que o servidor confirmou, guardado neste aparelho.
 *
 * ## Por que existe
 *
 * O contexto de entitlements fazia `.catch(() => setEnt(ENTITLEMENTS_GRATIS))`.
 * Qualquer falha de rede — a do terreiro, que é o lugar onde este app é usado —
 * rebaixava quem paga para o plano grátis, **em silêncio**: a hierarquia some,
 * os links de vídeo somem, as giras somem. A pessoa vê o produto que ela
 * assinou desaparecer e não tem como saber que foi só o Wi-Fi.
 *
 * ## Isto não é uma trava de segurança, e por isso pode morar aqui
 *
 * Quem decide o que é entregue é o servidor: o portão está no sync (ADR 0002),
 * e nenhuma tela consegue arrancar dele hierarquia, link de vídeo ou gira sem
 * plano. Editar este valor à mão só muda quais botões aparecem, e todos eles
 * batem numa rota que confere de novo.
 *
 * O que está em jogo aqui é **a tela não mentir para quem pagou**.
 *
 * ## Some no logout
 *
 * A chave entra em `CHAVES_PESSOAIS` (`dados/esquecer.ts`): saber que plano
 * alguém tem é informação sobre aquela pessoa, e o tablet do terreiro é de
 * todos. O teste de completude de lá obriga a decisão, então esta chave não
 * tinha como ficar de fora sem alguém notar.
 */

import type { Entitlements } from "@/lib/apiBilling";

export const CHAVE_ULTIMO_PLANO = "pontos-umbanda-plano";

export function lembrarPlano(ent: Entitlements): void {
  try {
    localStorage.setItem(CHAVE_ULTIMO_PLANO, JSON.stringify(ent));
  } catch {
    /* sem storage, o app só perde a memória entre aberturas */
  }
}

/**
 * O que valia da última vez, ou `null`.
 *
 * Devolve `null` para conteúdo corrompido em vez de estourar: um JSON quebrado
 * no disco não pode impedir o app de abrir.
 */
export function planoLembrado(): Entitlements | null {
  try {
    const cru = localStorage.getItem(CHAVE_ULTIMO_PLANO);
    if (!cru) return null;
    const lido = JSON.parse(cru) as Entitlements;
    return lido && typeof lido.plano === "string" ? lido : null;
  } catch {
    return null;
  }
}

export function esquecerPlano(): void {
  try {
    localStorage.removeItem(CHAVE_ULTIMO_PLANO);
  } catch {
    /* nada a fazer */
  }
}
