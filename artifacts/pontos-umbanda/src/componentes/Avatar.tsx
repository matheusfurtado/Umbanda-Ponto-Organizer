/**
 * A foto de um perfil — ou a marca que faz as vezes dela.
 *
 * **A foto é opcional, e a ausência dela não pode parecer defeito.** Quem não
 * mandou nenhuma recebe uma marca gerada: a inicial do apelido sobre um
 * gradiente derivado do próprio nome, igual para a mesma pessoa em qualquer
 * aparelho. Sem âncora visual a tela vira lista de arquivo.
 *
 * Por muito tempo não havia foto nenhuma, por um receio legítimo: pedir imagem
 * a quem se identifica como de Umbanda é pedir um rosto colado a uma convicção
 * religiosa. O Matheus decidiu abrir — não se pede rosto, a pessoa põe o que
 * quiser — e o cuidado migrou para onde ele rende mais: o servidor reencoda
 * toda imagem e joga fora o EXIF, porque a coordenada de GPS que vem numa foto
 * de celular publicaria onde fica o terreiro (`servicos/foto_perfil.py`).
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
  foto,
  tamanho = "md",
}: {
  apelido: string;
  /** Endereço vindo da API. `null`/ausente = marca gerada. */
  foto?: string | null;
  tamanho?: "sm" | "md" | "lg";
}) {
  const h = matiz(apelido || "?");
  const classe =
    tamanho === "lg"
      ? "h-32 w-32 text-5xl sm:h-40 sm:w-40 sm:text-6xl"
      : tamanho === "sm"
        ? "h-9 w-9 text-sm"
        : "h-12 w-12 text-lg";

  if (foto) {
    return (
      <img
        src={foto}
        // Vazio e não "foto de fulano": o nome já está escrito ao lado, e
        // leitor de tela repetindo o mesmo nome duas vezes atrapalha.
        alt=""
        className={`shrink-0 rounded-full object-cover ${classe}`}
        loading="lazy"
      />
    );
  }

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
