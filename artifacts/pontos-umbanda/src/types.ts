export interface Ponto {
  id: string;
  subcategoriaId: string;
  // De qual orixá é o ponto. Vem SEMPRE, inclusive no plano grátis — é o que
  // permite navegar por orixá sem receber a subcategoria, que é o recorte
  // fino e continua pago.
  orixaId?: string;
  titulo: string;
  // Vazio na maior parte do acervo: a tradição é oral e boa parte dos pontos
  // não tem autoria conhecida. Quem souber preenche; palpite seria atribuição
  // falsa de obra religiosa.
  autor?: string | null;
  /** Enviado por mim e ainda esperando revisão. Só eu vejo. */
  emAprovacao?: boolean;
  /** Quando entrou no acervo por aprovação da comunidade (ms). Nulo no acervo
   *  original — é o que permite marcar "novo" sem inventar uma lista à parte. */
  aprovadoEm?: number | null;
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
  // Crédito de quem gravou, e sinal de procedência: ajuda a decidir se aquela
  // versão do ponto é confiável antes de levá-la para a gira.
  videoCanal?: string | null;
  videoTitulo?: string | null;
  videoDuracaoSeg?: number | null;
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
