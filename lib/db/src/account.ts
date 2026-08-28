import { and, eq, inArray } from "drizzle-orm";
import { db } from "./index";
import { hashLetra, posFromOrdem } from "./lib/util";
import {
  orixas,
  subcategorias,
  pontos,
  userOrixaState,
  userSubcategoriaState,
  userPontoState,
} from "./schema";

// Formato exatamente igual ao que o frontend já produz em exportarDados() (localStorage).
export interface AppDataImport {
  orixas: Array<{ id: string; nome: string; cor: string; emoji: string; ordem: number; criadoEm?: number }>;
  subcategorias: Array<{ id: string; orixaId: string; nome: string; ordem: number; criadoEm?: number }>;
  pontos: Array<{
    id: string;
    subcategoriaId: string;
    titulo: string;
    letra: string;
    favorito: boolean;
    ordem: number;
    criadoEm?: number;
  }>;
  ultimoOrixaId?: string;
}

export interface ResumoImport {
  orixasCanonicos: number;
  orixasCriados: number;
  subsCanonicos: number;
  subsCriados: number;
  pontosCanonicos: number;
  pontosCriados: number;
  favoritos: number;
}

/**
 * Migra o AppData do localStorage de um usuário para a conta dele.
 * - Casa orixás/subcategorias com o acervo CANÔNICO por `legacyId`; pontos por hash da letra.
 * - O que casa com o canônico NÃO é copiado: grava só o estado do usuário (favorito, ordem, custom).
 * - O que não casa (autoral ou letra divergente) vira conteúdo escopo='user' do próprio usuário.
 * - Idempotente: reimportar não duplica (checa por (donoUserId, legacyId) e pela PK do estado).
 * - Tudo numa única transação (rollback total em falha). NUNCA apaga o localStorage (isso é no cliente).
 */
