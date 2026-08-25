import { pgTable, text, boolean, uuid, pgEnum, index } from "drizzle-orm/pg-core";
import { pk, timestamps } from "./_shared";
import { users } from "./auth";

// LGPD: a mera existência de conta já revela convicção religiosa (dado sensível, Art. 11-I).
// Consentimento genérico é insuficiente — registramos dois consentimentos SEPARADOS
// (Termos de Uso + tratamento de dado religioso), append-only, com versão/timestamp/IP.
export const tipoConsentimento = pgEnum("tipo_consentimento", [
  "termos_de_uso",
  "dado_religioso",
  "comunicacoes",
]);

export const consentimentos = pgTable(
  "consentimentos",
  {
    id: pk(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tipo: tipoConsentimento("tipo").notNull(),
    versao: text("versao").notNull(), // versão do texto aceito (ex.: "2026-07-07")
    aceito: boolean("aceito").notNull(),
    ip: text("ip"),
    userAgent: text("user_agent"),
    criadoEm: timestamps().criadoEm,
  },
  (t) => [index("consent_user_idx").on(t.userId, t.tipo)],
);

export type Consentimento = typeof consentimentos.$inferSelect;
