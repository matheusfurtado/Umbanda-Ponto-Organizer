import { pgTable, text, uuid, pgEnum, uniqueIndex, index, primaryKey } from "drizzle-orm/pg-core";
import { pk, timestamps } from "./_shared";
import { users } from "./auth";

// Papéis no terreiro/casa: dirigente (pai/mãe de santo) = admin do repertório;
// editor (ogã/curimbeiro) edita; leitor (médium/cambone) consulta. proprietario = criou/paga.
export const papelMembro = pgEnum("papel_membro", ["proprietario", "dirigente", "editor", "leitor"]);
export const statusMembro = pgEnum("status_membro", ["ativo", "convidado", "suspenso"]);

export const organizacoes = pgTable(
  "organizacoes",
  {
    id: pk(),
    nome: text("nome").notNull(),
    slug: text("slug").notNull(),
    criadoPor: uuid("criado_por").references(() => users.id, { onDelete: "set null" }),
    ...timestamps(),
  },
  (t) => [uniqueIndex("org_slug_uk").on(t.slug)],
);

export const membrosOrganizacao = pgTable(
  "membros_organizacao",
  {
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizacoes.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    papel: papelMembro("papel").notNull().default("leitor"),
    status: statusMembro("status").notNull().default("convidado"),
    convidadoPor: uuid("convidado_por").references(() => users.id, { onDelete: "set null" }),
    criadoEm: timestamps().criadoEm,
  },
  (t) => [primaryKey({ columns: [t.orgId, t.userId] }), index("membros_user_idx").on(t.userId)],
);

export type Organizacao = typeof organizacoes.$inferSelect;
export type MembroOrganizacao = typeof membrosOrganizacao.$inferSelect;
