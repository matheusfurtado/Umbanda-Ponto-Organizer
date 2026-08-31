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

/**
 * Guarda o acervo. **Devolve se conseguiu.**
 *
 * Era `void` com `setItem` nu — ao contrário do `carregarDados` logo acima e do
 * `gravarPendente`, que já tinham guarda. Com a cota estourada (o acervo tem
 * ~250 KB e o pendente guarda uma SEGUNDA cópia inteira) ou o armazenamento
 * bloqueado, o `setItem` lançava, e daí:
 *
 * - **escrevendo:** o erro subia por `persistir` → `atualizar` e matava o
 *   `setDados` no meio. A edição da pessoa sumia da tela, sem uma palavra.
 * - **lendo:** estourava dentro do `try` de `carregar()`, e o `catch` de lá
 *   apresentava uma carga que DEU CERTO como falha — "falha desconhecida".
 *
 * Devolver `boolean` deixa quem chama decidir. Ninguém é obrigado a tratar, mas
 * agora dá para distinguir "não consegui guardar no aparelho" de "não consegui
 * falar com o servidor", que são coisas diferentes e têm saídas diferentes.
 */
export function salvarDados(dados: AppData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dados));
    return true;
  } catch {
    // Sem espaço, ou sem armazenamento. O dado continua em memória e na tela —
    // perder o que a pessoa acabou de fazer porque o disco recusou seria trocar
    // um problema de armazenamento por um de acervo.
    return false;
  }
}

/**
 * Já houve uma visita que guardou acervo neste aparelho?
 *
 * Mora AQUI porque a chave é daqui. O `repositorio` lia
 * `localStorage.getItem("pontos-umbanda-data")` com o literal copiado e SEM
 * guarda — duas coisas erradas: renomear a chave de um lado deixaria a faixa
 * "este aparelho ainda não tem cópia guardada" aparecer para quem tem o acervo
 * inteiro, e com o armazenamento bloqueado aquela leitura nua lançava dentro do
 * `catch` de `carregar()` — o erro dentro do tratador de erro, sem ninguém para
 * pegar, e o esqueleto girando para sempre.
 */
export function houveVisita(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
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

/**
 * Lê o arquivo e devolve o acervo. **Não grava nada.**
 *
 * Ela fazia `salvarDados` e pronto, e isso não restaurava nada para quem tem
 * conta: a tela recarrega, o `carregar()` do boot não acha pendente, cai no
 * caminho normal e grava o do servidor por cima. O backup era descartado antes
 * de aparecer na tela — sem erro e sem aviso, com a pessoa vendo o app
 * recarregar e concluindo que restaurou.
 *
 * Isso importa mais que os outros defeitos de dado: **este é o caminho de
 * recuperação deles.** Quem perdeu o acervo tenta o backup, e ele não fazia
 * nada.
 *
 * Quem grava é `dados/repositorio.persistir`, chamado por quem importa —
 * restaurar um backup É dizer "este é o meu acervo agora", então ele precisa
 * virar pendente para vencer o servidor e subir. `storage` não pode chamar
 * `repositorio` (ele já depende daqui: importar de volta fecha um ciclo e
 * quebra o módulo inteiro, medido).
 */
export function importarDados(arquivo: File): Promise<AppData> {
  return new Promise<AppData>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const dados = JSON.parse(e.target?.result as string) as AppData;
        if (!dados.orixas || !dados.subcategorias || !dados.pontos) {
          throw new Error("Arquivo inválido");
        }
        // A marca `parcial` NÃO volta do arquivo: um backup exportado por
        // quem pagava não é a visão do portão, e ela impediria o envio.
        const { parcial: _ignorado, ...limpo } = dados;
        resolve(limpo);
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
