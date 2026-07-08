// Seed da biblioteca canônica a partir de pontos-completo.json (12 orixás, 42 subs, 384 pontos).
// Idempotente: remove o canônico anterior e reinsere. Roda dentro do dev container:
//   pnpm --filter @workspace/db run seed
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db, pool } from "../index";
import { orixas, subcategorias, pontos } from "../schema";
import { hashLetra, posFromOrdem } from "../lib/util";

type OrixaSrc = { id: string; nome: string; cor: string; emoji: string; ordem: number; criadoEm: number };
type SubSrc = { id: string; orixaId: string; nome: string; ordem: number; criadoEm: number };
type PontoSrc = {
  id: string;
  subcategoriaId: string;
  titulo: string;
  letra: string;
  ordem: number;
  favorito: boolean;
  criadoEm: number;
};

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../../.."); // seed -> src -> db -> lib -> raiz
const jsonPath = path.join(repoRoot, "pontos-completo.json");

async function main() {
  const data = JSON.parse(await readFile(jsonPath, "utf8")) as {
    orixas: OrixaSrc[];
    subcategorias: SubSrc[];
    pontos: PontoSrc[];
  };

  const res = await db.transaction(async (tx) => {
    // idempotência: remove o canônico anterior (cascata p/ subs e pontos canônicos)
    await tx.delete(orixas).where(eq(orixas.escopo, "canonical"));

    const idOrixa = new Map<string, string>();
    for (const o of data.orixas) {
      const [row] = await tx
        .insert(orixas)
        .values({
          escopo: "canonical",
          slug: o.id,
          legacyId: o.id,
          nome: o.nome,
          cor: o.cor,
          emoji: o.emoji,
          posicaoPadrao: posFromOrdem(o.ordem),
        })
        .returning({ id: orixas.id });
      idOrixa.set(o.id, row.id);
    }

    const idSub = new Map<string, string>();
    for (const s of data.subcategorias) {
      // ids timestamp-random viram slug legível; ids semânticos são preservados
      const slug = /^\d/.test(s.id) ? `${s.orixaId}-${slugify(s.nome)}` : s.id;
      const [row] = await tx
        .insert(subcategorias)
        .values({
          escopo: "canonical",
          orixaId: idOrixa.get(s.orixaId)!,
          slug,
          legacyId: s.id,
          nome: s.nome,
          posicaoPadrao: posFromOrdem(s.ordem),
        })
        .returning({ id: subcategorias.id });
      idSub.set(s.id, row.id);
    }

    let nPontos = 0;
    for (const p of data.pontos) {
      const subId = idSub.get(p.subcategoriaId);
      if (!subId) continue; // órfão (verificado: 0 no dataset)
      await tx.insert(pontos).values({
        escopo: "canonical",
        visibilidade: "publico",
        subcategoriaId: subId,
        slug: p.id,
        legacyId: p.id,
        titulo: p.titulo,
        letra: p.letra,
        conteudoHash: hashLetra(p.letra),
      });
      nPontos++;
    }

    return { orixas: idOrixa.size, subcategorias: idSub.size, pontos: nPontos };
  });

  console.log(`✓ Seed canônico: ${res.orixas} orixás, ${res.subcategorias} subcategorias, ${res.pontos} pontos.`);
  await pool.end();
}

main().catch(async (err) => {
  console.error("✗ Seed falhou:", err);
  await pool.end();
  process.exit(1);
});
