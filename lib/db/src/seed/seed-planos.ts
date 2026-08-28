// Semeia os planos. Idempotente (upsert por código). Rode: pnpm --filter @workspace/db run seed:planos
import { eq } from "drizzle-orm";
import { db, pool } from "../index";
import { planos } from "../schema";
import type { LimitesPlano } from "../schema";

type PlanoSeed = {
  codigo: string;
  nome: string;
  precoCentavos: number;
  intervalo: "mensal" | "anual" | "unico";
  limites: LimitesPlano;
};

// Modelo do dono: "Fundador" vitalício (pagamento único) libera o acervo canônico.
// Grátis = só o conteúdo do próprio usuário. Pro/Terreiro = alternativas recorrentes.
const PLANOS: PlanoSeed[] = [
  { codigo: "gratis", nome: "Grátis", precoCentavos: 0, intervalo: "unico", limites: {} },
  {
    codigo: "fundador",
    nome: "Fundador — acesso vitalício",
    precoCentavos: 14900,
    intervalo: "unico",
    limites: { acessoAcervo: true, downloadOffline: true, syncNuvem: true },
  },
  {
    codigo: "pro",
    nome: "Pro",
    precoCentavos: 990,
    intervalo: "mensal",
    limites: { acessoAcervo: true, syncNuvem: true },
  },
  {
    codigo: "terreiro",
    nome: "Terreiro",
    precoCentavos: 3990,
    intervalo: "mensal",
    limites: { acessoAcervo: true, syncNuvem: true, colaboracaoTerreiro: true, maxMembros: 20 },
  },
];

async function main() {
  for (const p of PLANOS) {
    const existente = await db.query.planos.findFirst({ where: eq(planos.codigo, p.codigo) });
    if (existente) {
      await db
        .update(planos)
        .set({
          nome: p.nome,
          precoCentavos: p.precoCentavos,
          intervalo: p.intervalo,
          limites: p.limites,
          atualizadoEm: new Date(),
        })
        .where(eq(planos.id, existente.id));
    } else {
      await db.insert(planos).values(p);
    }
  }
  const todos = await db.select().from(planos);
  console.log(`✓ Planos semeados: ${todos.map((x) => x.codigo).join(", ")}`);
  await pool.end();
}

main().catch(async (e) => {
  console.error("✗ Seed de planos falhou:", e);
  await pool.end();
  process.exit(1);
});
