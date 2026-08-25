import { sql } from "drizzle-orm";
import { pgTable, text, integer, boolean, uuid, jsonb, pgEnum, timestamp, uniqueIndex, check } from "drizzle-orm/pg-core";
import { pk, timestamps } from "./_shared";
import { users } from "./auth";
import { organizacoes } from "./org";

// Provider-agnóstico (Mercado Pago primário; Stripe plano B). Sem colunas acopladas a um gateway.
export const intervaloPlano = pgEnum("intervalo_plano", ["mensal", "anual", "unico"]); // unico = vitalício/pacote
export const statusAssinatura = pgEnum("status_assinatura", [
  "trial",
  "ativa",
  "inadimplente",
  "cancelada",
  "expirada",
]);

// Entitlements por plano. `acessoAcervo` gateia o DOWNLOAD/sync do conteúdo canônico
// curado (escopo='canonical'). O conteúdo do PRÓPRIO usuário nunca é gateado.
export type LimitesPlano = {
  acessoAcervo?: boolean; // baixar/sincronizar a biblioteca canônica curada
  downloadOffline?: boolean; // export/backup offline do acervo
  syncNuvem?: boolean; // sync multi-dispositivo contínuo
  colaboracaoTerreiro?: boolean; // módulo terreiro (orgs, gira do dia, papéis)
  maxPontosPessoais?: number; // ausente/null = ilimitado
  maxMembros?: number;
};

export const planos = pgTable(
  "planos",
  {
    id: pk(),
    codigo: text("codigo").notNull(), // "gratis" | "fundador" | "pro" | "terreiro"
    nome: text("nome").notNull(),
    precoCentavos: integer("preco_centavos").notNull().default(0),
    intervalo: intervaloPlano("intervalo").notNull().default("mensal"),
    limites: jsonb("limites").$type<LimitesPlano>().notNull().default({}),
    provider: text("provider"), // "mercadopago" | "stripe" | null (grátis)
    providerPriceId: text("provider_price_id"),
    ativo: boolean("ativo").notNull().default(true),
    ...timestamps(),
  },
  (t) => [uniqueIndex("planos_codigo_uk").on(t.codigo)],
);

export const assinaturas = pgTable(
  "assinaturas",
  {
    id: pk(),
    assinanteUserId: uuid("assinante_user_id").references(() => users.id, { onDelete: "set null" }),
    orgId: uuid("org_id").references(() => organizacoes.id, { onDelete: "set null" }),
    planoId: uuid("plano_id")
      .notNull()
      .references(() => planos.id),
    status: statusAssinatura("status").notNull().default("trial"),
    vitalicio: boolean("vitalicio").notNull().default(false), // pagamento único, sem expiração
    provider: text("provider"),
    providerCustomerId: text("provider_customer_id"),
    providerSubId: text("provider_sub_id"),
    periodoFim: timestamp("periodo_fim", { withTimezone: true }), // null = sem expiração (vitalício)
    cancelarNoFim: boolean("cancelar_no_fim").notNull().default(false),
    ...timestamps(),
  },
  (t) => [
    // um assinante OU uma org, nunca ambos/nenhum
    check("assinatura_alvo_ck", sql`(${t.assinanteUserId} IS NULL) <> (${t.orgId} IS NULL)`),
    uniqueIndex("assinatura_provider_sub_uk").on(t.providerSubId).where(sql`${t.providerSubId} IS NOT NULL`),
  ],
);

// Log idempotente de webhooks (a fonte da verdade que libera acesso é ISTO, nunca o redirect).
export const eventosFaturamento = pgTable(
  "eventos_faturamento",
  {
    id: pk(),
    provider: text("provider").notNull(),
    providerEventId: text("provider_event_id").notNull(),
    tipo: text("tipo").notNull(),
    payload: jsonb("payload").notNull(),
    processadoEm: timestamp("processado_em", { withTimezone: true }),
    criadoEm: timestamps().criadoEm,
  },
  (t) => [uniqueIndex("eventos_provider_uk").on(t.provider, t.providerEventId)],
);

export type Plano = typeof planos.$inferSelect;
export type Assinatura = typeof assinaturas.$inferSelect;
