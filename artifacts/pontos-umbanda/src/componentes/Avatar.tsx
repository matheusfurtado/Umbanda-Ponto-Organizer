/**
 * A "foto" de um perfil.
 *
 * Não há foto e não vai haver tão cedo: pedir imagem a quem se identifica como
 * de Umbanda é pedir um rosto colado a uma convicção religiosa, e isso não se
 * despublica. Então a marca é gerada — a inicial do apelido sobre um gradiente
 * derivado do próprio nome, igual para a mesma pessoa em qualquer aparelho.
 *
 * É a mesma escolha da `Capa` dos orixás, pelo mesmo motivo: sem âncora visual
 * a tela vira lista de arquivo, e ninguém paga por lista de arquivo.
 */

function matiz(nome: string): number {
  // Soma simples dos códigos: estável, sem dependência, e espalha o suficiente
  // para dois apelidos vizinhos não saírem da mesma cor.
  let n = 0;
  for (const c of nome) n = (n * 31 + c.charCodeAt(0)) % 360;
  return n;
}

export function Avatar({
  apelido,
  tamanho = "md",
}: {
  apelido: string;
  tamanho?: "sm" | "md" | "lg";
}) {
  const h = matiz(apelido || "?");
  const classe =
    tamanho === "lg"
      ? "h-32 w-32 text-5xl sm:h-40 sm:w-40 sm:text-6xl"
      : tamanho === "sm"
        ? "h-9 w-9 text-sm"
        : "h-12 w-12 text-lg";

  return (
    <div
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-black text-white ${classe}`}
      style={{
        background: `linear-gradient(135deg, hsl(${h} 55% 45%), hsl(${(h + 40) % 360} 55% 32%))`,
      }}
    >
      {(apelido || "?").trim().charAt(0).toUpperCase()}
    </div>
  );
}
