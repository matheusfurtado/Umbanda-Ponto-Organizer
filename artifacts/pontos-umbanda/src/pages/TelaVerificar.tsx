import { useEffect, useState } from "react";
import { Link } from "wouter";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmarEmail } from "@/api/conta";
import { ehErroDeApi, ehErroDeRede } from "@/api/cliente";
import { useAuth } from "@/auth/AuthContext";

type Estado = "confirmando" | "pronto" | "erro";

/**
 * Confirma o e-mail pelo link recebido.
 *
 * Esta tela faltava, e o buraco era invisível: o e-mail de verificação apontava
 * para `/verificar`, o app não tinha essa rota, e a pessoa caía na tela
 * principal sem nada acontecer. O link parecia funcionar e não fazia nada.
 *
 * Confirma sozinha ao abrir — pedir para a pessoa apertar um botão depois de já
 * ter clicado num link é um passo que não serve a ninguém.
 */
export function TelaVerificar() {
  const { recarregar } = useAuth();
  const [estado, setEstado] = useState<Estado>("confirmando");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setEstado("erro");
      setErro("Abra o link exatamente como veio no e-mail.");
      return;
    }
    void (async () => {
      try {
        await confirmarEmail(token);
        // A sessão pode estar aberta noutro aparelho; se estiver neste, o
        // contexto precisa saber que o e-mail agora está verificado.
        await recarregar();
        setEstado("pronto");
      } catch (problema) {
        setEstado("erro");
        setErro(
          ehErroDeRede(problema)
            ? "Sem conexão. Verifique a internet e abra o link de novo."
            : ehErroDeApi(problema)
              ? problema.detalhe
              : "Algo deu errado. Peça um link novo.",
        );
      }
    })();
  }, [recarregar]);

  return (
    <div className="flex min-h-screen items-center bg-background">
      <div className="mx-auto max-w-sm px-4 text-center">
        {estado === "confirmando" && (
          <>
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-muted-foreground" aria-hidden />
            <p className="text-sm text-muted-foreground">Confirmando…</p>
          </>
        )}

        {estado === "pronto" && (
          <>
            <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-primary" aria-hidden />
            <h1 className="text-xl font-bold text-foreground">E-mail confirmado</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Pronto. Isso ajuda a recuperar sua conta se você esquecer a senha.
            </p>
            <Link href="/">
              <Button className="mt-6 min-h-11 w-full">Ir para o app</Button>
            </Link>
          </>
        )}

        {estado === "erro" && (
          <>
            <AlertCircle className="mx-auto mb-4 h-10 w-10 text-destructive" aria-hidden />
            <h1 className="text-xl font-bold text-foreground">Não deu para confirmar</h1>
            <p className="mt-2 text-sm text-muted-foreground">{erro}</p>
            {/* O caminho de saída é a conta, onde dá para pedir outro link. */}
            <Link href="/conta">
              <Button variant="secondary" className="mt-6 min-h-11 w-full">
                Ir para minha conta
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
