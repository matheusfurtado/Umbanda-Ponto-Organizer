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
  /** Endereço da foto do perfil, com a versão. `null` = marca gerada. */
  foto?: string | null;
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
  /**
   * Como a pessoa quer aparecer. Obrigatório no cadastro, e único no servidor.
   *
   * É o que credita quem manda um ponto para o acervo de todos. Pedido só numa
   * tela posterior, quase ninguém teria um — e o crédito ficaria vazio
   * justamente para quem mais contribui.
   */
  apelido: string;
  /** LGPD: obrigatório, específico e destacado. Sem ele não há conta. */
  consinto_dado_religioso: boolean;
  /** Opcional de verdade — recusar não bloqueia nada. */
  consinto_comunicacao?: boolean;
}

/** O que o cadastro devolve: uma frase, sempre a mesma. */
export interface Recado {
  mensagem: string;
}

/**
 * Cria a conta — e **não** loga.
 *
 * Devolvia o usuário e a sessão vinha junto. Não podia continuar assim: "você
 * está dentro" já é a informação de que o endereço estava livre, e com ela o
 * cadastro dizia a qualquer anônimo quem tem conta num app de Umbanda.
 *
 * Hoje o servidor responde 202 e a mesma frase nos três casos (e-mail livre,
 * conta pendente, conta ativa), e manda um link. Quem entra é quem abre o
 * link, em `TelaVerificar`.
 */
export function cadastrar(dados: DadosCadastro): Promise<Recado | null> {
  return chamar<Recado>("/cadastro", { method: "POST", body: JSON.stringify(dados) });
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

/**
 * Liga e desliga o consentimento OPCIONAL, a qualquer hora.
 *
 * Ele era coletado no cadastro e não tinha volta — nem rota, nem tela. A LGPD
 * (art. 8º, §5º) diz que consentimento se revoga a qualquer momento, por
 * procedimento gratuito e facilitado; "opcional" que não se desmarca é um
 * checkbox de fachada.
 *
 * O outro consentimento, o de dado religioso, **não tem função aqui** de
 * propósito: sem ele não há base para a conta existir, então revogá-lo é
 * apagar a conta. Ver `ApagarConta`.
 */
export function mudarConsentimentoDeComunicacao(consinto: boolean): Promise<Usuario | null> {
  return chamar<Usuario>("/consentimento/comunicacao", {
    method: "PATCH",
    body: JSON.stringify({ consinto }),
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

/**
 * Apaga a conta e tudo que é dela. Sem volta.
 *
 * Pede a senha mesmo já estando logado: a sessão prova que o navegador é o de
 * sempre, a senha prova que é a pessoa. Ver `routers/auth.py`.
 */
export async function apagarConta(senha: string): Promise<void> {
  const r = await fetch("/api/v1/auth/eu", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify({ senha }),
  });
  if (!r.ok) {
    let detalhe = r.statusText;
    try {
      detalhe = (await r.json())?.detail ?? detalhe;
    } catch {
      /* corpo não-JSON: fica o statusText */
    }
    throw new Error(String(detalhe));
  }
}

