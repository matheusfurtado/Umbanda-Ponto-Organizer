import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "@workspace/auth";

export type SessaoAtual = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

// Popula res.locals.user / res.locals.session a partir do cookie de sessão do Better-Auth.
// Retorna 401 se não houver sessão válida.
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const sessao = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!sessao) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  res.locals.user = sessao.user;
  res.locals.session = sessao.session;
  next();
}
