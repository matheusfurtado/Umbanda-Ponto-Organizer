import { useState } from "react";
import { Loader2, UserPen } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/auth/AuthContext";
import { escolherApelido } from "@/api/conta";

const MINIMO = 2;
const MAXIMO = 40;

/**
 * Trocar o nome público.
 *
 * Um lugar só, usado da tela de conta e do próprio perfil — a regra de como
 * alguém aparece para outras pessoas não pode divergir entre duas telas.
 *
 * ## O que a tela precisa dizer antes, não depois
 *
 * O apelido **é a URL do perfil**. Trocar move a página: o link que a pessoa
 * colou no grupo do terreiro para de abrir. Quem descobre isso depois já
 * perdeu o link.
 *
 * E o nome antigo **fica reservado por um tempo** — não some para outra casa
 * pegar e herdar o tráfego. Isso é bom e a pessoa precisa saber, porque é
 * exatamente a pergunta que ela faz ao hesitar.
 */
export function TrocarApelido({
  aberto,
  onFechar,
}: {
  aberto: boolean;
  onFechar: (novo?: string) => void;
}) {
  const { user, recarregar } = useAuth();
  const atual = user?.apelido ?? "";
  const [nome, setNome] = useState(atual);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const limpo = nome.trim();
  const primeiraVez = !atual;
  const mudou = limpo.toLowerCase() !== atual.trim().toLowerCase();
  const podeSalvar = limpo.length >= MINIMO && limpo.length <= MAXIMO && !salvando;

  const salvar = async () => {
    if (!podeSalvar) return;
    setSalvando(true);
    setErro(null);
    try {
      await escolherApelido(limpo);
      await recarregar();
      onFechar(limpo);
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : "Não consegui salvar.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        if (!v) {
          setNome(atual);
          setErro(null);
          onFechar();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <UserPen className="h-4 w-4" />
            {primeiraVez ? "Escolher como você aparece" : "Trocar como você aparece"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="apelido-novo">Nome público</Label>
          <Input
            id="apelido-novo"
            value={nome}
            autoComplete="nickname"
            maxLength={MAXIMO}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Terreiro de Ogum Beira-Mar"
            className="min-h-11"
          />
          <p className="text-xs text-muted-foreground">
            Aparece no seu perfil, nas giras que você publica e embaixo dos pontos que
            você envia. Pode ser o nome do terreiro — não precisa ser o seu. Entre{" "}
            {MINIMO} e {MAXIMO} caracteres.
          </p>
        </div>

        {/* Só quando muda de verdade: avisar sobre trocar de nome a quem está
            escolhendo o primeiro é assustar sem motivo. */}
        {!primeiraVez && mudou && (
          <div className="space-y-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs leading-snug text-muted-foreground">
            <p>
              O endereço do seu perfil muda de{" "}
              <code className="text-foreground">/perfil/{atual}</code> para{" "}
              <code className="text-foreground">/perfil/{limpo || "…"}</code>.{" "}
              <strong className="text-foreground">
                Links antigos param de abrir.
              </strong>
            </p>
            <p>
              O nome antigo fica reservado para você por um tempo — ninguém pode
              pegá-lo e herdar os seus links.
            </p>
          </div>
        )}

        {erro && (
          <p role="alert" className="text-sm text-destructive">
            {erro}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={() => onFechar()} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={salvar} disabled={!podeSalvar} className="gap-1.5">
            {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
            {primeiraVez ? "Escolher" : "Trocar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
