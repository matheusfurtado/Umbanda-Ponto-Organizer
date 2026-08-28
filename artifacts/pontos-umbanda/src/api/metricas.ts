/**
 * O clique que leva ao YouTube.
 *
 * ## O que NÃO vai junto
 *
 * Nada que identifique quem clicou. O servidor grava `(ponto, dia, origem)` e
 * um contador — sem id de usuário, sem hora. Qual ponto alguém canta revela a
 * linha e a casa dela, e isso é dado sensível pela LGPD. A decisão é do dono,
 * de 28/08, e há teste do lado do Python cobrando que a tabela não ganhe coluna
 * de pessoa.
 *
 * ## `sendBeacon`, e não `fetch`
 *
 * O clique acontece no instante em que a aba perde o foco para o YouTube.
 * `fetch` disparado nesse momento é cancelado pelo navegador com frequência —
 * mediria menos do que aconteceu, e o número mentiria sobre o que mede.
 * `sendBeacon` foi feito exatamente para isto: entrega em segundo plano, sem
 * segurar a navegação.
 *
 * ## Falhar aqui não pode atrapalhar ninguém
 *
 * Se a métrica não for registrada, a pessoa ainda tem de ir para o vídeo. Por
 * isso nada aqui lança: métrica é para nós, e o app é para ela.
 */

/** De onde partiu o clique. Cruzada com `ORIGENS` do Python por teste. */
export type OrigemDoClique = "acervo" | "artista" | "gira";

export function registrarCliqueNoPonto(
  pontoId: string,
  origem: OrigemDoClique = "acervo",
): void {
  try {
    const url = `/api/v1/pontos/${encodeURIComponent(pontoId)}/clique?origem=${origem}`;
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(url);
      return;
    }
    // Navegador sem `sendBeacon`: tenta e desiste em silêncio. `keepalive`
    // pede ao navegador que não cancele ao trocar de página.
    void fetch(url, { method: "POST", keepalive: true, credentials: "same-origin" })
      .catch(() => {});
  } catch {
    /* métrica nunca atrapalha quem está usando o app */
  }
}
