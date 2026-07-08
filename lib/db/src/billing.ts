import { and, eq, inArray } from "drizzle-orm";
import { db } from "./index";
import { planos, assinaturas, eventosFaturamento, type LimitesPlano } from "./schema";

// Entitlements efetivos do usuário = os limites do plano da assinatura ativa (ou grátis).
export interface Entitlements extends LimitesPlano {
  plano: string;
}

export const ENTITLEMENTS_GRATIS: Entitlements = {
  plano: "gratis",
  acessoAcervo: false,
  downloadOffline: false,
  syncNuvem: false,
  colaboracaoTerreiro: false,
};

export async function getEntitlements(userId: string): Promise<Entitlements> {
  // TODAS as assinaturas ativa/trial (um usuário pode ter mais de um plano; ex.: fundador
  // vitalício + uma pro vencida). Consideramos só as VÁLIDAS e fazemos merge (OR) dos limites,
  // para nunca rebaixar um vitalício pago por causa de uma recorrente vencida.
  const subs = await db.query.assinaturas.findMany({
    where: and(eq(assinaturas.assinanteUserId, userId), inArray(assinaturas.status, ["ativa", "trial"])),
  });
  const agora = Date.now();
  const validas = subs.filter((s) => s.vitalicio || !s.periodoFim || new Date(s.periodoFim).getTime() >= agora);
  if (validas.length === 0) return ENTITLEMENTS_GRATIS;

  const planoIds = [...new Set(validas.map((s) => s.planoId))];
  const planosValidos = await db.query.planos.findMany({ where: inArray(planos.id, planoIds) });
  if (planosValidos.length === 0) return ENTITLEMENTS_GRATIS;

  const ent: Entitlements = { ...ENTITLEMENTS_GRATIS };
  for (const p of planosValidos) {
    const l = p.limites;
    ent.acessoAcervo = ent.acessoAcervo || !!l.acessoAcervo;
    ent.downloadOffline = ent.downloadOffline || !!l.downloadOffline;
    ent.syncNuvem = ent.syncNuvem || !!l.syncNuvem;
    ent.colaboracaoTerreiro = ent.colaboracaoTerreiro || !!l.colaboracaoTerreiro;
    if (l.maxMembros != null) ent.maxMembros = Math.max(ent.maxMembros ?? 0, l.maxMembros);
  }
  // Nome exibido = plano válido de maior valor (o "principal").
  const principal = [...planosValidos].sort((a, b) => b.precoCentavos - a.precoCentavos)[0];
  ent.plano = principal.codigo;
  return ent;
}

export async function planoPorCodigo(codigo: string) {
  return db.query.planos.findFirst({ where: eq(planos.codigo, codigo) });
}

// Concede/renova um plano ao usuário. É o que o webhook chama quando o pagamento é aprovado.
export async function ativarAssinaturaPorPlano(
  userId: string,
  codigoPlano: string,
  dados: { provider?: string; providerSubId?: string; providerCustomerId?: string } = {},
): Promise<string> {
  const plano = await db.query.planos.findFirst({ where: eq(planos.codigo, codigoPlano) });
  if (!plano) throw new Error(`Plano "${codigoPlano}" não existe.`);

  const vitalicio = plano.intervalo === "unico";
  const dias = plano.intervalo === "anual" ? 365 : plano.intervalo === "mensal" ? 30 : 0;
  const periodoFim = vitalicio ? null : new Date(Date.now() + dias * 86_400_000);

  const existente = await db.query.assinaturas.findFirst({
    where: and(eq(assinaturas.assinanteUserId, userId), eq(assinaturas.planoId, plano.id)),
  });
  if (existente) {
    await db
      .update(assinaturas)
      .set({ status: "ativa", vitalicio, periodoFim, atualizadoEm: new Date(), ...dados })
      .where(eq(assinaturas.id, existente.id));
    return existente.id;
  }
  const [row] = await db
    .insert(assinaturas)
    .values({ assinanteUserId: userId, planoId: plano.id, status: "ativa", vitalicio, periodoFim, ...dados })
    .returning({ id: assinaturas.id });
  return row.id;
}

// Idempotência de webhook por processamento (não só por existência): registra o evento e
// diz se JÁ FOI PROCESSADO. O handler só marca processado DEPOIS de ativar/revogar com sucesso —
// assim, se a ativação falhar, `processadoEm` fica null e a reentrega do provedor reprocessa.
export async function registrarEventoFaturamento(
  provider: string,
  providerEventId: string,
  tipo: string,
  payload: unknown,
): Promise<{ id: string; jaProcessado: boolean }> {
  const [inserido] = await db
    .insert(eventosFaturamento)
    .values({ provider, providerEventId, tipo, payload: payload as object })
    .onConflictDoNothing({ target: [eventosFaturamento.provider, eventosFaturamento.providerEventId] })
    .returning({ id: eventosFaturamento.id });
  if (inserido) return { id: inserido.id, jaProcessado: false };
  const existente = await db.query.eventosFaturamento.findFirst({
    where: and(eq(eventosFaturamento.provider, provider), eq(eventosFaturamento.providerEventId, providerEventId)),
  });
  if (!existente) return { id: "", jaProcessado: false };
  return { id: existente.id, jaProcessado: existente.processadoEm != null };
}

export async function marcarEventoProcessado(id: string): Promise<void> {
  if (!id) return;
  await db.update(eventosFaturamento).set({ processadoEm: new Date() }).where(eq(eventosFaturamento.id, id));
}

// Revoga o acesso quando o pagamento é estornado/cancelado/contestado. getEntitlements só
// considera status em [ativa,trial], então virar 'cancelada' já retira o acessoAcervo.
export async function revogarAssinaturaPorPlano(userId: string, codigoPlano: string): Promise<void> {
  const plano = await db.query.planos.findFirst({ where: eq(planos.codigo, codigoPlano) });
  if (!plano) return;
  await db
    .update(assinaturas)
    .set({ status: "cancelada", vitalicio: false, atualizadoEm: new Date() })
    .where(and(eq(assinaturas.assinanteUserId, userId), eq(assinaturas.planoId, plano.id)));
}
