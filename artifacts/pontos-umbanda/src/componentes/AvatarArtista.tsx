import { matiz } from "@/lib/matiz";

/**
 * A cara do artista — em um lugar só.
 *
 * Existiam duas: a página do artista mostrava a FOTO (e, sem foto, a inicial
 * sobre `bg-primary/15`), e a prateleira da tela inicial inventou uma inicial
 * sobre gradiente. O mesmo canal tinha duas aparências em duas telas do mesmo
 * app — a divergência clássica deste projeto, criada por mim ao escrever a
 * prateleira sem olhar a página.
 *
 * ## Por que gradiente do NOME, e não uma cor só
 *
 * Num diretório de 16 canais, dezesseis avatares iguais não são identidade:
 * são decoração de uma lista de texto. A cor tirada do nome (`lib/matiz.ts`,
 * a mesma da capa das playlists) dá a cada canal uma marca que se reconhece
 * antes de ler — e é estável, então ela vira memória.
 *
 * A foto vence sempre que existe: rosto reconhece melhor que letra.
 */
const TAMANHOS = {
  sm: { px: 40, texto: "text-base" },
  md: { px: 64, texto: "text-2xl" },
  lg: { px: 72, texto: "text-2xl" },
} as const;

export function AvatarArtista({
  nome,
  foto,
  tamanho = "md",
}: {
  nome: string;
  foto?: string | null;
  tamanho?: keyof typeof TAMANHOS;
}) {
  const { px, texto } = TAMANHOS[tamanho];

  if (foto) {
    return (
      <img
        src={foto}
        alt=""
        width={px}
        height={px}
        loading="lazy"
        className="shrink-0 rounded-full object-cover"
        style={{ width: px, height: px }}
      />
    );
  }

  const h = matiz(nome || "artista");
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full font-black text-white/90 ${texto}`}
      style={{
        width: px,
        height: px,
        background: `linear-gradient(145deg, hsl(${h} 55% 42%), hsl(${(h + 40) % 360} 50% 26%))`,
      }}
    >
      {nome.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
