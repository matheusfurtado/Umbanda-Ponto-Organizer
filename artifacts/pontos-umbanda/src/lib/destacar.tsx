/**
 * Destaque do termo buscado, ignorando acento e caixa.
 *
 * Extraído do `CardPonto` para a tela do plano grátis usar o MESMO realce —
 * duas implementações divergem no primeiro ajuste, e a busca passa a se
 * comportar diferente em cada tela sem explicação.
 *
 * **Ignorar acento aqui não é enfeite.** A busca já ignora: quem digita
 * "louvacao" encontra o ponto que diz "louvação". Se o destaque fosse literal,
 * o resultado apareceria sem nada marcado e a pessoa não veria POR QUE aquele
 * ponto foi devolvido.
 */

import type React from "react";

/**
 * Versão sem acento e em minúsculas, **do mesmo comprimento** do original.
 *
 * O comprimento importa: as posições encontradas aqui são usadas para fatiar a
 * string ORIGINAL. `normalize("NFD").replace(...)` resolveria o acento mas
 * mudaria o tamanho, e os índices deixariam de casar — o destaque sairia
 * deslocado algumas letras.
 */
function dobrar(texto: string): string {
  let saida = "";
  for (const c of texto) {
    // NFD separa a letra do sinal; o primeiro caractere é a letra base.
    // 'ç' vira 'c', 'ã' vira 'a'. Quem não tem decomposição fica como está.
    saida += c.normalize("NFD")[0].toLowerCase();
  }
  return saida;
}

/**
 * Versão sem acento e em minúsculas, para COMPARAR texto.
 *
 * Exportada de propósito, e é a mesma função que o destaque usa por dentro.
 * As telas de busca tinham cada uma o seu `normalizar` — três implementações da
 * mesma regra, já escritas de formas diferentes. Quando a busca dobra o acento
 * de um jeito e o destaque de outro, o resultado aparece na lista mas o trecho
 * não fica marcado, ou fica marcado no lugar errado.
 *
 * Usar a MESMA função torna a divergência impossível por construção, o que vale
 * mais que um teste conferindo que duas implementações concordam.
 */
export function semAcento(texto: string): string {
  return dobrar(texto);
}

export function destacar(texto: string, busca: string): React.ReactNode {
  const termo = busca.trim();
  if (!termo) return texto;

  const alvo = dobrar(texto);
  const agulha = dobrar(termo);
  if (!agulha) return texto;

  const partes: React.ReactNode[] = [];
  let de = 0;
  let achado = alvo.indexOf(agulha);
  let chave = 0;

  while (achado !== -1) {
    if (achado > de) partes.push(texto.slice(de, achado));
    partes.push(
      <mark key={chave++} className="rounded-sm bg-yellow-400/30 px-0.5 text-yellow-200">
        {/* Fatia o texto ORIGINAL: o realce mostra a grafia de verdade,
            com acento, não a versão normalizada da busca. */}
        {texto.slice(achado, achado + agulha.length)}
      </mark>,
    );
    de = achado + agulha.length;
    achado = alvo.indexOf(agulha, de);
  }

  if (de < texto.length) partes.push(texto.slice(de));
  return partes;
}
