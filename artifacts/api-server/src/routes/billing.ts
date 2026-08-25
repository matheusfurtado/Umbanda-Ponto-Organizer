import { Router, type IRouter } from "express";
import { getEntitlements, planoPorCodigo } from "@workspace/db";
import { getPaymentProvider } from "@workspace/billing";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

// GET /api/me/entitlements — o que o plano do usuário libera (o frontend usa p/ espelhar a UI).
router.get("/me/entitlements", requireAuth, async (_req, res) => {
  res.json(await getEntitlements(res.locals.user.id as string));
});

// POST /api/billing/checkout — cria um pagamento Pix para o plano escolhido.
router.post("/billing/checkout", requireAuth, async (req, res) => {
  const codigo = (req.body as { plano?: string })?.plano;
  const provider = getPaymentProvider();
  if (!provider) {
    res.status(503).json({ error: "Pagamento ainda não configurado (defina MERCADOPAGO_ACCESS_TOKEN)." });
    return;
  }
  const plano = codigo ? await planoPorCodigo(codigo) : undefined;
  if (!plano || !plano.ativo || plano.precoCentavos <= 0) {
    res.status(400).json({ error: "Plano indisponível para checkout." });
    return;
  }
  const user = res.locals.user as { id: string; email: string };
  try {
    const checkout = await provider.criarCheckoutPix({
      valorCentavos: plano.precoCentavos,
      descricao: `Pontos de Umbanda — ${plano.nome}`,
      emailPagador: user.email,
      referenciaExterna: `${user.id}:${plano.codigo}`,
    });
    res.json(checkout);
  } catch (e) {
    res.status(502).json({ error: e instanceof Error ? e.message : "Falha no provedor de pagamento." });
  }
});

export default router;
