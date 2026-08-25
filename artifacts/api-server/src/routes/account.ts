import { Router, type IRouter } from "express";
import { z } from "zod";
import {
  importarAppData,
  exportarAppData,
  reconstruirAppData,
  getEntitlements,
  type AppDataImport,
} from "@workspace/db";
import { requireAuth } from "../middlewares/auth";

// Formato do AppData que o frontend já produz em exportarDados() (localStorage).
const appDataSchema = z.object({
  orixas: z
    .array(
      z.object({
        id: z.string(),
        nome: z.string(),
        cor: z.string(),
        emoji: z.string(),
        ordem: z.number(),
        criadoEm: z.number().optional(),
      }),
    )
    .default([]),
  subcategorias: z
    .array(
      z.object({
        id: z.string(),
        orixaId: z.string(),
        nome: z.string(),
        ordem: z.number(),
        criadoEm: z.number().optional(),
      }),
    )
    .default([]),
  pontos: z
    .array(
      z.object({
        id: z.string(),
        subcategoriaId: z.string(),
        titulo: z.string(),
        letra: z.string(),
        favorito: z.boolean().default(false),
        ordem: z.number(),
        criadoEm: z.number().optional(),
      }),
    )
    .default([]),
  ultimoOrixaId: z.string().optional(),
});

const router: IRouter = Router();

// POST /api/account/import-local-data — migra o localStorage do usuário para a conta.
router.post("/account/import-local-data", requireAuth, async (req, res) => {
  const parsed = appDataSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "AppData inválido", detalhes: parsed.error.issues });
    return;
  }
  const userId = res.locals.user.id as string;
  const resumo = await importarAppData(userId, parsed.data as AppDataImport);
  res.json({ ok: true, resumo });
});

// GET /api/account/data — remonta o AppData da conta (o app lê disto quando logado).
router.get("/account/data", requireAuth, async (_req, res) => {
  const userId = res.locals.user.id as string;
  const ent = await getEntitlements(userId);
  // Gate do acervo: com acessoAcervo (plano pago) vem a biblioteca canônica completa.
  res.json(await reconstruirAppData(userId, { incluirAcervoCompleto: !!ent.acessoAcervo }));
});

// GET /api/account/export — portabilidade LGPD (todos os dados pessoais do usuário).
router.get("/account/export", requireAuth, async (_req, res) => {
  const userId = res.locals.user.id as string;
  res.json(await exportarAppData(userId));
});

export default router;
