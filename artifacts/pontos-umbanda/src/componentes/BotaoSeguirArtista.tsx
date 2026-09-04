/**
 * Seguir e deixar de seguir um artista.
 *
 * ## Estado de envio e mensagem de erro, sempre
 *
 * `void promessa` num `onClick` engole falha de rede: o botão não muda, nada
 * aparece, e a pessoa não sabe se aconteceu. Este projeto já pisou nessa
 * armadilha e ela está escrita no `PROGRESSO.md` — toda ação de rede num
 * clique precisa de estado de envio e de erro visível.
 *
 * ## TRÊS estados, e não dois
 *
 * `seguindo` sozinho só sabe dizer "anônimo" (`null`) ou "segue / não segue".
 * Desde 03/09 existe um terceiro: **logado e sem plano** — seguir artista
 * entrou no plano pago (ADR 0012). Sem distingui-lo, a pessoa com conta
 * clicaria "Seguir", levaria 402 do servidor e leria uma mensagem de erro onde
 * devia ler um convite.
 *
 * A DESCOBERTA continua aberta: a página do artista, os pontos e os vídeos são
 * de todo mundo (ADR 0007). O que se cobra é a estante.
 *
 * ## Otimista, mas com volta
 *
 * O botão muda na hora, porque esperar a ida e volta faz o clique parecer
 * perdido. Se a chamada falhar, ele volta ao que era E diz o que houve — o
 * pior dos mundos seria mostrar "Seguindo" para quem não está seguindo.
 */

import { useState } from "react";
import { Check, Loader2, Plus } from "lucide-react";
import { deixarDeSeguirArtista, seguirArtista } from "@/api/artista";
import { mensagemDeErro } from "@/api/cliente";
import { useEntitlements } from "@/billing/EntitlementsContext";
import { pedirPlano } from "@/billing/convite";

export function BotaoSeguirArtista({
  artistaId,
  seguindo,
  onMudou,
  compacto = false,
}: {
  artistaId: string;
  /** `null` = visitante não logado. */
  seguindo: boolean | null;
  onMudou: (seguindo: boolean) => void;
  /**
   * A versão de LISTA: cabe num cartão ao lado do nome.
   *
   * Na página do artista o botão é grande e a frase de convite é um parágrafo
   * inteiro — ali há espaço e o botão é a ação principal. Num cartão de
   * diretório, o mesmo parágrafo empurraria o nome para fora; e um botão
   * enorme por artista transformaria a lista numa fileira de botões.
   */
  compacto?: boolean;
}) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const { ent } = useEntitlements();

  // Logado, mas sem o direito. Vem ANTES do ramo de anônimo não por gosto: quem
  // não tem conta tem de ser convidado a entrar (grátis) e não a assinar —
  // pedir dinheiro a quem nem se cadastrou perde as duas coisas.
  if (seguindo !== null && !ent.seguirArtistas) {
    // BOTÃO que abre o convite, e não um link para `/planos`.
    //
    // O link mandava a pessoa para uma tela de preços a partir de um toque em
    // "Seguir" — troca de contexto no lugar de resposta. Aqui ela acabou de
    // dizer o que quer; o convite explica na hora, e quem não se interessa
    // fecha e continua na página do artista, que é aberta.
    const pedir = () => pedirPlano("seguir-artista");

    if (compacto) {
      return (
        <button
          type="button"
          onClick={pedir}
          aria-label="Seguir artistas faz parte do plano"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-dashed px-3 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Seguir
        </button>
      );
    }
    return (
      <div>
        <button
          type="button"
          onClick={pedir}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-dashed px-5 text-sm font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Seguir
        </button>
        <p className="mt-2 text-xs text-muted-foreground">
          Guardar artistas faz parte do plano. A página dele, os pontos e os
          vídeos continuam abertos.
        </p>
      </div>
    );
  }

  if (seguindo === null) {
    // LINK, e não botão: para quem não entrou isto não marca nada, vai para
    // outro lugar. Sendo `<a href>`, ganha de graça abrir em outra aba, o
    // destino na barra de status e o Enter do teclado — e o leitor de tela
    // anuncia "link", que é a verdade. Mesma decisão da estrela de favoritar.
    if (compacto) {
      return (
        <a
          href="/login?motivo=seguir-artista"
          aria-label="Entrar para seguir este artista"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Seguir
        </a>
      );
    }
    return (
      <p className="text-sm text-muted-foreground">
        <a href="/login?motivo=seguir-artista" className="font-medium text-primary underline">
          Entre
        </a>{" "}
        para seguir e ter este artista na sua biblioteca.
      </p>
    );
  }

  async function alternar() {
    const antes = seguindo as boolean;
    setEnviando(true);
    setErro(null);
    onMudou(!antes);
    try {
      await (antes ? deixarDeSeguirArtista(artistaId) : seguirArtista(artistaId));
    } catch (problema) {
      onMudou(antes);
      setErro(
        mensagemDeErro(problema, "Não consegui agora."),
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void alternar()}
        disabled={enviando}
        aria-pressed={seguindo}
        className={`inline-flex min-h-11 items-center gap-2 rounded-full font-semibold transition disabled:opacity-60 ${
          compacto ? "px-3 text-xs" : "px-5 text-sm"
        } ${
          seguindo
            ? "border bg-card text-foreground hover:border-primary/40"
            : "bg-primary text-primary-foreground hover:opacity-90"
        }`}
      >
        {enviando ? (
          <Loader2 className={compacto ? "h-3.5 w-3.5 animate-spin" : "h-4 w-4 animate-spin"} aria-hidden />
        ) : seguindo ? (
          <Check className={compacto ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden />
        ) : (
          <Plus className={compacto ? "h-3.5 w-3.5" : "h-4 w-4"} aria-hidden />
        )}
        {seguindo ? "Seguindo" : "Seguir"}
      </button>
      {erro && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}
