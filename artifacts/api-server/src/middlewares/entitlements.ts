import type { Request, Response, NextFunction } from "express";
import { getEntitlements } from "@workspace/db";

type Feature = "acessoAcervo" | "downloadOffline" | "syncNuvem" | "colaboracaoTerreiro";

// Gate AUTORITATIVO de recurso pago (HTTP 402). Usar DEPOIS de requireAuth.
// A fonte da verdade é o nosso banco (alimentado só pelo webhook); o frontend só espelha.
export function requireFeature(feature: Feature) {
  return async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    const ent = await getEntitlements(res.locals.user.id as string);
    if (!ent[feature]) {
      res.status(402).json({ error: "Recurso do plano pago.", feature, planoAtual: ent.plano });
      return;
    }
    next();
  };
}
