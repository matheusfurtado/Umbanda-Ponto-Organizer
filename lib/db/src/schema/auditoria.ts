import { pgTable, text, uuid, jsonb, index } from "drizzle-orm/pg-core";
import { pk, timestamps } from "./_shared";
import { users } from "./auth";
import { organizacoes } from "./org";

// Trilha append-only de ações sensíveis (editar ponto, convidar membro, etc.).
export const registroAuditoria = pgTable(
  "registro_auditoria",
  {
    id: pk(),
    atorUserId: uuid("ator_user_id").references(() => users.id, { onDelete: "set null" }),
    orgId: uuid("org_id").references(() => organizacoes.id, { onDelete: "set null" }),
    acao: text("acao").notNull(), // "ponto.editar", "membro.convidar"...
    recursoTipo: text("recurso_tipo").notNull(),
    recursoId: uuid("recurso_id"),
    dadosAntes: jsonb("dados_antes"),
    dadosDepois: jsonb("dados_depois"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    criadoEm: timestamps().criadoEm,
  },
  (t) => [
    index("audit_recurso_idx").on(t.recursoTipo, t.recursoId),
    index("audit_org_idx").on(t.orgId, t.criadoEm),
  ],
);
