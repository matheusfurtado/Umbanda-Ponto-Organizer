export interface Ponto {
  id: string;
  subcategoriaId: string;
  titulo: string;
  letra: string;
  favorito: boolean;
  ordem: number;
  criadoEm: number;

  // Vem do servidor, nunca do usuário: é o casamento com o YouTube feito pelo
  // buscar_pontos.py. Opcionais porque 10 pontos não têm vídeo nenhum, e isso
  // é estado permanente, não pendência.
  //
  // `videoConfianca` acompanha `videoUrl` SEMPRE. O casamento é heurístico:
  // 157 dos 510 são palpite (confiança < 0.9). Mostrar um palpite como certo
  // é mentir para quem vai cantar na gira.
  videoUrl?: string | null;
  videoStatus?: "encontrado" | "revisar" | "nao_encontrado" | null;
  videoConfianca?: number | null;
}

export interface Subcategoria {
  id: string;
  orixaId: string;
  nome: string;
  ordem: number;
  criadoEm: number;
}

export interface Orixa {
  id: string;
  nome: string;
  cor: string;
  emoji: string;
  ordem: number;
  criadoEm: number;
}

export interface AppData {
  orixas: Orixa[];
  subcategorias: Subcategoria[];
  pontos: Ponto[];
  /** Preferência de UI, não acervo. Fica só neste aparelho — nunca sincroniza. */
  ultimoOrixaId?: string;
  /**
   * Qual versão do acervo esta cópia representa.
   *
   * Vai de volta no envio para o servidor recusar gravação em cima de mudança
   * que este aparelho não viu — a aba aberta há horas apagando o que o celular
   * gravou, sem ninguém perceber.
   */
  versao?: string | null;
}

/** Em que pé está a carga do acervo. Antes disto o app só tinha "pronto". */
export type EstadoAcervo = "carregando" | "pronto" | "erro";

/** Como o acervo em memória chegou aqui. Muda o que a UI deve dizer ao usuário. */
export type FonteAcervo =
  | "servidor"   // fresquinho da API
  | "cache"      // do aparelho, porque a rede falhou
  | "local";     // nunca falou com servidor (primeira abertura offline)
