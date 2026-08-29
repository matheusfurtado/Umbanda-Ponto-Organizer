/**
 * As tags de OpenGraph que dependem do endereço público, montadas no build.
 *
 * ## Por que só estas ficam aqui
 *
 * `og:title`, `og:description`, `og:type`, `og:site_name` e `og:locale` são
 * texto: moram no `index.html`, à vista. Só `og:url` e `og:image` precisam de
 * uma **URL absoluta** — a especificação exige, e o WhatsApp e o Facebook não
 * resolvem caminho relativo. E o endereço deste app ainda não existe: o
 * `docs/adr/0003-hospedagem.md` está adiado de propósito.
 *
 * ## Por que omitir é melhor que chutar
 *
 * A tentação é pôr `/opengraph.png` e esperar que o crawler resolva. Não
 * resolve — e o modo de falha é caro: **o WhatsApp e o Facebook cacheiam o
 * resultado por muito tempo**, então um link compartilhado com preview quebrado
 * continua quebrado para todo mundo que já o recebeu, mesmo depois do conserto.
 *
 * Sem o endereço, saem `og:title` e `og:description` — que já transformam um
 * link cru numa prévia com título e frase. Com o endereço, entra a imagem.
 *
 * É o mesmo raciocínio do `assetlinks.json` em `routers/bem_conhecido.py`:
 * publicar um valor plausível e errado é pior que não publicar.
 *
 * ## Onde o endereço entra
 *
 * `PONTOS_URL_APP`, o MESMO nome que a API usa (`api/src/pontos/config.py`).
 * Um fato, um nome — dois nomes para o mesmo endereço é como um dos dois fica
 * desatualizado sem ninguém ver.
 */

/** O arquivo gerado por `scripts/gerar-opengraph.py`. */
export const IMAGEM = "/opengraph.png";
export const LARGURA = 1200;
export const ALTURA = 630;

export const ALTERNATIVO =
  "Pontos de Umbanda — o acervo organizado por orixá, na ordem da gira";

/**
 * Devolve o HTML a injetar no `<head>`, ou um comentário dizendo por que não.
 *
 * `base` é a origem pública (`https://exemplo.com.br`), normalmente vinda de
 * `process.env.PONTOS_URL_APP`.
 */
export function tagsComEndereco(base: string | undefined): string {
  const limpo = (base ?? "").trim().replace(/\/+$/, "");

  if (!limpo) {
    return [
      "<!-- `og:url` e `og:image` não foram gerados: falta `PONTOS_URL_APP`.",
      "     Eles exigem URL ABSOLUTA, e o endereço público deste app ainda não",
      "     existe (ADR 0003). Publicar um caminho relativo daria prévia",
      "     quebrada — e o WhatsApp cacheia isso por muito tempo. -->",
    ].join("\n");
  }

  if (!/^https?:\/\//.test(limpo)) {
    // Falhar o build é de propósito: `PONTOS_URL_APP=exemplo.com.br` produziria
    // `og:image` inválido, que é exatamente o caso que este módulo evita. O
    // `config.py` da API recusa subir pelo mesmo motivo e com a mesma checagem.
    throw new Error(
      `PONTOS_URL_APP=${limpo} não tem esquema. Comece com https:// — sem ele ` +
        "a URL da imagem não é absoluta e a prévia não monta.",
    );
  }

  return [
    `<meta property="og:url" content="${limpo}/" />`,
    `<meta property="og:image" content="${limpo}${IMAGEM}" />`,
    `<meta property="og:image:width" content="${LARGURA}" />`,
    `<meta property="og:image:height" content="${ALTURA}" />`,
    `<meta property="og:image:alt" content="${ALTERNATIVO}" />`,
    // `summary_large_image` só faz sentido COM imagem — por isso mora aqui, e
    // não no `index.html` junto das tags de texto.
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:image" content="${limpo}${IMAGEM}" />`,
  ].join("\n    ");
}
