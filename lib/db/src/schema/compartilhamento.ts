import { sql } from "drizzle-orm";
import { pgTable, text, uuid, pgEnum, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";
import { pk, timestamps } from "./_shared";
import { users } from "./auth";
import { organizacoes } from "./org";

// Unifica share-para-usuário, share-para-org e link público com token.
export const recursoTipo = pgEnum("recurso_tipo", ["ponto", "colecao"]);
export const alvoTipo = pgEnum("alvo_tipo", ["user", "org", "link"]);
export const permissao = pgEnum("permissao", ["ler", "editar"]);

export const compartilhamentos = pgTable(
  "compartilhamentos",
  {
    id: pk(),
    recursoTipo: recursoTipo("recurso_tipo").notNull(),
    recursoId: uuid("recurso_id").notNull(),
    alvoTipo: alvoTipo("alvo_tipo").notNull(),
    alvoUserId: uuid("alvo_user_id").references(() => users.id, { onDelete: "cascade" }),
    alvoOrgId: uuid("alvo_org_id").references(() => organizacoes.id, { onDelete: "cascade" }),
    token: text("token"), // preenchido quando alvo_tipo='link'
    permissao: permissao("permissao").notNull().default("ler"),
    criadoPor: uuid("criado_por").references(() => users.id, { onDelete: "set null" }),
    expiraEm: timestamp("expira_em", { withTimezone: true }),
    ...timestamps(),
  },
  (t) => [
    index("compart_recurso_idx").on(t.recursoTipo, t.recursoId),
    uniqueIndex("compart_token_uk").on(t.token).where(sql`${t.token} IS NOT NULL`),
  ],
);
