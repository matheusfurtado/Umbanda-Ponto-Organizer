/**
 * A "capa" de um orixá.
 *
 * O acervo não tem imagem — e não vai ter tão cedo: foto de orixá é assunto
 * delicado, e imagem genérica de banco lê como desrespeito. Então a capa é
 * gerada: gradiente derivado da cor do próprio orixá, com o emoji dele por
 * cima.
 *
 * Isso não é enfeite. Sem nenhuma âncora visual, 14 linhas de texto viram uma
 * lista de arquivo — e lista de arquivo é exatamente o que ninguém paga para
 * usar. A cor faz a pessoa reconhecer Ogum antes de ler "Ogum".
 */

function tom(cor: string | undefined, claro: boolean): string {
  // A cor vem do acervo como hex. Sem ela, um roxo neutro em vez de quebrar.
  const base = cor && /^#?[0-9a-f]{6}$/i.test(cor.replace("#", "")) ? cor : "#7c4dff";
  const hex = base.startsWith("#") ? base : `#${base}`;
  return claro ? `${hex}` : `${hex}99`;
}

export function Capa({
  cor,
  emoji,
  tamanho = "md",
}: {
  cor?: string;
  emoji?: string;
  tamanho?: "sm" | "md" | "lg";
}) {
  const medidas = {
    sm: "h-12 w-12 text-2xl rounded-lg",
    md: "h-full w-full text-5xl rounded-xl",
    lg: "h-44 w-44 text-7xl rounded-xl",
  }[tamanho];

  return (
    <div
      className={`flex shrink-0 items-center justify-center shadow-lg ${medidas}`}
      style={{
        background: `linear-gradient(145deg, ${tom(cor, true)}, ${tom(cor, false)})`,
      }}
      aria-hidden
    >
      <span className="drop-shadow-md">{emoji || "🕯️"}</span>
    </div>
  );
}