export async function importarAppData(userId: string, data: AppDataImport): Promise<ResumoImport> {
  return db.transaction(async (tx) => {
    const resumo: ResumoImport = {
      orixasCanonicos: 0,
      orixasCriados: 0,
      subsCanonicos: 0,
      subsCriados: 0,
      pontosCanonicos: 0,
      pontosCriados: 0,
      favoritos: 0,
    };
    const mapOrixa = new Map<string, string>(); // legacyId -> uuid (canônico ou do usuário)
    const mapSub = new Map<string, string>();

    for (const o of data.orixas) {
      const canon = await tx.query.orixas.findFirst({
        where: and(eq(orixas.escopo, "canonical"), eq(orixas.legacyId, o.id)),
      });
      if (canon) {
        mapOrixa.set(o.id, canon.id);
        resumo.orixasCanonicos++;
        await tx
          .insert(userOrixaState)
          .values({
            userId,
            orixaId: canon.id,
            posicao: posFromOrdem(o.ordem),
            nomeCustom: o.nome !== canon.nome ? o.nome : null,
            corCustom: o.cor !== canon.cor ? o.cor : null,
            emojiCustom: o.emoji !== canon.emoji ? o.emoji : null,
          })
          .onConflictDoUpdate({
            target: [userOrixaState.userId, userOrixaState.orixaId],
            set: { posicao: posFromOrdem(o.ordem) },
          });
      } else {
        let existente = await tx.query.orixas.findFirst({
          where: and(eq(orixas.donoUserId, userId), eq(orixas.legacyId, o.id)),
        });
        if (!existente) {
          const [row] = await tx
            .insert(orixas)
            .values({
              escopo: "user",
              donoUserId: userId,
              criadoPor: userId,
              legacyId: o.id,
              nome: o.nome,
              cor: o.cor,
              emoji: o.emoji,
              posicaoPadrao: posFromOrdem(o.ordem),
            })
            .returning();
          existente = row;
          resumo.orixasCriados++;
        }
        mapOrixa.set(o.id, existente.id);
      }
    }

    for (const s of data.subcategorias) {
      const orixaUuid = mapOrixa.get(s.orixaId);
      if (!orixaUuid) continue; // órfã (orixa não veio no payload)
      const canon = await tx.query.subcategorias.findFirst({
        where: and(eq(subcategorias.escopo, "canonical"), eq(subcategorias.legacyId, s.id)),
      });
      if (canon) {
        mapSub.set(s.id, canon.id);
        resumo.subsCanonicos++;
        await tx
          .insert(userSubcategoriaState)
          .values({
            userId,
            subcategoriaId: canon.id,
            posicao: posFromOrdem(s.ordem),
            nomeCustom: s.nome !== canon.nome ? s.nome : null,
          })
          .onConflictDoUpdate({
            target: [userSubcategoriaState.userId, userSubcategoriaState.subcategoriaId],
            set: { posicao: posFromOrdem(s.ordem) },
          });
      } else {
        let existente = await tx.query.subcategorias.findFirst({
          where: and(eq(subcategorias.donoUserId, userId), eq(subcategorias.legacyId, s.id)),
        });
        if (!existente) {
          const [row] = await tx
            .insert(subcategorias)
            .values({
              escopo: "user",
              donoUserId: userId,
              criadoPor: userId,
              orixaId: orixaUuid,
              legacyId: s.id,
              nome: s.nome,
              posicaoPadrao: posFromOrdem(s.ordem),
            })
            .returning();
          existente = row;
          resumo.subsCriados++;
        }
        mapSub.set(s.id, existente.id);
      }
    }

    for (const p of data.pontos) {
      const subUuid = mapSub.get(p.subcategoriaId);
      if (!subUuid) continue;
      const h = hashLetra(p.letra);
      const canon = await tx.query.pontos.findFirst({
        where: and(eq(pontos.escopo, "canonical"), eq(pontos.conteudoHash, h)),
      });
      let pontoId: string;
      if (canon) {
        pontoId = canon.id;
        resumo.pontosCanonicos++;
      } else {
        let existente = await tx.query.pontos.findFirst({
          where: and(eq(pontos.donoUserId, userId), eq(pontos.legacyId, p.id)),
        });
        if (!existente) {
          const [row] = await tx
            .insert(pontos)
            .values({
              escopo: "user",
              donoUserId: userId,
              criadoPor: userId,
              subcategoriaId: subUuid,
              legacyId: p.id,
              titulo: p.titulo,
              letra: p.letra,
              conteudoHash: h,
            })
            .returning();
          existente = row;
          resumo.pontosCriados++;
        }
        pontoId = existente.id;
      }
      await tx
        .insert(userPontoState)
        .values({ userId, pontoId, favorito: p.favorito, posicao: posFromOrdem(p.ordem) })
        .onConflictDoUpdate({
          target: [userPontoState.userId, userPontoState.pontoId],
          set: { favorito: p.favorito, posicao: posFromOrdem(p.ordem) },
        });
      if (p.favorito) resumo.favoritos++;
    }

    return resumo;
  });
}

function ordemDe(pos: string | null | undefined, padrao: string | null | undefined, fallback: number): number {
  const v = pos ?? padrao;
  const n = v != null ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) ? n : fallback;
}
function paraMs(d: Date | string | null): number {
  return d ? new Date(d).getTime() : Date.now();
}

/**
 * Remonta o AppData (formato do frontend) a partir da conta, para o app ler quando logado
 * (ex.: 2º aparelho). Inclui: o conteúdo canônico que o usuário TEM (via user_ponto_state,
 * criado na migração) com seus overrides (favorito, ordem, nome/cor/emoji custom), mais o
 * conteúdo autoral (escopo='user'). Um usuário que nunca migrou/criou nada vê pouco/nada —
 * o acervo canônico completo é o produto pago (gate por entitlement entra na Fase 2).
 */
