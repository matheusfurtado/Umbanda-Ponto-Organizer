import { Router, type IRouter } from "express";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// GET /api/me — retorna o usuário autenticado (rota protegida de sanidade).
router.get("/me", requireAuth, (_req, res) => {
  res.json({ user: res.locals.user });
});

export default router;
