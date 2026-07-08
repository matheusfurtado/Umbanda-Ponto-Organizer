import { sql } from "drizzle-orm";
import { pgTable, text, integer, uuid, index, uniqueIndex, type AnyPgColumn } from "drizzle-orm/pg-core";
import { pk, timestamps, escopoConteudo, visibilidade, checkEscopo } from "./_shared";
import { users } from "./auth";
import { organizacoes } from "./org";

// O núcleo: conteúdo com discriminador de escopo (canonical | user | org).
// `favorito` e `ordem` NÃO vivem aqui — vão para estado-usuario.ts (por-usuário).

export const orixas = pgTable(
  "orixas",
  {
    id: pk(),
    escopo: escopoConteudo("escopo").notNull().default("user"),
    donoUserId: uuid("dono_user_id").references(() => users.id, { onDelete: "cascade" }),
    orgId: uuid("org_id").references(() => organizacoes.id, { onDelete: "cascade" }),
    criadoPor: uuid("criado_por").references(() => users.id, { onDelete: "set null" }),
    slug: text("slug"),
    legacyId: text("legacy_id"),
    nome: text("nome").notNull(),
    cor: text("cor").notNull().default("#64748b"),
    emoji: text("emoji").notNull().default("🕯️"),
    posicaoPadrao: text("posicao_padrao"), // ordem canônica (fracionária)
    ...timestamps(),
  },
  (t) => [
    checkEscopo(t, "orixas_escopo_ck"),
    uniqueIndex("orixas_canonical_slug_uk").on(t.slug).where(sql`${t.escopo} = 'canonical'`),
    uniqueIndex("orixas_dono_legacy_uk").on(t.donoUserId, t.legacyId).where(sql`${t.donoUserId} IS NOT NULL`),
    index("orixas_dono_idx").on(t.donoUserId),
    index("orixas_org_idx").on(t.orgId),
  ],
);

export const subcategorias = pgTable(
  "subcategorias",
  {
    id: pk(),
    orixaId: uuid("orixa_id")
      .notNull()
      .references(() => orixas.id, { onDelete: "cascade" }),
    escopo: escopoConteudo("escopo").notNull().default("user"),
    donoUserId: uuid("dono_user_id").references(() => users.id, { onDelete: "cascade" }),
    orgId: uuid("org_id").references(() => organizacoes.id, { onDelete: "cascade" }),
    criadoPor: uuid("criado_por").references(() => users.id, { onDelete: "set null" }),
    slug: text("slug"),
    legacyId: text("legacy_id"),
    nome: text("nome").notNull(),
    posicaoPadrao: text("posicao_padrao"),
    ...timestamps(),
  },
  (t) => [
    checkEscopo(t, "subcategorias_escopo_ck"),
    index("subs_orixa_idx").on(t.orixaId),
    index("subs_dono_idx").on(t.donoUserId),
    uniqueIndex("subs_dono_legacy_uk").on(t.donoUserId, t.legacyId).where(sql`${t.donoUserId} IS NOT NULL`),
  ],
);

export const pontos = pgTable(
  "pontos",
  {
    id: pk(),
    subcategoriaId: uuid("subcategoria_id")
      .notNull()
      .references(() => subcategorias.id, { onDelete: "cascade" }),
    escopo: escopoConteudo("escopo").notNull().default("user"),
    donoUserId: uuid("dono_user_id").references(() => users.id, { onDelete: "cascade" }),
    orgId: uuid("org_id").references(() => organizacoes.id, { onDelete: "cascade" }),
    criadoPor: uuid("criado_por").references(() => users.id, { onDelete: "set null" }),
    visibilidade: visibilidade("visibilidade").notNull().default("privado"),
    titulo: text("titulo").notNull(),
    letra: text("letra").notNull(),
    conteudoHash: text("conteudo_hash").notNull(), // sha256(letra normalizada) p/ dedup
    origemPontoId: uuid("origem_ponto_id").references((): AnyPgColumn => pontos.id, { onDelete: "set null" }),
    versaoAtualId: uuid("versao_atual_id"), // -> ponto_revisoes.id (denormalização; sem FK p/ evitar ciclo)
    slug: text("slug"),
    legacyId: text("legacy_id"),
    ...timestamps(),
  },
  (t) => [
    checkEscopo(t, "pontos_escopo_ck"),
    index("pontos_sub_idx").on(t.subcategoriaId),
    index("pontos_dono_idx").on(t.donoUserId),
    index("pontos_org_idx").on(t.orgId),
    index("pontos_hash_idx").on(t.conteudoHash),
    index("pontos_origem_idx").on(t.origemPontoId),
    uniqueIndex("pontos_dono_legacy_uk").on(t.donoUserId, t.legacyId).where(sql`${t.donoUserId} IS NOT NULL`),
    // NOTA: índice GIN de full-text (to_tsvector 'portuguese') fica p/ quando a busca
    // server-side for implementada — hoje a busca é client-side. Ver blueprint §7.
  ],
);

export const pontoRevisoes = pgTable(
  "ponto_revisoes",
  {
    id: pk(),
    pontoId: uuid("ponto_id")
      .notNull()
      .references(() => pontos.id, { onDelete: "cascade" }),
    versao: integer("versao").notNull(),
    titulo: text("titulo").notNull(),
    letra: text("letra").notNull(),
    conteudoHash: text("conteudo_hash").notNull(),
    criadoPor: uuid("criado_por").references(() => users.id, { onDelete: "set null" }),
    criadoEm: timestamps().criadoEm,
  },
  (t) => [uniqueIndex("ponto_rev_uk").on(t.pontoId, t.versao), index("ponto_rev_ponto_idx").on(t.pontoId)],
);

export type Orixa = typeof orixas.$inferSelect;
export type Subcategoria = typeof subcategorias.$inferSelect;
export type Ponto = typeof pontos.$inferSelect;
export type NovoPonto = typeof pontos.$inferInsert;
