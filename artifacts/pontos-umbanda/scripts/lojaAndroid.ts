/**
 * O que o manifest diz sobre o app da Play — quando ele existir.
 *
 * ## O defeito que isto impede
 *
 * Publicado o TWA, o Chrome no Android **continua oferecendo instalar o PWA**.
 * A pessoa que instalou pela loja e depois abre o site recebe "adicionar à tela
 * de início" e fica com **dois ícones da mesma coisa** — dois atalhos, dois
 * lugares onde ela pode ter favoritado, e nenhuma pista de qual é qual.
 *
 * `related_applications` diz ao navegador que existe um app nativo equivalente,
 * e `prefer_related_applications` manda ele recomendar aquele em vez do PWA.
 *
 * ## Por que os dois campos são amarrados a `naPlay()`
 *
 * `prefer_related_applications: true` **cala o convite de instalar o PWA**. Se
 * ele for para o ar antes de o app existir na Play, o Chrome deixa de oferecer
 * a instalação e não oferece nada no lugar: o único canal de distribuição que
 * este produto tem hoje (ADR 0008 recomenda PWA primeiro) morre em silêncio.
 *
 * Por isso a condição não é "alguém escolheu um nome de pacote", e sim **os
 * dois fatos que só existem depois de o app estar na Play**: o `applicationId`
 * e a impressão da chave com que a Play assina. São os mesmos dois que
 * `routers/bem_conhecido.py` exige para servir o `assetlinks.json`, e com os
 * mesmos nomes de variável — um fato, um nome, dos dois lados.
 */

/** O `applicationId` do app na Play. */
export function pacote(env: NodeJS.ProcessEnv = process.env): string {
  return (env.PONTOS_ANDROID_PACOTE ?? "").trim();
}

/**
 * O app está MESMO na Play?
 *
 * Exige os dois fatos. A impressão da chave só sai do Play Console depois do
 * primeiro envio, então ela é a prova de que existe app publicado — e é o que
 * separa "escolhi um nome" de "está no ar".
 */
export function naPlay(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(pacote(env)) && Boolean((env.PONTOS_ANDROID_FINGERPRINTS ?? "").trim());
}

/** O pedaço do manifest. Vazio enquanto não houver app na Play. */
export function relacionados(env: NodeJS.ProcessEnv = process.env): Record<string, unknown> {
  if (!naPlay(env)) return {};
  const id = pacote(env);
  return {
    related_applications: [
      {
        platform: "play",
        id,
        url: `https://play.google.com/store/apps/details?id=${encodeURIComponent(id)}`,
      },
    ],
    // Só junto, nunca sozinho: `true` sem `related_applications` cala o convite
    // do PWA e não aponta para lugar nenhum.
    prefer_related_applications: true,
  };
}
