import { useState } from "react";
import { Link } from "wouter";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/auth/AuthContext";
import { mensagemDeErro } from "@/api/cliente";
import { sugerirArtista } from "@/api/sugestaoArtista";

/**
 * "Falta fulano aqui."
 *
 * O acervo de artistas nasce do casamento automático com o YouTube: só entra
 * quem já tem pontos casados. Isso deixa de fora justamente o canal pequeno —
 * e quem conhece o canal pequeno é a comunidade, não o cron.
 *
 * ## A sugestão NÃO publica
 *
 * Ela vira fila, e um moderador decide. Publicar alguém como "de Umbanda" sem
 * essa pessoa ter pedido é exatamente o que o pedido de remoção existe para
 * desfazer — e o que se desfaz não apaga o que já foi visto. A tela diz isso
 * antes de a pessoa mandar, para a expectativa não ser "vai aparecer agora".
 *
 * ## Só o nome é obrigatório
 *
 * Quem lembra do canal nem sempre tem o link à mão. Exigir o endereço faria
 * perder a sugestão de quem sabe de quem está falando — e quem modera procura
 * pelo nome.
 */
export function SugerirArtista() {
  const { autenticado } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [url, setUrl] = useState("");
  const [recado, setRecado] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);

  /** Fechar devolve o diálogo ao começo — inclusive o "pronto" da vez anterior. */
  function fechar() {
    setAberto(false);
    setNome("");
    setUrl("");
    setRecado("");
    setErro(null);
    setPronto(false);
    setEnviando(false);
  }

  async function enviar() {
    if (!nome.trim()) return;
    setEnviando(true);
    setErro(null);
    try {
      await sugerirArtista({
        nomeDoCanal: nome.trim(),
        canalUrl: url.trim() || null,
        recado: recado.trim() || null,
      });
      setPronto(true);
    } catch (problema) {
      setErro(mensagemDeErro(problema, "Não consegui enviar agora."));
    } finally {
      setEnviando(false);
    }
  }

  // Sem conta não há para onde responder nem freio de spam. E o convite fica na
  // tela de propósito: é vendo o que ele oferece que alguém decide entrar.
  if (!autenticado) {
    return (
      <p className="mt-8 rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        Está faltando algum canal aqui?{" "}
        <Link href="/login?motivo=sugerir-artista" className="font-medium text-primary underline">
          Entre
        </Link>{" "}
        para sugerir.
      </p>
    );
  }

  return (
    <>
      <div className="mt-8 rounded-xl border border-dashed p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Está faltando algum canal aqui?
        </p>
        <Button variant="outline" className="mt-3" onClick={() => setAberto(true)}>
          <Plus className="mr-1.5 h-4 w-4" aria-hidden />
          Sugerir um artista
        </Button>
      </div>

      <Dialog open={aberto} onOpenChange={(v) => !v && fechar()}>
        <DialogContent className="mx-4 max-w-md border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Sugerir um artista</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              A sugestão vai para quem cuida do acervo. Ela <b>não publica a
              página sozinha</b> — alguém confere o canal antes.
            </DialogDescription>
          </DialogHeader>

          {pronto ? (
            <div className="space-y-2 text-sm">
              <p className="font-medium text-foreground">Recebi, obrigado.</p>
              <p className="text-muted-foreground">
                Sua sugestão está na fila. Quando ela for revisada, você vê o que
                aconteceu — inclusive o motivo, se não der.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="sug-nome" className="mb-1 block text-sm text-muted-foreground">
                  Nome do canal
                </Label>
                <Input
                  id="sug-nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Como o canal se chama no YouTube"
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="sug-url" className="mb-1 block text-sm text-muted-foreground">
                  Endereço <span className="text-xs">(se você tiver à mão)</span>
                </Label>
                <Input
                  id="sug-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtube.com/@..."
                />
              </div>
              <div>
                <Label htmlFor="sug-recado" className="mb-1 block text-sm text-muted-foreground">
                  Por que este canal <span className="text-xs">(opcional)</span>
                </Label>
                <Textarea
                  id="sug-recado"
                  value={recado}
                  onChange={(e) => setRecado(e.target.value)}
                  rows={3}
                  placeholder="Canta os pontos da minha casa há anos…"
                />
              </div>
              {erro && (
                <p role="alert" className="text-sm text-destructive">
                  {erro}
                </p>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {pronto ? (
              <Button onClick={fechar}>Pronto</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={fechar}>Cancelar</Button>
                <Button onClick={() => void enviar()} disabled={enviando || !nome.trim()}>
                  {enviando && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />}
                  {enviando ? "Enviando…" : "Enviar sugestão"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
