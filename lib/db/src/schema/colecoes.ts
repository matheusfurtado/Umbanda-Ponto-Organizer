import { pgTable, text, uuid, pgEnum, date, index, uniqueIndex } from "drizzle-orm/pg-core";
import { pk, timestamps, escopoConteudo, visibilidade, checkEscopo } from "./_shared";
import { users } from "./auth";
import { organizacoes } from "./org";
import { pontos } from "./conteudo";

// A "gira do dia" (setlist) — eixo B2B mais defensável (colaboração do terreiro).
export const tipoColecao = pgEnum("tipo_colecao", ["setlist", "playlist"]);

export const colecoes = pgTable(
  "colecoes",
  {
    id: pk(),
    escopo: escopoConteudo("escopo").notNull().default("user"),
    donoUserId: uuid("dono_user_id").references(() => users.id, { onDelete: "cascade" }),
    orgId: uuid("org_id").references(() => organizacoes.id, { onDelete: "cascade" }),
    criadoPor: uuid("criado_por").references(() => users.id, { onDelete: "set null" }),
    nome: text("nome").notNull(),
    tipo: tipoColecao("tipo").notNull().default("playlist"),
    dataGira: date("data_gira"),
    visibilidade: visibilidade("visibilidade").notNull().default("privado"),
    ...timestamps(),
  },
  (t) => [checkEscopo(t, "colecoes_escopo_ck"), index("colecoes_org_idx").on(t.orgId)],
);

export const colecaoItens = pgTable(
  "colecao_itens",
  {
    id: pk(),
    colecaoId: uuid("colecao_id")
      .notNull()
      .references(() => colecoes.id, { onDelete: "cascade" }),
    pontoId: uuid("ponto_id")
      .notNull()
      .references(() => pontos.id, { onDelete: "cascade" }),
    posicao: text("posicao").notNull(),
    nota: text("nota"),
    criadoEm: timestamps().criadoEm,
  },
  (t) => [index("col_itens_colecao_idx").on(t.colecaoId), uniqueIndex("col_itens_uk").on(t.colecaoId, t.pontoId)],
);
