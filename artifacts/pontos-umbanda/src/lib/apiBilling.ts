import { API_BASE } from "./apiBase";

export interface Entitlements {
  plano: string;
  acessoAcervo?: boolean;
  downloadOffline?: boolean;
  syncNuvem?: boolean;
  colaboracaoTerreiro?: boolean;
}

export interface CheckoutResult {
  provider: string;
  pagamentoId: string;
  status: string;
  pixCopiaCola?: string;
  pixQrCodeBase64?: string;
}

export async function buscarEntitlements(): Promise<Entitlements> {
  const resp = await fetch(`${API_BASE}/api/me/entitlements`, { credentials: "include" });
  if (!resp.ok) throw new Error(`Falha ao buscar seu plano (HTTP ${resp.status}).`);
  return (await resp.json()) as Entitlements;
}

export async function criarCheckout(plano: string): Promise<CheckoutResult> {
  const resp = await fetch(`${API_BASE}/api/billing/checkout`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plano }),
  });
  if (!resp.ok) {
    const e = (await resp.json().catch(() => ({}))) as { error?: string };
    throw new Error(e.error ?? `Falha ao iniciar o pagamento (HTTP ${resp.status}).`);
  }
  return (await resp.json()) as CheckoutResult;
}
