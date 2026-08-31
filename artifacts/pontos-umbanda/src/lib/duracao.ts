/**
 * Segundos no formato de faixa: `2:05`, e `1:19:21` quando passa da hora.
 *
 * ## Por que num lugar só
 *
 * Existiam QUATRO implementações disto — `LinhaPonto`, `LinkVideo`,
 * `TelaGiraPublica` e `TelaRepertorios` —, duas como função copiada e duas
 * escritas direto no JSX. Só uma tinha o ramo da hora.
 *
 * O resultado é o que sempre acontece com regra repetida: o conserto entrou
 * numa e as outras três seguiram mostrando **"79:21"** para um vídeo de
 * 1h19. É a mesma lição de `servicos/video_do_ponto.py` no servidor, e de
 * `mensagemDeErro` no cliente — regra que vale em vários lugares,
 * reimplementada em cada um, diverge; e a divergência aparece primeiro para
 * quem usa, não para quem escreve.
 *
 * ## O que o ramo da hora impede
 *
 * Sem ele, `Math.floor(segundos / 60)` devolve 79 minutos em vez de 1h19.
 * Ninguém lê duração assim: quem procura um ponto curto para ensaiar teria de
 * fazer a conta de cabeça. O acervo tem um vídeo de 4761 s hoje e vai ter
 * mais — os canais que o casamento encontra publicam gira inteira, e gira
 * inteira passa da hora.
 *
 * ## `null` para nulo e para zero
 *
 * "0:00" não é informação, é ruído numa coluna que existe para ser lida de
 * relance. Quem chama decide se esconde a coluna ou põe outra coisa.
 */
export function duracao(segundos?: number | null): string | null {
  if (!segundos || segundos < 0) return null;
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  const dois = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${dois(m)}:${dois(s)}` : `${m}:${dois(s)}`;
}
