import { Link } from "wouter";
import { Link2, ListMusic, Smartphone, Users } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { useEntitlements } from "@/billing/EntitlementsContext";

/**
 * O convite para assinar — o "flyer" que ele pediu.
 *
 * ## Por que um componente, e não uma frase em cada tela
 *
 * Porque a frase apodrece. Em 03/09 a mesma promessa envelheceu TRÊS vezes num
 * dia, em telas diferentes, e ninguém percebeu porque texto que virou mentira
 * não quebra nada. Uma casa só para o argumento de venda é o que faz corrigi-lo
 * ser uma edição, e não uma caçada. Ver `promessa-do-plano.test.tsx`.
 *
 * ## O que ele vende, e o que ele NÃO vende
 *
 * Vende o que é ferramenta: montar a sequência da gira, levá-la no bolso,
 * mandá-la para quem você quiser, e a estante de artistas.
 *
 * Não vende — e não pode voltar a vender — a letra, o link do vídeo nem o app
 * funcionar sem sinal: essas três são de todo mundo (ADR 0002). A cerca reprova
 * quem tentar.
 *
 * ## Onde ele aparece
 *
 * Nos lugares em que a pessoa acabou de esbarrar no limite — a estante vazia, a
 * gira de outra pessoa que ela abriu pelo link. Nunca no meio da leitura de um
 * ponto: interromper conteúdo litúrgico para vender é o tipo de coisa que faz
 * desinstalar.
 */

const O_QUE_O_PLANO_DA = [
  {
    Icone: ListMusic,
    titulo: "Crie suas playlists",
    diz: "A sequência da gira na sua ordem, com as seções da casa — chegada, louvação, firmeza.",
  },
  {
    Icone: Smartphone,
    titulo: "Carregue no bolso",
    diz: "A gira inteira vai junto no celular, para o terreiro onde o sinal não chega.",
  },
  {
    Icone: Link2,
    titulo: "Compartilhe como quiser",
    diz: "Um link só para quem você mandar — ou na vitrine, para a comunidade toda achar.",
  },
  {
    Icone: Users,
    titulo: "Siga quem você ouve",
    diz: "Seus artistas numa estante só, com o que eles gravaram.",
  },
];

export function ConviteParaAssinar({
  motivo,
  compacto = false,
}: {
  /** A frase de topo — diga o que a pessoa acabou de tentar fazer. */
  motivo: string;
  /** Sem a lista de vantagens: para rodapé de tela cheia de conteúdo. */
  compacto?: boolean;
}) {
  const { autenticado } = useAuth();
  const { ent } = useEntitlements();

  // Quem já paga não é convidado a pagar. Parece óbvio e é o defeito mais comum
  // deste tipo de faixa: ela fica na tela de quem já comprou.
  if (ent.repertorios && ent.seguirArtistas) return null;

  return (
    <section className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
      <p className="text-sm font-medium text-foreground">{motivo}</p>

      {!compacto && (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {O_QUE_O_PLANO_DA.map(({ Icone, titulo, diz }) => (
            <li key={titulo} className="flex gap-2.5">
              <Icone className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>
                <span className="block text-sm font-medium text-foreground">{titulo}</span>
                <span className="block text-xs leading-snug text-muted-foreground">{diz}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          href="/planos"
          className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
        >
          {autenticado ? "Ver planos" : "Começar o teste grátis"}
        </Link>
        {/* O que continua de graça, dito no mesmo lugar. Sem isto, uma faixa de
            venda num app religioso lê como se o acervo fosse ficar atrás de
            paywall — e o acervo nunca vai. */}
        <p className="text-xs leading-snug text-muted-foreground">
          As letras, os vídeos e o acervo inteiro seguem abertos, com ou sem plano.
        </p>
      </div>
    </section>
  );
}
