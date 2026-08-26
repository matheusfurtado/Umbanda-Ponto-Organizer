/**
 * Qual paleta está valendo.
 *
 * Guardada no aparelho e aplicada em `<html data-paleta>`: um atributo só troca
 * o app inteiro, porque toda cor sai de token. Se algum componente tiver cor
 * fixa, ela vai destoar em três das quatro paletas — e é assim que se descobre.
 */

export const PALETAS = [
  { id: "noite", nome: "Noite", sobre: "Escuro e sóbrio, para luz baixa" },
  { id: "terreiro", nome: "Terreiro", sobre: "Terra, ocre e dourado" },
  { id: "mata", nome: "Mata", sobre: "Verde de folha e ouro velho" },
  { id: "claro", nome: "Claro", sobre: "Para sol forte ou baixa visão" },
] as const;

export type PaletaId = (typeof PALETAS)[number]["id"];

const CHAVE = "paleta";
const PADRAO: PaletaId = "noite";

export function paletaAtual(): PaletaId {
  try {
    const g = localStorage.getItem(CHAVE) as PaletaId | null;
    if (g && PALETAS.some((p) => p.id === g)) return g;
  } catch {
    /* aba anônima sem storage: cai no padrão, e isso basta */
  }
  return PADRAO;
}

export function aplicarPaleta(id: PaletaId): void {
  document.documentElement.setAttribute("data-paleta", id);
  try {
    localStorage.setItem(CHAVE, id);
  } catch {
    /* sem storage a escolha não sobrevive ao recarregar, e tudo bem */
  }
}

/** Chamado uma vez na subida, antes da primeira pintura. */
export function iniciarPaleta(): void {
  document.documentElement.setAttribute("data-paleta", paletaAtual());
}
