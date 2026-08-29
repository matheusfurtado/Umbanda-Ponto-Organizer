import { useState } from "react";
import { useLocation } from "wouter";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/auth/AuthContext";
import { apagarConta } from "@/api/conta";
import { mensagemDeErro } from "@/api/cliente";

/**
 * Apagar a conta.
 *
 * Existe porque a LGPD dá o direito de eliminação (art. 18, VI) — e aqui ele
 * pesa mais que o normal: a simples existência da conta revela convicção
 * religiosa. Quem quer sumir precisa poder sumir, e não escrevendo para um
 * suporte que não existe.
 *
 * ## O que a tela precisa dizer
 *
 * A lista do que some vem ANTES do campo de senha, não depois. Quem lê "isto
 * não tem volta" já com a senha digitada lê tarde demais.
 *
 * E diz o que NÃO some, porque é a pergunta que a pessoa faz: os pontos que ela
 * doou ficam no acervo de todo mundo. Some o crédito, não o conteúdo — e quem
 * fica com medo de "levar o acervo junto" acaba não exercendo o direito.
 */
export function ApagarConta({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const { sair } = useAuth();
  const [, navegar] = useLocation();
  const [senha, setSenha] = useState("");
  const [apagando, setApagando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const confirmar = async () => {
    if (!senha || apagando) return;
    setApagando(true);
    setErro(null);
    try {
      await apagarConta(senha);
      // O servidor já apagou o cookie; isto limpa o estado desta aba para a
      // tela não seguir mostrando uma conta que não existe mais.
      await sair().catch(() => undefined);
      navegar("/");
    } catch (problema) {
      setErro(mensagemDeErro(problema, "Não consegui apagar."));
      setApagando(false);
    }
  };

  return (
    <Dialog
      open={aberto}
      onOpenChange={(v) => {
        if (!v) {
          setSenha("");
          setErro(null);
          onFechar();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base text-destructive">
            <AlertTriangle className="h-4 w-4" /> Apagar minha conta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm leading-snug">
          <p className="font-medium text-foreground">Isto não tem volta.</p>
          <p className="text-muted-foreground">
            Some o seu acervo organizado, as suas giras (inclusive as públicas), o seu
            perfil, quem você segue e quem segue você.
          </p>
          <p className="text-muted-foreground">
            <strong className="text-foreground">Os pontos que você enviou ficam</strong>{" "}
            no acervo da comunidade — eles já são de todos. O que sai é o seu nome
            embaixo deles.
          </p>
          <p className="text-muted-foreground">
            O seu nome público fica reservado por um tempo, para ninguém pegá-lo e
            herdar os links da sua casa.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="senha-apagar">Confirme com a sua senha</Label>
          <Input
            id="senha-apagar"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="min-h-11"
          />
        </div>

        {erro && (
          <p role="alert" className="text-sm text-destructive">
            {erro}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onFechar} disabled={apagando}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={confirmar}
            disabled={!senha || apagando}
            className="gap-1.5"
          >
            {apagando && <Loader2 className="h-4 w-4 animate-spin" />}
            Apagar para sempre
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
