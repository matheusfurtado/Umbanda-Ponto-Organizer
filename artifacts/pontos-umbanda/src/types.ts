export interface Ponto {
  id: string;
  subcategoriaId: string;
  titulo: string;
  letra: string;
  favorito: boolean;
  ordem: number;
  criadoEm: number;
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
  ultimoOrixaId?: string;
}
