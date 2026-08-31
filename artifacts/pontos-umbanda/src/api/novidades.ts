/**
 * O que a comunidade acrescentou ao acervo nos últimos 30 dias.
 *
 * ## Por que isto saiu de dentro da tela
 *
 * A `TelaNovidades` fazia `fetch("/api/v1/novidades")` na mão, com
 * `r.ok ? r.json() : Promise.reject(new Error("Falha ao carregar."))`. Três
 * coisas se perdiam nisso:
 *
 * 1. **O vocabulário de erro.** `Error` cru não é `ErroApi` nem `ErroRede`, e
 *    `mensagemDeErro` cai no texto padrão — a tela dizia "Falha." para queda
 *    de rede, para servidor fora do ar e para resposta malformada, sem
 *    distinguir nenhuma.
 * 2. **O tempo limite.** O `chamarApi` desiste em 8 s, "porque na gira o
 *    celular costuma estar em rede ruim e esperar 30 s parado é pior". Este
 *    caminho esperava para sempre.
 * 3. **A conferência da fronteira.** O teste do lado do Python
 *    (`test_front_chama_rota_que_existe.py`) lê os módulos de `api/`; rota
 *    chamada de dentro de uma tela não passava por ele.
 *
 * ## A tradução de nome fica AQUI, e não na tela
 *
 * Esta rota responde em `snake_case` (`aprovado_em`, `enviado_por`,
 * `subcategoria_id`) porque o schema dela não declara apelido — ao contrário
 * do `GET /acervo`, que é `camelCase`. A tela não tem por que saber disso: o
 * trabalho de um módulo de `api/` é justamente entregar a forma que o app usa.
 *
 * ## Por que a resposta crua é uma INTERFACE, e não `Record<string, unknown>`
 *
 * Foi assim que nasceu, e a cerca de vocabulário (`test_vocabulario_
 * compartilhado.py`) reprovou — com razão. Ela confere que todo campo que o
 * front lê de uma resposta existe mesmo no schema do servidor, e faz isso
 * lendo as `interface` de `api/*.ts`. Com a resposta tipada como saco de
 * `unknown`, os dez campos lidos aqui ficavam INVISÍVEIS para ela: o servidor
 * podia parar de mandar `enviado_por` e nada acusaria — o crédito de quem
 * enviou o ponto sumiria em silêncio.
 *
 * Declarada, a forma crua entra na `RESPOSTAS` e volta a ser conferida contra
 * `NovidadeOut`. E os `as` desaparecem de quebra.
 */

import { chamarApi } from "@/api/cliente";
import type { Ponto } from "@/types";

/** O orixá vem junto porque a lista mistura vários e o rótulo é metade do ponto. */
export interface OrixaDaNovidade {
  id: string;
  nome: string;
  cor: string | null;
  emoji: string | null;
}

/**
 * O vídeo casado, quando existe. Vem do servidor já respeitando o plano: sem
 * plano ele simplesmente não é enviado, e aqui só se lê o que chegou (ADR
 * 0002 — o portão mora no servidor, não na tela).
 */
export interface VideoDaNovidade {
  url: string | null;
  status: string | null;
  canal: string | null;
  titulo: string | null;
}

/** A linha como o servidor a manda: `snake_case`, com o orixá dentro. */
export interface NovidadeDoServidor {
  id: string;
  titulo: string;
  letra: string;
  ordem: number;
  subcategoria_id: string;
  autor: string | null;
  aprovado_em: string | null;
  enviado_por: string | null;
  orixa: OrixaDaNovidade;
  video: VideoDaNovidade | null;
}

/** A forma que a TELA consome — o orixá separado do ponto, tudo em camelCase. */
export interface Novidade {
  ponto: Ponto;
  orixa: OrixaDaNovidade;
}

export async function novidades(): Promise<Novidade[]> {
  const corpo = await chamarApi<NovidadeDoServidor[]>("/novidades");
  return corpo.map((p) => ({
    orixa: {
      id: p.orixa?.id ?? "",
      // "Sem orixá" e não vazio: a lista é AGRUPADA por este nome, e um grupo
      // sem título vira uma fila de títulos soltos.
      nome: p.orixa?.nome ?? "Sem orixá",
      cor: p.orixa?.cor ?? null,
      emoji: p.orixa?.emoji ?? null,
    },
    ponto: {
      id: p.id,
      subcategoriaId: p.subcategoria_id,
      orixaId: p.orixa?.id ?? "",
      titulo: p.titulo,
      letra: p.letra,
      autor: p.autor,
      aprovadoEm: p.aprovado_em ? Date.parse(p.aprovado_em) : null,
      enviadoPor: p.enviado_por,
      // Resolvido na renderização, a partir do acervo: o favorito é do acervo
      // da pessoa, e esta rota não o conhece.
      favorito: false,
      ordem: p.ordem,
      criadoEm: 0,
      videoUrl: p.video?.url ?? null,
      videoStatus: p.video?.status ?? null,
      videoCanal: p.video?.canal ?? null,
      videoTitulo: p.video?.titulo ?? null,
    } as Ponto,
  }));
}
