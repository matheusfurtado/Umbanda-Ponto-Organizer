import { useEffect, useState } from "react";
import { Check, Loader2, UserPen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sugerirAutor } from "@/api/comunidade";
import type { Ponto } from "@/types";
import { mensagemDeErro } from "@/api/cliente";

/**
 * Dizer quem compôs um ponto do acervo.
 *
 * A sugestão **não muda o ponto na hora** — vai para revisão. A tela diz isso
 * antes de a pessoa enviar, porque a expectativa contrária é razoável: em quase
 * todo app, o que você escreve aparece.
 *
 * O motivo é sério: autoria de obra religiosa atribuída errado circula e vira
 * referência. Não é erro que se conserta depois.
 */
export function SugerirAutor({ ponto, onFechar }: { ponto: Ponto | null; onFechar: () => void }) {
  const [autor, setAutor] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    setAutor(ponto?.autor ?? "");
    setErro(null);
    setPronto(false);
  }, [ponto]);

  /**
   * Fechar por qualquer caminho devolve o campo ao autor que o ponto já tem.
   *
   * O `useEffect` acima reseta quando o PONTO muda. Reabrir o MESMO ponto não
   * dispara efeito nenhum — e aí o nome que a pessoa digitou e descartou
   * continua lá, com o botão aceso.
   *
   * Aqui isso é sério pelo motivo que o docstring já dá: "autoria de obra
   * religiosa atribuída errado circula e vira referência. Não é erro que se
   * conserta depois." Um toque manda para revisão um nome que a pessoa tinha
   * decidido não sugerir.
   *
   * Ver `dialogo-limpa-ao-fechar.test.ts`: é o quinto diálogo com esta falha.
   */
  const fechar = () => {
    setAutor(ponto?.autor ?? "");
    setErro(null);
    onFechar();
  };

  if (!ponto) return null;

  const enviar = async () => {
    if (!autor.trim()) return;
    setEnviando(true);
    setErro(null);
    try {
      await sugerirAutor(ponto.id, autor.trim());
      setPronto(true);
      setTimeout(fechar, 1200);
    } catch (problema) {
      setErro(mensagemDeErro(problema, "Não consegui enviar."));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && fechar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Quem compôs este ponto?</DialogTitle>
        </DialogHeader>

        <p className="-mt-1 truncate text-sm text-muted-foreground">{ponto.titulo}</p>

        <Input
          value={autor}
          onChange={(e) => setAutor(e.target.value)}
          placeholder="Nome de quem compôs"
          aria-label="Autor"
          disabled={pronto}
        />

        <p className="text-xs leading-snug text-muted-foreground">
          Sua sugestão passa por revisão antes de aparecer para todo mundo. A
          maior parte do acervo é de tradição oral e não tem autoria conhecida —
          se não tiver certeza, é melhor não indicar.
        </p>

        {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}

        <Button onClick={enviar} disabled={enviando || pronto || !autor.trim()} className="w-full">
          {enviando ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
          ) : pronto ? (
            <><Check className="mr-2 h-4 w-4" /> Enviado para revisão</>
          ) : (
            <><UserPen className="mr-2 h-4 w-4" /> Sugerir autor</>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
