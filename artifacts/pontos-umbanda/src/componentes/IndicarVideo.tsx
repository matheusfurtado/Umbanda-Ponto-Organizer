/**
 * "Eu sei o vídeo deste ponto" — de onde a pessoa estiver.
 *
 * ## Por que não só na página "Pontos sem vídeo"
 *
 * Pedido do Matheus em 02/09: *"na playlist dos orixás, caso algum não tenha
 * vídeo, ter uma opção de indicar... ou seja, pra eles não aparecerem só ali"*.
 *
 * Quem sabe o vídeo de um ponto quase nunca chegou por uma página chamada
 * "pontos sem vídeo": chegou procurando o ponto no orixá dele, para cantar. O
 * momento em que a pessoa reconhece a letra é o momento em que ela lembra da
 * gravação — e é ali que o pedido tem de estar.
 *
 * ## O id que vai é o CANÔNICO
 *
 * Quem organiza o acervo tem uma cópia pessoal de cada ponto (ADR 0005), com id
 * próprio prefixado. A rota de indicar só aceita ponto canônico — e quem tem
 * cópia é exatamente quem paga. Mandar `ponto.id` faria a indicação responder
 * 404 justamente para o assinante, e funcionar para quem nunca organizou nada.
 */

import { useState } from "react";
import { Check, Loader2, VideoOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mensagemDeErro } from "@/api/cliente";
import { indicarVideo } from "@/api/semVideo";
import type { Ponto } from "@/types";

/** O canônico, que é o que a rota aceita. Ver o cabeçalho. */
export const idCanonico = (ponto: Ponto) => ponto.origemId ?? ponto.id;

export function IndicarVideo({
  ponto,
  className,
}: {
  ponto: Ponto;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [url, setUrl] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);

  async function enviar() {
    const endereco = url.trim();
    if (!endereco) return;
    setEnviando(true);
    setErro(null);
    try {
      await indicarVideo(idCanonico(ponto), endereco);
      setPronto(true);
      setAberto(false);
    } catch (problema) {
      setErro(mensagemDeErro(problema, "Não consegui agora."));
    } finally {
      setEnviando(false);
    }
  }

  if (pronto) {
    return (
      <span
        title="Indicação enviada — a moderação vai conferir"
        aria-label={`${ponto.titulo}: vídeo indicado, esperando conferência`}
        className={`block rounded-md p-2 text-primary ${className ?? ""}`}
      >
        <Check className="h-4 w-4" aria-hidden />
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        title="Sem vídeo — você sabe qual é?"
        aria-label={`Indicar o vídeo de ${ponto.titulo}`}
        className={`rounded-md p-2 text-muted-foreground/60 transition hover:bg-accent hover:text-foreground ${className ?? ""}`}
      >
        <VideoOff className="h-4 w-4" aria-hidden />
      </button>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Você sabe o vídeo deste ponto?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">{ponto.titulo}</strong> está no
            app sem gravação. Cole o link do YouTube e a moderação confere antes
            de entrar para todo mundo.
          </p>
          <Input
            type="url"
            inputMode="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Cole o link do YouTube"
            aria-label="Endereço do vídeo no YouTube"
          />
          {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
          <Button type="button" onClick={() => void enviar()} disabled={enviando || !url.trim()}>
            {enviando && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
            Indicar
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
