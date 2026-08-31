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

export interface Novidade {
  ponto: Ponto;
  orixa: OrixaDaNovidade;
}

export async function novidades(): Promise<Novidade[]> {
  const corpo = await chamarApi<Array<Record<string, unknown>>>("/novidades");
  return corpo.map((p) => {
    const o = (p.orixa ?? {}) as Record<string, unknown>;
    const video = p.video as Record<string, unknown> | null;
    return {
      orixa: {
        id: String(o.id ?? ""),
        nome: String(o.nome ?? "Sem orixá"),
        cor: (o.cor as string | null) ?? null,
        emoji: (o.emoji as string | null) ?? null,
      },
      ponto: {
        id: String(p.id),
        subcategoriaId: String(p.subcategoria_id ?? ""),
        orixaId: String(o.id ?? ""),
        titulo: String(p.titulo ?? ""),
        letra: String(p.letra ?? ""),
        autor: (p.autor as string | null) ?? null,
        aprovadoEm: p.aprovado_em ? Date.parse(String(p.aprovado_em)) : null,
        enviadoPor: (p.enviado_por as string | null) ?? null,
        // Resolvido na renderização, a partir do acervo: o favorito é do
        // acervo da pessoa, e esta rota não o conhece.
        favorito: false,
        ordem: Number(p.ordem ?? 0),
        criadoEm: 0,
        // O vídeo vem do servidor já respeitando o plano: sem plano ele
        // simplesmente não é enviado. Aqui só se lê o que chegou.
        videoUrl: (video?.url as string | null) ?? null,
        videoStatus: (video?.status as string | null) ?? null,
        videoCanal: (video?.canal as string | null) ?? null,
        videoTitulo: (video?.titulo as string | null) ?? null,
      } as Ponto,
    };
  });
}
