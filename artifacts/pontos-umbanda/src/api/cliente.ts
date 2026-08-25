/**
 * Cliente HTTP do acervo.
 *
 * Fala com `/api/v1/acervo` no MESMO origin — o Vite faz proxy em dev e a
 * hospedagem fará em produção. Same-origin não é preguiça: é o que deixa o
 * cookie httpOnly de sessão funcionar na fase 2 sem CORS nem `SameSite=None`.
 */

import type { AppData, Orixa, Ponto, Subcategoria } from "../types";

/** Erro de API com o status junto — quem chama precisa distinguir 422 de 503. */
export class ErroApi extends Error {
  constructor(
    readonly status: number,
    readonly detalhe: string,
  ) {
    super(`API ${status}: ${detalhe}`);
    this.name = "ErroApi";
  }
}

/** Rede caiu, DNS falhou, servidor fora do ar. Diferente de erro de API. */
export class ErroRede extends Error {
  constructor(causa: unknown) {
    super(causa instanceof Error ? causa.message : "falha de rede");
    this.name = "ErroRede";
  }
}

const BASE = "/api/v1";

// Na gira o celular costuma estar em rede ruim. Esperar 30s parado é pior que
// cair para o cache do aparelho, que tem o acervo inteiro.
const TIMEOUT_MS = 8000;

async function requisitar<T>(caminho: string, init?: RequestInit): Promise<T> {
  const abortador = new AbortController();
  const relogio = setTimeout(() => abortador.abort(), TIMEOUT_MS);

  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}${caminho}`, {
      ...init,
      signal: abortador.signal,
      headers: { "Content-Type": "application/json", ...init?.headers },
      // A sessão da fase 2 virá em cookie httpOnly; já mandamos credenciais.
      credentials: "same-origin",
    });
  } catch (causa) {
    throw new ErroRede(causa);
  } finally {
    clearTimeout(relogio);
  }

  if (!resposta.ok) {
    // O corpo de erro pode não ser JSON (proxy, gateway). Não deixe o parse
    // engolir o status, que é a informação que importa.
    let detalhe = resposta.statusText;
    try {
      const corpo = await resposta.json();
      detalhe = corpo?.detail ?? detalhe;
    } catch {
      /* corpo não-JSON: fica o statusText */
    }
    throw new ErroApi(resposta.status, String(detalhe));
  }

  return (await resposta.json()) as T;
}

/** O acervo inteiro, do jeito que o app já usa. */
export function baixarAcervo(): Promise<AppData> {
  return requisitar<AppData>("/acervo");
}

/**
 * Substitui o acervo no servidor.
 *
 * Manda só o que é do usuário. Os campos `video*` são do servidor — reenviá-los
 * seria o cliente opinando sobre dado que não é dele.
 */
export interface ResultadoEnvio {
  orixas: number;
  subcategorias: number;
  pontos: number;
  pontosCanonicos: number;
  pontosCriados: number;
  favoritos: number;
}

export function enviarAcervo(dados: AppData): Promise<ResultadoEnvio> {
  const corpo = {
    orixas: dados.orixas.map(
      ({ id, nome, cor, emoji, ordem, criadoEm }: Orixa) =>
        ({ id, nome, cor, emoji, ordem, criadoEm }),
    ),
    subcategorias: dados.subcategorias.map(
      ({ id, orixaId, nome, ordem, criadoEm }: Subcategoria) =>
        ({ id, orixaId, nome, ordem, criadoEm }),
    ),
    pontos: dados.pontos.map(
      ({ id, subcategoriaId, titulo, letra, ordem, favorito, criadoEm }: Ponto) =>
        ({ id, subcategoriaId, titulo, letra, ordem, favorito, criadoEm }),
    ),
  };
  return requisitar<ResultadoEnvio>("/acervo", { method: "PUT", body: JSON.stringify(corpo) });
}