export async function reconstruirAppData(
  userId: string,
  opts: { incluirAcervoCompleto?: boolean } = {},
): Promise<AppDataImport> {
  const [estPontos, estOrixas, estSubs, orixasUser, subsUser] = await Promise.all([
    db.select().from(userPontoState).where(eq(userPontoState.userId, userId)),
    db.select().from(userOrixaState).where(eq(userOrixaState.userId, userId)),
    db.select().from(userSubcategoriaState).where(eq(userSubcategoriaState.userId, userId)),
    db.select().from(orixas).where(eq(orixas.donoUserId, userId)),
    db.select().from(subcategorias).where(eq(subcategorias.donoUserId, userId)),
  ]);

  const mapEstPonto = new Map(estPontos.map((e) => [e.pontoId, e]));
  const mapEstOrixa = new Map(estOrixas.map((e) => [e.orixaId, e]));
  const mapEstSub = new Map(estSubs.map((e) => [e.subcategoriaId, e]));

  // Pontos: todos os que o usuário tem estado (canônico casado OU autoral), exceto ocultos.
  const pontoIds = estPontos.filter((e) => !e.oculto).map((e) => e.pontoId);
  const pontosRows = pontoIds.length ? await db.select().from(pontos).where(inArray(pontos.id, pontoIds)) : [];

  // Gate do acervo: quem tem acessoAcervo (plano pago) recebe TODA a biblioteca canônica;
  // quem é grátis recebe só o que migrou/criou. É aqui que o "vitalício" entrega valor.
  if (opts.incluirAcervoCompleto) {
    const canon = await db.select().from(pontos).where(eq(pontos.escopo, "canonical"));
    const vistos = new Set(pontosRows.map((p) => p.id));
    for (const p of canon) if (!vistos.has(p.id)) pontosRows.push(p);
  }

  // Subcategorias necessárias: pais dos pontos + subs autorais + subs com estado.
  const subIds = new Set<string>([
    ...pontosRows.map((p) => p.subcategoriaId),
    ...subsUser.map((s) => s.id),
    ...estSubs.map((e) => e.subcategoriaId),
  ]);
  const subsRows = subIds.size ? await db.select().from(subcategorias).where(inArray(subcategorias.id, [...subIds])) : [];

  // Orixás necessários: pais das subs + orixás autorais + orixás com estado.
  const orixaIds = new Set<string>([
    ...subsRows.map((s) => s.orixaId),
    ...orixasUser.map((o) => o.id),
    ...estOrixas.map((e) => e.orixaId),
  ]);
  const orixasRows = orixaIds.size ? await db.select().from(orixas).where(inArray(orixas.id, [...orixaIds])) : [];

  return {
    orixas: orixasRows.map((o, i) => {
      const st = mapEstOrixa.get(o.id);
      return {
        id: o.id,
        nome: st?.nomeCustom ?? o.nome,
        cor: st?.corCustom ?? o.cor,
        emoji: st?.emojiCustom ?? o.emoji,
        ordem: ordemDe(st?.posicao, o.posicaoPadrao, i),
        criadoEm: paraMs(o.criadoEm),
      };
    }),
    subcategorias: subsRows.map((s, i) => {
      const st = mapEstSub.get(s.id);
      return {
        id: s.id,
        orixaId: s.orixaId,
        nome: st?.nomeCustom ?? s.nome,
        ordem: ordemDe(st?.posicao, s.posicaoPadrao, i),
        criadoEm: paraMs(s.criadoEm),
      };
    }),
    pontos: pontosRows.map((p, i) => {
      const st = mapEstPonto.get(p.id);
      return {
        id: p.id,
        subcategoriaId: p.subcategoriaId,
        titulo: p.titulo,
        letra: p.letra,
        favorito: st?.favorito ?? false,
        ordem: ordemDe(st?.posicao, null, i),
        criadoEm: paraMs(p.criadoEm),
      };
    }),
  };
}

/** Portabilidade LGPD: todos os dados pessoais do usuário (conteúdo autoral + estados). */
export async function exportarAppData(userId: string) {
  const [orixasPessoais, subcategoriasPessoais, pontosPessoais, estadoOrixas, estadoSubcategorias, estadoPontos] =
    await Promise.all([
      db.select().from(orixas).where(eq(orixas.donoUserId, userId)),
      db.select().from(subcategorias).where(eq(subcategorias.donoUserId, userId)),
      db.select().from(pontos).where(eq(pontos.donoUserId, userId)),
      db.select().from(userOrixaState).where(eq(userOrixaState.userId, userId)),
      db.select().from(userSubcategoriaState).where(eq(userSubcategoriaState.userId, userId)),
      db.select().from(userPontoState).where(eq(userPontoState.userId, userId)),
    ]);
  return {
    exportadoEm: new Date().toISOString(),
    orixasPessoais,
    subcategoriasPessoais,
    pontosPessoais,
    estadoOrixas,
    estadoSubcategorias,
    estadoPontos,
  };
}
