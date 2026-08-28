/**
 * Artistas: a página de quem canta, e a biblioteca de quem segue.
 *
 * ## O link vem para todo mundo, e isso é decisão, não descuido
 *
 * O `GET /acervo` não manda `videoUrl` para quem não paga (ADR 0002). Estas
 * rotas mandam — decisão do dono em 28/08, registrada no ADR 0007. Quem mexer
 * aqui achando que é furo do portão vai desfazer o produto que ele pediu.
 */

const BASE = "/api/v1";

async function chamar<T>(caminho: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${BASE}${caminho}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    credentials: "same-origin",
  });
  if (!r.ok) {
    let detalhe = r.statusText;
    try {
      detalhe = (await r.json())?.detail ?? detalhe;
    } catch {
      /* corpo não-JSON: fica o statusText */
    }
    const erro = new Error(String(detalhe)) as Error & { status?: number };
    erro.status = r.status;
    throw erro;
  }
  return r.status === 204 ? (undefined as T) : ((await r.json()) as T);
}

export interface ArtistaResumo {
  id: string;
  nome: string;
  pontos: number;
  seguidores: number;
  curado: boolean;
}

export interface PontoDoArtista {
  id: string;
  titulo: string;
  orixa: string | null;
  videoUrl: string | null;
  /** `encontrado` ou `revisar`. Anda SEMPRE junto com a URL. */
  videoStatus: string | null;
}

export interface Artista extends ArtistaResumo {
  canalUrl: string | null;
  /** `null` para quem não está logado: a tela convida a entrar em vez de
   *  mostrar um botão que não vai funcionar. */
  seguindo: boolean | null;
  pontosDoArtista: PontoDoArtista[];
}

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
