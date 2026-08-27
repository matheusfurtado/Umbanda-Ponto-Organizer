import type { AppData, Orixa, Ponto, Subcategoria } from "./types";

const STORAGE_KEY = "pontos-umbanda-data";

/**
 * O acervo guardado neste aparelho. **Vazio quando nunca houve um.**
 *
 * ## Por que não há mais um acervo embutido aqui
 *
 * Este arquivo carregava 248 pontos, 11 orixás e as SUBCATEGORIAS deles, em
 * código — sobra de quando o app era local-first e não existia servidor.
 *
 * Aquilo furava o portão do ADR 0002. Verificado no navegador: com o cache
 * limpo e sem sessão nenhuma, o app mostrava "Ogum — 30 pontos · 4 seções",
 * com CHEGADA e LOUVAÇÃO na ordem da gira. Ou seja, o produto pago inteiro,
 * servido do bundle, sem pagar e sem falar com o servidor. Não adianta o
 * servidor recusar enviar a hierarquia se o cliente já a traz embarcada.
 *
 * Também estava DESATUALIZADO — 248 pontos contra os 520 do acervo — então
 * quem caísse nele veria um acervo menor sem nenhum sinal de que faltava
 * coisa.
 *
 * Agora, primeira abertura sem rede mostra vazio, e a tela diz o que fazer.
 * Menos acolhedor, e honesto: é melhor dizer "preciso de conexão uma vez" do
 * que entregar um acervo pela metade fingindo estar completo.
 */
export function carregarDados(): AppData {
  const vazio: AppData = { orixas: [], subcategorias: [], pontos: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppData) : vazio;
  } catch {
    // localStorage indisponível (aba anônima restrita) ou JSON corrompido.
    // Vazio deixa o servidor repovoar; devolver lixo parcial seria pior.
    return vazio;
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
  // UUID v4 do navegador (secure context). Casa com as PKs uuid do servidor e permite
  // criar offline sem colisão entre dispositivos.
  return crypto.randomUUID();
}
