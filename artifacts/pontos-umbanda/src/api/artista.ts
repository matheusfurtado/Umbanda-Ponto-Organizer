/**
 * Artistas: a página de quem canta, e a biblioteca de quem segue.
 *
 * ## O link vem para todo mundo, e isso é decisão, não descuido
 *
 * O `GET /acervo` não manda `videoUrl` para quem não paga (ADR 0002). Estas
 * rotas mandam — decisão do dono em 28/08, registrada no ADR 0007. Quem mexer
 * aqui achando que é furo do portão vai desfazer o produto que ele pediu.
 */

import { ErroApi, ErroRede } from "@/api/cliente";

const BASE = "/api/v1";

/**
 * Lança o MESMO vocabulário de erro do `api/cliente`.
 *
 * Este `chamar` jogava um `Error` cru com `.status` pendurado, e não embrulhava
 * falha de rede. As telas que importam `ehErroDeApi`/`ehErroDeRede` de
 * `@/api/cliente` — que testam `instanceof` ou `name` — recebiam `false` nos
 * dois casos, e o ternário inteiro delas virava código morto: qualquer falha
 * caía no texto genérico.
 *
 * Doeu em `PedirRemocao`, que é a tela de "tire minha página do ar": quem
 * batia no limite por IP levava "Não consegui enviar agora." em vez de saber
 * que era só esperar, num fluxo em que a pessoa está pedindo para sair de um
 * app que a expõe. Duas famílias de erro para o mesmo backend é como isso
 * acontece.
 */
async function chamar<T>(caminho: string, init?: RequestInit): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`${BASE}${caminho}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      credentials: "same-origin",
    });
  } catch (causa) {
    throw new ErroRede(causa);
  }
  if (!r.ok) {
    let detalhe = r.statusText;
    try {
      detalhe = (await r.json())?.detail ?? detalhe;
    } catch {
      /* corpo não-JSON: fica o statusText */
    }
    throw new ErroApi(r.status, String(detalhe));
  }
  return r.status === 204 ? (undefined as T) : ((await r.json()) as T);
}

export interface ArtistaResumo {
  id: string;
  nome: string;
  pontos: number;
  seguidores: number;
  curado: boolean;
  /** Nulo quando não há foto — a tela cai na inicial do nome. */
  foto: string | null;
  /** `null` = visitante não logado. Diferente de "não segue". */
  seguindo: boolean | null;
}

export interface PontoDoArtista {
  id: string;
  titulo: string;
  orixa: string | null;
  /**
   * A identidade do grupo a que o ponto pertence — é o que permite separar a
   * lista por entidade, como o Spotify separa por álbum.
   *
   * Agrupa-se pelo `orixaId`, nunca pelo nome: duas entradas de topo podem
   * repetir nome, e agrupar por texto juntaria o que é diferente.
   */
  orixaId: string | null;
  orixaEmoji: string | null;
  orixaCor: string | null;
  /** `orixa`, `momento` ou `linha`. */
  orixaTipo: string | null;
  /**
   * A letra vem junto, e antes não vinha.
   *
   * Buscar sob demanda não funcionaria: `GET /pontos/{id}` casa por DONO, e
   * esta lista traz o ponto CANÔNICO — quem organizou o acervo levaria 404 ao
   * abrir a letra. E o peso é pequeno: medido, as letras do maior artista somam
   * 8,5 KB contra os 10,3 KB que a resposta já tinha.
   */
  letra: string | null;
  /** Quantas vezes levou alguém ao YouTube, somando todos os dias. */
  cliques: number;
  videoUrl: string | null;
  /** `encontrado` ou `revisar`. Anda SEMPRE junto com a URL. */
  videoStatus: string | null;
}

/** Um bloco da página do artista: a entidade, e os pontos dela. */
export interface GrupoDoArtista {
  id: string;
  nome: string;
  emoji: string | null;
  cor: string | null;
  tipo: string | null;
  pontos: PontoDoArtista[];
}

/**
 * Agrupa os pontos por entidade, preservando a ordem em que apareceram.
 *
 * **Por chave, e não por corrida contígua.** O servidor já manda ordenado por
 * orixá, então varrer somando enquanto o vizinho for igual funcionaria hoje —
 * e quebraria em silêncio no dia em que a ordenação mudasse, espalhando o mesmo
 * orixá em três blocos. O `Map` é indiferente à ordem e custa o mesmo.
 *
 * Ponto sem entidade cai num grupo próprio no fim, em vez de sumir: 47 pontos
 * do acervo já abrem com a letra em branco, e engolir o que não se encaixa é
 * como esse tipo de buraco fica invisível.
 */
export function agruparPorEntidade(pontos: PontoDoArtista[]): GrupoDoArtista[] {
  const grupos = new Map<string, GrupoDoArtista>();
  for (const p of pontos) {
    const id = p.orixaId ?? "";
    let grupo = grupos.get(id);
    if (!grupo) {
      grupo = {
        id,
        nome: p.orixa ?? "Sem orixá",
        emoji: p.orixaEmoji,
        cor: p.orixaCor,
        tipo: p.orixaTipo,
        pontos: [],
      };
      grupos.set(id, grupo);
    }
    grupo.pontos.push(p);
  }
  const lista = [...grupos.values()];
  // O grupo dos órfãos por último, sempre.
  return [...lista.filter((g) => g.id), ...lista.filter((g) => !g.id)];
}

export interface Artista extends ArtistaResumo {
  canalUrl: string | null;
  bio: string | null;
  /** Endereço da foto, com a versão embutida. `null` quando não há. */
  foto: string | null;
  /**
   * Esta pessoa pode editar este perfil? Vem do SERVIDOR — decidir isso no
   * cliente seria botão que aparece e não funciona, e o servidor é quem sabe
   * quem é dono e quem é admin.
   */
  possoEditar: boolean;
  /** `null` para quem não está logado: a tela convida a entrar em vez de
   *  mostrar um botão que não vai funcionar. */
  seguindo: boolean | null;
  pontosDoArtista: PontoDoArtista[];
}

export interface EdicaoDoArtista {
  /** Ausente = não mexi. String vazia = apaga. */
  bio?: string;
  canalUrl?: string;
}

export const editarArtista = (id: string, corpo: EdicaoDoArtista) =>
  chamar<Artista>(`/artistas/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(corpo),
  });

