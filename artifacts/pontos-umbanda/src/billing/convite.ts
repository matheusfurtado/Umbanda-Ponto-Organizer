/**
 * Quando o app pede para a pessoa assinar — e, principalmente, quando NÃO pede.
 *
 * ## Por que isto é um módulo, e não um `useState` numa tela
 *
 * Porque a decisão é sobre o app inteiro. Cada tela decidindo por conta própria
 * é como se chega em cinco pop-ups numa sessão: ninguém tem a visão do
 * conjunto, e a pessoa desinstala. Aqui há um lugar só que responde "cabe pedir
 * agora?", e ele é o único que sabe quando pediu da última vez.
 *
 * ## Dois gatilhos, e o primeiro é o que presta
 *
 * 1. **Por INTENÇÃO.** A pessoa tocou em "Seguir", ou tentou montar uma
 *    playlist. Ela acabou de dizer o que quer; explicar ali o que o plano faz
 *    não é interrupção, é resposta. Este gatilho **não tem limite de
 *    frequência** — quem tenta três vezes merece a explicação três vezes.
 * 2. **SOZINHO**, de vez em quando. É o pop-up clássico, e é o que incomoda.
 *    Por isso vem com três travas: nunca na primeira abertura do app, no
 *    máximo uma vez a cada `DIAS_DE_DESCANSO` dias, e nunca para quem assina.
 *
 * ## O que ele nunca faz
 *
 * Não aparece em cima de conteúdo litúrgico sendo lido (a `Moldura` o mantém
 * fora do login e do cadastro, e o gatilho sozinho espera a tela assentar).
 * Interromper alguém no meio de um ponto para vender é o tipo de coisa que faz
 * desinstalar um app religioso.
 */

/** Por que o convite apareceu. Vira a primeira frase do pop-up. */
export type MotivoDoConvite =
  | "seguir-artista"
  | "montar-playlist"
  | "compartilhar-playlist"
  | "sozinho";

//: A frase de topo. Nomeia o que a pessoa ACABOU de tentar — convite genérico
//: não ajuda ninguém, e é o que faz um pop-up ser lido como ruído.
export const FRASE: Record<MotivoDoConvite, string> = {
  "seguir-artista":
    "Guardar os artistas que você ouve faz parte do plano.",
  "montar-playlist":
    "Montar a sequência da sua gira faz parte do plano.",
  "compartilhar-playlist":
    "Mandar sua playlist para a casa faz parte do plano.",
  sozinho:
    "Você está usando o acervo. Que tal deixar a gira pronta?",
};

const CHAVE_ULTIMO = "pontos-umbanda-convite-em";
const CHAVE_ABERTURAS = "pontos-umbanda-aberturas";

/** Uma semana. Tempo suficiente para o pop-up não virar paisagem. */
export const DIAS_DE_DESCANSO = 7;

/**
 * Quantas vezes o app já foi aberto. O pop-up sozinho espera a segunda.
 *
 * Quem abriu agora não sabe o que o produto faz; vender antes de mostrar é o
 * jeito mais rápido de a primeira impressão ser um anúncio.
 */
export function contarAbertura(): number {
  try {
    const n = Number(localStorage.getItem(CHAVE_ABERTURAS) ?? "0") + 1;
    localStorage.setItem(CHAVE_ABERTURAS, String(n));
    return n;
  } catch {
    // Aba anônima, armazenamento cheio, iOS em modo privado. Sem memória, o
    // convite sozinho simplesmente não aparece — o silêncio é o padrão seguro.
    return 0;
  }
}

export function podeAparecerSozinho(agora: number = Date.now()): boolean {
  try {
    if (Number(localStorage.getItem(CHAVE_ABERTURAS) ?? "0") < 2) return false;
    const ultimo = Number(localStorage.getItem(CHAVE_ULTIMO) ?? "0");
    return agora - ultimo > DIAS_DE_DESCANSO * 86_400_000;
  } catch {
    return false;
  }
}

export function marcarQueApareceu(agora: number = Date.now()): void {
  try {
    localStorage.setItem(CHAVE_ULTIMO, String(agora));
  } catch {
    /* sem memória, sem marca — ver `contarAbertura` */
  }
}

type Ouvinte = (motivo: MotivoDoConvite) => void;
const ouvintes = new Set<Ouvinte>();

/**
 * Pede o convite AGORA, porque a pessoa acabou de esbarrar no plano.
 *
 * Sem limite de frequência de propósito: este caminho só existe quando ela
 * tentou fazer algo, e responder "faz parte do plano" a quem perguntou nunca é
 * interrupção.
 */
export function pedirPlano(motivo: MotivoDoConvite): void {
  for (const ouvinte of ouvintes) ouvinte(motivo);
}

export function observarConvite(ouvinte: Ouvinte): () => void {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}
