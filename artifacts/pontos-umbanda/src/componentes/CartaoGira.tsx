import { Link } from "wouter";
import { CapaGira } from "@/componentes/CapaGira";

/**
 * O cartão de uma gira na vitrine, com DOIS destinos.
 *
 * O cartão leva à gira; o nome de quem montou leva ao perfil dela. É por aí
 * que se descobre gente para seguir — como no Spotify se chega ao artista pela
 * música.
 *
 * ## Por que não é um link dentro do outro
 *
 * Link dentro de link é HTML inválido: o navegador desfaz o aninhamento e o de
 * dentro deixa de funcionar, sem erro nenhum. Foi por isso que este link ficou
 * só na PÁGINA da gira até agora.
 *
 * A saída é a padrão: o cartão é um contêiner posicionado, o link da gira é uma
 * camada que cobre tudo (`absolute inset-0`), e o nome de quem montou fica
 * ACIMA dessa camada (`relative z-10`). Nenhum dos dois está dentro do outro —
 * eles se sobrepõem.
 *
 * "Anônimo" não vira link: é o rótulo de quando o apelido falta, e não
 * corresponde a perfil nenhum.
 */
export function CartaoGira({
  id,
  nome,
  de,
  pontos,
}: {
  id: string;
  nome: string;
  de: string;
  pontos: number;
}) {
  const temPerfil = de && de !== "Anônimo";

  return (
    <div className="relative rounded-xl bg-card/60 p-3 transition hover:bg-accent/50">
      <Link
        href={`/gira/${id}`}
        aria-label={`Abrir a gira ${nome}`}
        className="absolute inset-0 z-0 rounded-xl"
      />
      <span className="pointer-events-none mb-3 block aspect-square w-full">
        <CapaGira nome={nome} />
      </span>
      <span className="pointer-events-none block truncate font-semibold text-foreground">
        {nome}
      </span>
      <span className="block truncate text-xs text-muted-foreground">
        {temPerfil ? (
          <Link
            href={`/perfil/${encodeURIComponent(de)}`}
            className="relative z-10 underline decoration-transparent underline-offset-2 transition hover:decoration-muted-foreground"
          >
            {de}
          </Link>
        ) : (
          <span className="pointer-events-none">{de}</span>
        )}
        <span className="pointer-events-none">
          {" · "}
          {pontos} {pontos === 1 ? "ponto" : "pontos"}
        </span>
      </span>
    </div>
  );
}
