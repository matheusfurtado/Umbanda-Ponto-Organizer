import type { AppData } from "@/types";
import { API_BASE } from "./apiBase";

export interface ResumoImport {
  orixasCanonicos: number;
  orixasCriados: number;
  subsCanonicos: number;
  subsCriados: number;
  pontosCanonicos: number;
  pontosCriados: number;
  favoritos: number;
}

// Envia o AppData do localStorage para a conta (migração). NÃO apaga o localStorage.
export async function importarLocalDataNaConta(dados: AppData): Promise<ResumoImport> {
  const resp = await fetch(`${API_BASE}/api/account/import-local-data`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  if (!resp.ok) {
    const erro = (await resp.json().catch(() => ({}))) as { error?: string };
    throw new Error(erro.error ?? `Falha ao enviar seus dados (HTTP ${resp.status}).`);
  }
  const json = (await resp.json()) as { resumo: ResumoImport };
  return json.resumo;
}

// Remonta o AppData da conta (para este aparelho ler os pontos da conta).
export async function baixarDadosDaConta(): Promise<AppData> {
  const resp = await fetch(`${API_BASE}/api/account/data`, { credentials: "include" });
  if (!resp.ok) throw new Error(`Falha ao baixar da conta (HTTP ${resp.status}).`);
  return (await resp.json()) as AppData;
}

// Baixa todos os dados pessoais do usuário (portabilidade LGPD).
export async function exportarConta(): Promise<unknown> {
  const resp = await fetch(`${API_BASE}/api/account/export`, { credentials: "include" });
  if (!resp.ok) throw new Error(`Falha ao exportar (HTTP ${resp.status}).`);
  return resp.json();
}
