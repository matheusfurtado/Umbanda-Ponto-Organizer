import { sql } from "drizzle-orm";
import { pgEnum, timestamp, uuid, check, type AnyPgColumn } from "drizzle-orm/pg-core";

// Escopo de todo conteúdo: biblioteca canônica (curada por nós), do usuário, ou do terreiro.
export const escopoConteudo = pgEnum("escopo_conteudo", ["canonical", "user", "org"]);
export const visibilidade = pgEnum("visibilidade", ["publico", "nao_listado", "privado"]);

// PK uuid: default gen_random_uuid() no servidor (seed canônico), mas o cliente PODE
// fornecer um crypto.randomUUID() no insert (necessário p/ criar offline sem round-trip).
// Ver docs/blueprint-produto.md (decisão de IDs).
export const pk = () => uuid("id").primaryKey().default(sql`gen_random_uuid()`);

// Fábrica: retorna builders NOVOS a cada tabela — não reutilizar instâncias entre pgTable().
export const timestamps = () => ({
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  removidoEm: timestamp("removido_em", { withTimezone: true }), // soft-delete
});

// CHECK reutilizável: escopo coerente com as colunas de dono.
// canonical => sem dono; user => donoUserId; org => orgId.
export const checkEscopo = (
  t: { escopo: AnyPgColumn; donoUserId: AnyPgColumn; orgId: AnyPgColumn },
  nome: string,
) =>
  check(
    nome,
    sql`(${t.escopo} = 'canonical' AND ${t.donoUserId} IS NULL AND ${t.orgId} IS NULL)
 OR (${t.escopo} = 'user' AND ${t.donoUserId} IS NOT NULL AND ${t.orgId} IS NULL)
 OR (${t.escopo} = 'org' AND ${t.orgId} IS NOT NULL AND ${t.donoUserId} IS NULL)`,
  );
