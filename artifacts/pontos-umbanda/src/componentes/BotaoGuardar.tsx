/**
 * Guardar um orixá ou uma playlist na estante.
 *
 * ## É o botão de seguir, com outro alvo
 *
 * ADR 0009, palavras dele: *"assim que eu clicar seja em um orixá/playlist e em
 * curtir, ele aparece em organizar acervo, seria uma biblioteca de playlist,
 * algo parecido como o meus artistas, só que com playlist"*.
 *
 * Então ele se comporta como o de seguir artista: alterna, diz o estado em que
 * está, e **não copia nada**. O conteúdo continua onde estava — é uma linha
 * ligando a pessoa ao que ela quis ter à mão.
 *
 * ## Sem conta ele não aparece
 *
 * Estante é de quem tem onde guardar. Oferecer o botão e mandar para o login
 * depois do clique seria pedir duas vezes — a mesma escolha do indicar vídeo.
 */

import { useEffect, useState } from "react";
import { BookmarkCheck, BookmarkPlus, Loader2 } from "lucide-react";
import { mensagemDeErro } from "@/api/cliente";
import { useAuth } from "@/auth/AuthContext";
import {
  guardarNaBiblioteca, minhaBiblioteca, tirarDaBiblioteca,
  type AlvoGuardado,
} from "@/api/biblioteca";

export function BotaoGuardar({
  alvoTipo,
  alvoId,
  nome,
  className,
}: {
  alvoTipo: AlvoGuardado;
  alvoId: string;
  /** Para o rótulo acessível dizer O QUE se está guardando. */
  nome: string;
  className?: string;
}) {
  const { autenticado } = useAuth();
  const [guardado, setGuardado] = useState<boolean | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!autenticado) return;
    minhaBiblioteca()
      .then((itens) =>
        setGuardado(itens.some((i) => i.alvoTipo === alvoTipo && i.alvoId === alvoId)),
      )
      .catch(() => setGuardado(false));
  }, [autenticado, alvoTipo, alvoId]);

  if (!autenticado) return null;

  async function alternar() {
    setOcupado(true);
    setErro(null);
    try {
      if (guardado) {
        await tirarDaBiblioteca(alvoTipo, alvoId);
        setGuardado(false);
      } else {
        await guardarNaBiblioteca(alvoTipo, alvoId);
        setGuardado(true);
      }
    } catch (problema) {
      setErro(mensagemDeErro(problema, "Não consegui agora."));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void alternar()}
        // `disabled` enquanto não sabe: um botão que diz "Guardar" antes de
        // saber que já está guardado faz a pessoa clicar e ver o rótulo virar
        // "Guardado" sem nada ter mudado.
        disabled={ocupado || guardado === null}
        aria-pressed={guardado === true}
        aria-label={
          guardado ? `Tirar ${nome} da biblioteca` : `Guardar ${nome} na biblioteca`
        }
        className={`inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-medium disabled:opacity-60 ${
          guardado
            ? "bg-primary text-primary-foreground"
            : "border text-foreground"
        } ${className ?? ""}`}
      >
        {ocupado ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : guardado ? (
          <BookmarkCheck className="h-4 w-4" aria-hidden />
        ) : (
          <BookmarkPlus className="h-4 w-4" aria-hidden />
        )}
        {guardado ? "Guardado" : "Guardar"}
      </button>
      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
    </>
  );
}
