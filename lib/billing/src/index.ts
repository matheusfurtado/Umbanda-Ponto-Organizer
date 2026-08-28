import { createHmac } from "node:crypto";

// Interface de pagamento — o resto do sistema NÃO conhece o Mercado Pago (sem lock-in).
export interface CheckoutParams {
  valorCentavos: number;
  descricao: string;
  emailPagador: string;
  referenciaExterna: string; // "userId:codigoPlano" — reconciliado no webhook
}
export interface CheckoutResult {
  provider: string;
  pagamentoId: string;
  status: string;
  pixCopiaCola?: string;
  pixQrCodeBase64?: string;
}
export interface EventoPagamento {
  providerEventId: string;
  tipo: string;
  pagamentoId: string;
  status: string; // "approved" | "refunded" | "charged_back" | "cancelled" | ...
  referenciaExterna?: string;
  valorCentavos?: number; // valor REAL pago (do MP), p/ validar contra o preço do plano
}
export interface PaymentProvider {
  readonly nome: string;
  criarCheckoutPix(p: CheckoutParams): Promise<CheckoutResult>;
  /** Valida e normaliza um webhook. Retorna null se inválido/irrelevante. */
  processarWebhook(headers: Record<string, string | undefined>, rawBody: Buffer): Promise<EventoPagamento | null>;
}

const MP_API = "https://api.mercadopago.com";

// Verificação da assinatura x-signature do Mercado Pago (HMAC-SHA256 do manifesto).
// NOTA: validar contra um webhook REAL antes de produção.
function verificarAssinaturaMP(
  headers: Record<string, string | undefined>,
  secret: string,
  dataId: string,
): boolean {
  const sig = headers["x-signature"];
  const reqId = headers["x-request-id"];
  if (!sig) return false;
  const parts: Record<string, string> = {};
  for (const kv of sig.split(",")) {
    const [k, v] = kv.split("=");
    if (k && v) parts[k.trim()] = v.trim();
  }
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;
  const manifest = `id:${dataId};request-id:${reqId ?? ""};ts:${ts};`;
  const esperado = createHmac("sha256", secret).update(manifest).digest("hex");
  return esperado === v1;
}

export class MercadoPagoProvider implements PaymentProvider {
  readonly nome = "mercadopago";
  constructor(
    private readonly accessToken: string,
    private readonly webhookSecret?: string,
  ) {}

  async criarCheckoutPix(p: CheckoutParams): Promise<CheckoutResult> {
    const resp = await fetch(`${MP_API}/v1/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": p.referenciaExterna,
      },
      body: JSON.stringify({
        transaction_amount: p.valorCentavos / 100,
        description: p.descricao,
        payment_method_id: "pix",
        external_reference: p.referenciaExterna,
        payer: { email: p.emailPagador },
      }),
    });
    if (!resp.ok) throw new Error(`Mercado Pago: falha ao criar Pix (${resp.status}): ${await resp.text()}`);
    const j = (await resp.json()) as {
      id: number | string;
      status: string;
      point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string } };
    };
    const tx = j.point_of_interaction?.transaction_data ?? {};
    return {
      provider: this.nome,
      pagamentoId: String(j.id),
      status: j.status,
      pixCopiaCola: tx.qr_code,
      pixQrCodeBase64: tx.qr_code_base64,
    };
  }

  async processarWebhook(
    headers: Record<string, string | undefined>,
    rawBody: Buffer,
  ): Promise<EventoPagamento | null> {
    let body: { type?: string; action?: string; data?: { id?: string | number } };
    try {
      body = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return null;
    }
    const tipo = body.type ?? body.action ?? "unknown";
    const pagamentoId = body.data?.id != null ? String(body.data.id) : "";
    if (!pagamentoId) return null;

    // Fail-CLOSED: com secret, valida a assinatura; SEM secret em produção, rejeita
    // (não deixa o único gate do endpoint público sumir por erro de config/rotação).
    if (this.webhookSecret) {
      if (!verificarAssinaturaMP(headers, this.webhookSecret, pagamentoId)) return null;
    } else if (process.env.NODE_ENV === "production") {
      return null;
    }

    // A notificação não traz o status — buscamos o pagamento para saber se foi aprovado.
    const resp = await fetch(`${MP_API}/v1/payments/${pagamentoId}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    if (!resp.ok) return null;
    const pay = (await resp.json()) as {
      status: string;
      external_reference?: string;
      transaction_amount?: number;
    };
    return {
      // Identidade ESTÁVEL do pagamento (sem o `tipo`, que vem do corpo e é manipulável),
      // garantindo idempotência real: o mesmo pagamento nunca é processado 2×.
      providerEventId: `${pagamentoId}:${pay.status}`,
      tipo,
      pagamentoId,
      status: pay.status,
      referenciaExterna: pay.external_reference,
      valorCentavos: pay.transaction_amount != null ? Math.round(pay.transaction_amount * 100) : undefined,
    };
  }
}

// Fábrica: Mercado Pago se houver token; senão null (checkout responde 503 em dev).
export function getPaymentProvider(): PaymentProvider | null {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return null;
  return new MercadoPagoProvider(token, process.env.MERCADOPAGO_WEBHOOK_SECRET);
}
