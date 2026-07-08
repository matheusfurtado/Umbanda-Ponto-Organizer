import type { Request, Response } from "express";
import {
  registrarEventoFaturamento,
  marcarEventoProcessado,
  ativarAssinaturaPorPlano,
  revogarAssinaturaPorPlano,
  planoPorCodigo,
} from "@workspace/db";
import { getPaymentProvider } from "@workspace/billing";

// Status do Mercado Pago que REVOGAM o acesso (dinheiro devolvido/contestado).
const STATUS_REVOGA = new Set(["refunded", "charged_back", "cancelled", "in_mediation"]);

function normalizarHeaders(h: Request["headers"]): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(h)) out[k] = Array.isArray(v) ? v[0] : v;
  return out;
}

// POST /api/webhooks/mercadopago — montado com express.raw ANTES do express.json (ver app.ts),
// porque a verificação de assinatura precisa do corpo CRU. Libera/revoga o plano só aqui.
export async function webhookMercadoPago(req: Request, res: Response): Promise<void> {
  const provider = getPaymentProvider();
  if (!provider) {
    res.status(503).end();
    return;
  }
  const raw = Buffer.isBuffer(req.body) ? req.body : Buffer.from("");
  let evento;
  try {
    evento = await provider.processarWebhook(normalizarHeaders(req.headers), raw);
  } catch {
    evento = null;
  }
  if (!evento) {
    res.status(200).end(); // ack mesmo p/ evento inválido/irrelevante (evita reentrega infinita)
    return;
  }

  // Idempotência POR PROCESSAMENTO: registra o evento e só age se ainda não foi processado.
  const { id: eventoId, jaProcessado } = await registrarEventoFaturamento(
    provider.nome,
    evento.providerEventId,
    evento.tipo,
    evento,
  );
  if (jaProcessado) {
    res.status(200).json({ ok: true, duplicado: true });
    return;
  }

  try {
    const [userId, codigoPlano] = (evento.referenciaExterna ?? "").split(":");
    if (userId && codigoPlano) {
      if (evento.status === "approved") {
        // Só libera se o valor pago bate com (ou supera) o preço do plano.
        const plano = await planoPorCodigo(codigoPlano);
        if (plano && (evento.valorCentavos == null || evento.valorCentavos >= plano.precoCentavos)) {
          await ativarAssinaturaPorPlano(userId, codigoPlano, {
            provider: provider.nome,
            providerSubId: evento.pagamentoId,
          });
        }
      } else if (STATUS_REVOGA.has(evento.status)) {
        await revogarAssinaturaPorPlano(userId, codigoPlano);
      }
    }
    // Marca processado APÓS o efeito colateral ter sucesso — se falhar, a reentrega reprocessa.
    await marcarEventoProcessado(eventoId);
  } catch {
    res.status(500).json({ error: "Erro ao processar o evento." });
    return;
  }
  res.status(200).json({ ok: true });
}