/**
 * A foto vai como `multipart`, então NÃO leva `Content-Type` — o navegador
 * precisa pôr o dele, com o `boundary` dentro. Escrever o cabeçalho à mão aqui
 * quebra o upload de um jeito que só aparece no servidor.
 */
export async function trocarFotoDoArtista(id: string, arquivo: File) {
  const corpo = new FormData();
  corpo.append("arquivo", arquivo);
  let r: Response;
  try {
    r = await fetch(`/api/v1/artistas/${encodeURIComponent(id)}/foto`, {
      method: "PUT",
      body: corpo,
      credentials: "same-origin",
    });
  } catch (causa) {
    throw new ErroRede(causa);
  }
  if (!r.ok) {
    let detalhe = r.statusText;
    try {
      detalhe = (await r.json())?.detail ?? detalhe;
    } catch {
      /* corpo não-JSON */
    }
    // `ErroApi` e `ErroRede`, como o resto deste arquivo. O desvio de
    // `multipart` é sobre o CABEÇALHO, não sobre o vocabulário de erro — e
    // este `throw` cru fazia o `ehErroDeApi` das telas responder "não é".
    throw new ErroApi(r.status, String(detalhe));
  }
  return (await r.json()) as { foto: string | null };
}

export const tirarFotoDoArtista = (id: string) =>
  chamar<void>(`/artistas/${encodeURIComponent(id)}/foto`, { method: "DELETE" });

export const listarArtistas = () => chamar<ArtistaResumo[]>("/artistas");
export const verArtista = (id: string) =>
  chamar<Artista>(`/artistas/${encodeURIComponent(id)}`);
export const minhaBiblioteca = () => chamar<ArtistaResumo[]>("/eu/artistas");
export const seguirArtista = (id: string) =>
  chamar<void>(`/artistas/${encodeURIComponent(id)}/seguir`, { method: "PUT" });
export const deixarDeSeguirArtista = (id: string) =>
  chamar<void>(`/artistas/${encodeURIComponent(id)}/seguir`, { method: "DELETE" });

/**
 * Para onde apontar quando não temos a URL do canal.
 *
 * O acervo guarda o NOME do canal, não o endereço dele — descobrir o endereço
 * custa quota da API do YouTube, que é do outro cron. Até lá, uma busca pelo
 * nome leva a pessoa ao lugar certo e não custa nada. A tela diz que é busca,
 * para ninguém achar que é o canal oficial.
 */
export function buscaNoYoutube(nome: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(nome)}`;
}


/**
 * Os mais ouvidos deste artista — a seção que o Spotify chama de "Popular".
 *
 * Devolve lista vazia quando ninguém clicou ainda, e a tela não desenha a
 * seção: um ranking de zeros ordenado por desempate é ruído com cara de
 * informação.
 */
export function maisOuvidos(pontos: PontoDoArtista[], quantos = 5): PontoDoArtista[] {
  return [...pontos]
    .filter((p) => p.cliques > 0)
    .sort((a, b) => b.cliques - a.cliques || a.titulo.localeCompare(b.titulo, "pt-BR"))
    .slice(0, quantos);
}

/** O recado que o servidor devolve depois do pedido de remoção. */
export interface RecadoDeRemocao {
  mensagem: string;
}

/**
 * "Este canal é meu e eu não quero aparecer aqui."
 *
 * **Não exige conta**, e isso é a decisão: quem quer sair de um app de Umbanda
 * é exatamente quem não vai criar uma conta nele para pedir. A página sai do ar
 * na hora e uma pessoa revisa depois — ver `routers/artista.pedir_remocao`.
 */
export const pedirRemocaoDoArtista = (
  id: string,
  corpo: { contato?: string; relato?: string },
) =>
  chamar<RecadoDeRemocao>(`/artistas/${encodeURIComponent(id)}/remocao`, {
    method: "POST",
    body: JSON.stringify(corpo),
  });

/** Um pedido esperando decisão, para quem modera. */
export interface RemocaoNaFila {
  id: string;
  artistaId: string;
  artistaNome: string;
  contato: string | null;
  relato: string | null;
  criadoEm: string;
}

export const filaDeRemocoes = () =>
  chamar<RemocaoNaFila[]>("/admin/remocoes-de-artista");

export const restaurarArtista = (pedidoId: string) =>
  chamar<null>(`/admin/remocoes-de-artista/${encodeURIComponent(pedidoId)}/restaurar`, {
    method: "POST",
  });

export const manterArtistaOculto = (pedidoId: string) =>
  chamar<null>(`/admin/remocoes-de-artista/${encodeURIComponent(pedidoId)}/manter`, {
    method: "POST",
  });
