/**
 * Plano e checkout, contra a API Python.
 *
 * O vocabulário aqui é o do servidor, não um paralelo inventado no front: o
 * nome do direito é o mesmo dos dois lados, então não existe tradução onde um
 * erro de digitação viraria "recurso liberado".
 *
 * Nada disto autoriza coisa alguma. É espelho de UX — a autorização acontece em
 * cada rota, no servidor (HTTP 402). Ver `components/Gate.tsx`.
 */

export interface Entitlements {
  plano: string;
  /** Quando o acesso acaba. `null` = não acaba, ou não começou. */
  expiraEm?: string | null;
  /** Para avisar ANTES de cortar — descobrir no meio da gira é a pior hora. */
  diasRestantes?: number | null;
  /** Hierarquia Orixá → Subcategoria, na ordem litúrgica. */
  acervoOrganizado?: boolean;
  /** Link do vídeo casado com o ponto. */
  linksDeVideo?: boolean;
  repertorios?: boolean;
  sync?: boolean;
  offline?: boolean;
}

export interface Plano {
  id: string;
  nome: string;
  /** Em centavos. A formatação em reais é da tela. */
  preco_centavos: number;
  periodicidade: "mensal" | "anual" | "unico";
}

export interface CheckoutResult {
  url: string;
  referencia_externa: string;
}

async function pegar<T>(caminho: string, init?: RequestInit): Promise<T> {
  const resposta = await fetch(caminho, {
    ...init,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!resposta.ok) {
    const corpo = (await resposta.json().catch(() => ({}))) as { detail?: string };
    throw new Error(corpo.detail ?? `Falha na requisição (HTTP ${resposta.status}).`);
  }
  return (await resposta.json()) as T;
}

/** Funciona logado ou não: sem conta, devolve os direitos do plano grátis. */
export function buscarEntitlements(): Promise<Entitlements> {
  return pegar<Entitlements>("/api/v1/meus-direitos");
}

export function listarPlanos(): Promise<Plano[]> {
  return pegar<Plano[]>("/api/v1/planos");
}

/**
 * Abre o checkout. **Não libera nada** — a assinatura nasce pendente e só vira
 * ativa quando o provedor confirmar por webhook. Por isso a tela precisa
 * reconsultar os direitos depois, em vez de assumir que deu certo.
 */
export function criarCheckout(planoId: string): Promise<CheckoutResult> {
  return pegar<CheckoutResult>("/api/v1/assinatura/checkout", {
    method: "POST",
    body: JSON.stringify({ plano_id: planoId }),
  });
}

/** Formata centavos como moeda brasileira. */
export interface Assinatura {
  status: string;
  expira_em: string | null;
  cancelada_em: string | null;
}

/** A assinatura atual, ou `null` para quem nunca assinou. */
export function minhaAssinatura(): Promise<Assinatura | null> {
  return pegar<Assinatura | null>("/api/v1/assinatura");
}

/**
 * Para de cobrar.
 *
 * **O acesso continua até o fim do período já pago.** Cancelar não é estornar:
 * o mês pago foi pago, e tirar o acesso na hora seria ficar com o dinheiro e
 * com o serviço.
 */
export function cancelarAssinatura(): Promise<Assinatura | null> {
  return pegar<Assinatura | null>("/api/v1/assinatura/cancelar", { method: "POST" });
}

export function emReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
