/**
 * Conta: cadastro, login, logout e sessão.
 *
 * Fala com a API Python em `/api/v1/auth/*`, no mesmo origin. A sessão é um
 * cookie **httpOnly** — o JavaScript não lê nem escreve, e por isso não há
 * token nenhum guardado aqui. É o que impede um XSS de virar sequestro de conta.
 */

import { ehErroDeApi, ErroApi, ErroRede } from "./cliente";

export interface Usuario {
  id: string;
  email: string;
  email_verificado: boolean;
  /** Modera o que a comunidade envia. Só decide se o LINK aparece — a
   *  proteção de verdade está na rota, que responde 404 a quem não for. */
  admin?: boolean;
  /** Como a pessoa aparece para OUTRAS. Nulo até ela escolher — e sem ele o
   *  servidor recusa publicar gira, porque o rótulo alternativo seria o
   *  e-mail, e e-mail ao lado de pontos de Umbanda publica a religião dela. */
  apelido?: string | null;
  consentiu_dado_religioso_em: string | null;
  consentiu_comunicacao_em: string | null;
  criado_em: string;
}

export interface SessaoAtiva {
  agente: string | null;
  criado_em: string;
  expira_em: string;
  atual: boolean;
}

const BASE = "/api/v1/auth";

async function chamar<T>(caminho: string, init?: RequestInit): Promise<T | null> {
  let resposta: Response;
  try {
    resposta = await fetch(`${BASE}${caminho}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      // Sem isto o cookie de sessão não viaja.
      credentials: "same-origin",
    });
  } catch (causa) {
    throw new ErroRede(causa);
  }

  // 204 (logout) não tem corpo.
  if (resposta.status === 204) return null;

  if (!resposta.ok) {
    let detalhe = resposta.statusText;
    try {
      const corpo = await resposta.json();
      // 422 do FastAPI vem como lista de erros de campo; 4xx nosso vem string.
      detalhe = Array.isArray(corpo?.detail)
        ? corpo.detail.map((e: { msg: string }) => e.msg).join("; ")
        : (corpo?.detail ?? detalhe);
    } catch {
      /* corpo não-JSON: fica o statusText */
    }
    throw new ErroApi(resposta.status, String(detalhe));
  }

  return (await resposta.json()) as T;
}

export interface DadosCadastro {
  email: string;
  senha: string;
  /** LGPD: obrigatório, específico e destacado. Sem ele não há conta. */
  consinto_dado_religioso: boolean;
  /** Opcional de verdade — recusar não bloqueia nada. */
  consinto_comunicacao?: boolean;
}

export function cadastrar(dados: DadosCadastro): Promise<Usuario | null> {
  return chamar<Usuario>("/cadastro", { method: "POST", body: JSON.stringify(dados) });
}

export function entrar(email: string, senha: string): Promise<Usuario | null> {
  return chamar<Usuario>("/login", { method: "POST", body: JSON.stringify({ email, senha }) });
}

export function sair(): Promise<null> {
  return chamar<null>("/logout", { method: "POST" }) as Promise<null>;
}

/** Quem está logado, ou `null`. 401 aqui é resposta esperada, não erro. */
export async function quemSou(): Promise<Usuario | null> {
  try {
    return await chamar<Usuario>("/eu");
  } catch (erro) {
    if (ehErroDeApi(erro) && erro.status === 401) return null;
    throw erro;
  }
}

export function minhasSessoes(): Promise<SessaoAtiva[] | null> {
  return chamar<SessaoAtiva[]>("/sessoes");
}

/** Perdeu o celular: encerra tudo menos este aparelho. */
export function encerrarOutrasSessoes(): Promise<null> {
  return chamar<null>("/sessoes/encerrar-outras", { method: "POST" }) as Promise<null>;
}


// ------------------------------------------------------ recuperar senha

/**
 * Pede o link de redefinição.
 *
 * **Sempre resolve**, exista o e-mail ou não — é assim no servidor, e a tela
 * precisa refletir isso. Mostrar "esse e-mail não existe" transformaria a tela
 * num verificador de quem tem conta num app de Umbanda.
 */
export function pedirRecuperacao(email: string): Promise<null> {
  return chamar<null>("/recuperar", {
    method: "POST",
    body: JSON.stringify({ email }),
  }) as Promise<null>;
}

/** Troca a senha pelo link. Derruba todas as sessões e abre uma nova. */
export function redefinirSenha(token: string, senha: string): Promise<Usuario | null> {
  return chamar<Usuario>("/redefinir", {
    method: "POST",
    body: JSON.stringify({ token, senha }),
  });
}

export function pedirVerificacao(): Promise<null> {
  return chamar<null>("/verificar/enviar", { method: "POST" }) as Promise<null>;
}

export function confirmarEmail(token: string): Promise<Usuario | null> {
  return chamar<Usuario>("/verificar", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}


/**
 * Escolher como aparecer para outras pessoas.
 *
 * Existe por causa das giras públicas: sem apelido, publicar exporia o e-mail
 * junto de uma lista de pontos de Umbanda — identidade mais convicção
 * religiosa. Continua opcional para quem nunca publica nada.
 */
export async function escolherApelido(apelido: string): Promise<Usuario> {
  const r = await fetch("/api/v1/auth/apelido", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ apelido }),
  });
  if (r.status === 409) throw new Error("Este apelido já está em uso.");
  if (!r.ok) throw new Error("Não consegui salvar o apelido.");
  return (await r.json()) as Usuario;
}
