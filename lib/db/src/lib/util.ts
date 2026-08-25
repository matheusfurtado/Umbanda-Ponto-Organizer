import { createHash } from "node:crypto";

// Hash da letra normalizada — DEVE ser idêntico entre o seed canônico e o import,
// senão os pontos do usuário não casam com o acervo. Não altere sem re-semear.
export function hashLetra(letra: string): string {
  const normal = letra.replace(/\r\n/g, "\n").trim().replace(/[ \t]+/g, " ").toLowerCase();
  return createHash("sha256").update(normal).digest("hex");
}

// Converte a `ordem` inteira (legado do localStorage) numa posição lexicográfica estável.
// A reordenação futura usa índice fracionário; aqui só preservamos a ordem inicial.
export function posFromOrdem(ordem: number): string {
  return String(Math.max(0, Math.trunc(ordem))).padStart(6, "0");
}
