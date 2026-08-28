import { sql } from "drizzle-orm";
import { pgTable, text, boolean, uuid, timestamp, index, primaryKey } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { pontos, orixas, subcategorias } from "./conteudo";

// A correção do problema estrutural nº 1: favorito + ordem são POR-USUÁRIO,
// fora do conteúdo. A biblioteca canônica é compartilhada por FK, não copiada.
// `posicao` é índice fracionário (string); `oculto` esconde canônico sem deletar;
// `anotacao` é nota pessoal.

export const userPontoState = pgTable(
  "user_ponto_state",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    pontoId: uuid("ponto_id")
      .notNull()
      .references(() => pontos.id, { onDelete: "cascade" }),
    favorito: boolean("favorito").notNull().default(false),
    posicao: text("posicao"),
    oculto: boolean("oculto").notNull().default(false),
    anotacao: text("anotacao"),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.pontoId] }),
    // índice parcial só de favoritos: a lista "meus favoritos" fica barata
    index("ups_fav_idx").on(t.userId).where(sql`${t.favorito}`),
  ],
);

export const userOrixaState = pgTable(
  "user_orixa_state",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orixaId: uuid("orixa_id")
      .notNull()
      .references(() => orixas.id, { onDelete: "cascade" }),
    posicao: text("posicao"),
    oculto: boolean("oculto").notNull().default(false),
    nomeCustom: text("nome_custom"),
    corCustom: text("cor_custom"),
    emojiCustom: text("emoji_custom"),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.orixaId] })],
);

export const userSubcategoriaState = pgTable(
  "user_subcategoria_state",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subcategoriaId: uuid("subcategoria_id")
      .notNull()
      .references(() => subcategorias.id, { onDelete: "cascade" }),
    posicao: text("posicao"),
    oculto: boolean("oculto").notNull().default(false),
    nomeCustom: text("nome_custom"),
    atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.subcategoriaId] })],
);
