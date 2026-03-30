import { AppData, Orixa, Subcategoria, Ponto } from "./types";

const STORAGE_KEY = "pontos-umbanda-data";

const ORIXAS_PADRAO: Orixa[] = [
  { id: "exu", nome: "Exu", cor: "#dc2626", emoji: "🔥", ordem: 0, criadoEm: Date.now() },
  { id: "ogum", nome: "Ogum", cor: "#2563eb", emoji: "⚔️", ordem: 1, criadoEm: Date.now() },
  { id: "oxossi", nome: "Oxóssi", cor: "#16a34a", emoji: "🏹", ordem: 2, criadoEm: Date.now() },
  { id: "xango", nome: "Xangô", cor: "#d97706", emoji: "⚡", ordem: 3, criadoEm: Date.now() },
  { id: "iansa", nome: "Iansã", cor: "#7c3aed", emoji: "🌪️", ordem: 4, criadoEm: Date.now() },
  { id: "oxum", nome: "Oxum", cor: "#ca8a04", emoji: "💛", ordem: 5, criadoEm: Date.now() },
  { id: "yemanja", nome: "Iemanjá", cor: "#0891b2", emoji: "🌊", ordem: 6, criadoEm: Date.now() },
  { id: "oxala", nome: "Oxalá", cor: "#94a3b8", emoji: "☁️", ordem: 7, criadoEm: Date.now() },
  { id: "omulu", nome: "Omulu", cor: "#78350f", emoji: "💀", ordem: 8, criadoEm: Date.now() },
  { id: "nanaboroco", nome: "Nanã", cor: "#6d28d9", emoji: "🪷", ordem: 9, criadoEm: Date.now() },
];

const SUBCATEGORIAS_PADRAO: Subcategoria[] = [
  { id: "sub-exu-1", orixaId: "exu", nome: "Chamada", ordem: 0, criadoEm: Date.now() },
  { id: "sub-exu-2", orixaId: "exu", nome: "Louvação", ordem: 1, criadoEm: Date.now() },
  { id: "sub-ogum-1", orixaId: "ogum", nome: "Chamada", ordem: 0, criadoEm: Date.now() },
  { id: "sub-ogum-2", orixaId: "ogum", nome: "Descarrego", ordem: 1, criadoEm: Date.now() },
  { id: "sub-oxossi-1", orixaId: "oxossi", nome: "Chamada", ordem: 0, criadoEm: Date.now() },
];

const PONTOS_PADRAO: Ponto[] = [
  {
    id: "p1",
    subcategoriaId: "sub-exu-1",
    titulo: "Laroyê Exu, Exu mojubá...",
    letra: "Laroyê Exu, Exu mojubá\nLaroyê Exu, Exu mojubá\nEle é o dono da gira\nEle é o dono do terreiro\nExu é o mensageiro\nEntre o humano e o divino\nLaroyê Exu, Exu mojubá",
    favorito: false,
    ordem: 0,
    criadoEm: Date.now(),
  },
  {
    id: "p2",
    subcategoriaId: "sub-exu-2",
    titulo: "Exu é o guardião das encruzilhadas...",
    letra: "Exu é o guardião das encruzilhadas\nDono dos caminhos, das estradas\nEle abre as portas, ele fecha também\nAo seu Exu, respeito se tem\nSaravá Exu!\nSaravá o povo da rua!",
    favorito: false,
    ordem: 0,
    criadoEm: Date.now(),
  },
  {
    id: "p3",
    subcategoriaId: "sub-ogum-1",
    titulo: "Ogum é guerreiro, é senhor da guerra...",
    letra: "Ogum é guerreiro, é senhor da guerra\nOgum é o dono do ferro e da terra\nOgum abre caminhos com sua espada\nNa força de Ogum somos abençoados\nSaravá Ogum!\nOgum Yê!",
    favorito: false,
    ordem: 0,
    criadoEm: Date.now(),
  },
];

export function carregarDados(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const dados: AppData = {
        orixas: ORIXAS_PADRAO,
        subcategorias: SUBCATEGORIAS_PADRAO,
        pontos: PONTOS_PADRAO,
      };
      salvarDados(dados);
      return dados;
    }
    return JSON.parse(raw) as AppData;
  } catch {
    return { orixas: ORIXAS_PADRAO, subcategorias: [], pontos: [] };
  }
}

export function salvarDados(dados: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
}

export function exportarDados(): void {
  const dados = carregarDados();
  const json = JSON.stringify(dados, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pontos-umbanda-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importarDados(arquivo: File): Promise<void> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const dados = JSON.parse(e.target?.result as string) as AppData;
        if (!dados.orixas || !dados.subcategorias || !dados.pontos) {
          throw new Error("Arquivo inválido");
        }
        salvarDados(dados);
        resolve();
      } catch {
        reject(new Error("Arquivo de backup inválido"));
      }
    };
    reader.onerror = () => reject(new Error("Erro ao ler arquivo"));
    reader.readAsText(arquivo);
  });
}

export function gerarId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
