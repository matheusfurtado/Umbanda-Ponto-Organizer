import { Star } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/auth/AuthContext";
import { useApp } from "@/context";

/**
 * A estrela — e o que ela faz para quem ainda não entrou.
 *
 * Favoritar passou a ser de quem tem conta: a lista de favoritos só existe
 * logada, e uma estrela que marca no aparelho sem ter onde mostrar o resultado
 * é o defeito que a barra lateral já documentava ao ganhar o link ("quem
 * favoritava de dentro de um orixá não via nada acontecer").
 *
 * Para quem não entrou, então, a estrela **continua na tela e leva ao login**.
 * Sumir seria mais limpo e tiraria o gancho: é vendo o que ela promete que
 * alguém decide criar conta. O que não pode é o meio-termo — marcar de
 * mentira, sem destino.
 *
 * ## Por que isto é um componente, e não duas cópias
 *
 * A estrela aparece em `LinhaPonto` (a lista) e em `CardPonto` (o card
 * aberto), com aparências diferentes. As duas tinham `onClick={() =>
 * toggleFavorito(ponto.id)}` copiado. Regra que vale em mais de um lugar,
 * reimplementada em cada um, diverge — e aqui o que divergiria é quem pode
 * favoritar.
 */
export function BotaoFavorito({
  id,
  favorito,
  className,
  comRotulo,
}: {
  id: string;
  favorito: boolean;
  className?: string;
  /**
   * Mostra a palavra ao lado da estrela (é o caso do card aberto).
   *
   * A palavra sai DAQUI e não de quem chama. O card montava
   * `{ponto.favorito ? "Favorito" : "Favoritar"}` por fora — e para quem não
   * entrou `ponto.favorito` pode ser `true` (favorito antigo, guardado no
   * aparelho antes desta regra). Daria "Favorito" escrito ao lado de uma
   * estrela vazia: a mesma pergunta respondida de dois jeitos na mesma linha.
   */
  comRotulo?: boolean;
}) {
  const { autenticado } = useAuth();
  const { toggleFavorito } = useApp();

  // Para quem não entrou a estrela nunca está cheia: ela não representa nada
  // guardado ainda. Mostrá-la marcada seria afirmar um favorito que não existe.
  const marcada = autenticado && favorito;
  const conteudo = (
    <>
      <Star className={`h-4 w-4 ${marcada ? "fill-current" : ""}`} />
      {comRotulo && (marcada ? "Favorito" : "Favoritar")}
    </>
  );

  // LINK, e não botão com `onClick` que navega.
  //
  // Para quem não entrou este controle não marca nada: ele vai para outro
  // lugar. Sendo `<a href>`, ganha de graça o que um botão teria de imitar mal
  // — abrir em outra aba, o destino na barra de status, o Enter do teclado — e
  // o leitor de tela anuncia "link", que é a verdade.
  if (!autenticado) {
    return (
      <Link
        href="/login?motivo=favoritos"
        title="Entrar para favoritar"
        aria-label="Entrar para favoritar"
        className={className}
      >
        {conteudo}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggleFavorito(id)}
      title={favorito ? "Desfavoritar" : "Favoritar"}
      aria-label={favorito ? "Desfavoritar" : "Favoritar"}
      className={className}
    >
      {conteudo}
    </button>
  );
}
