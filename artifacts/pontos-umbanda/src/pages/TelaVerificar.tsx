import { useEffect, useState } from "react";
import { Link } from "wouter";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { confirmarEmail } from "@/api/conta";
import { buscarEntitlements } from "@/lib/apiBilling";
import { boasVindas, type BoasVindas } from "@/billing/boasVindas";
import { ehErroDeApi, ehErroDeRede } from "@/api/cliente";
import { useAuth } from "@/auth/AuthContext";
import { tokenDoLink } from "@/lib/tokenDoLink";

type Estado = "confirmando" | "pronto" | "erro";


/**
 * Confirma a conta pelo link recebido — e é por aqui que se entra.
 *
 * Esta tela faltava, e o buraco era invisível: o e-mail de verificação apontava
 * para `/verificar`, o app não tinha essa rota, e a pessoa caía na tela
 * principal sem nada acontecer. O link parecia funcionar e não fazia nada.
 *
 * Desde 28/08 ela deixou de ser um extra e virou **a porta de entrada**: o
 * cadastro não abre mais sessão (logar já contaria que o e-mail estava livre),
 * então quem acabou de criar conta chega ao app por este link. O servidor abre
 * a sessão ao consumir o token; o `recarregar` abaixo é o que faz o app
 * perceber.
 *
 * Confirma sozinha ao abrir — pedir para a pessoa apertar um botão depois de já
 * ter clicado num link é um passo que não serve a ninguém.
 *
 * ## E não promete teste para quem não ganhou teste
 *
 * `conceder` devolve `None` quando a caixa de entrada já usou o teste — quem
 * apagou a conta e criou outra, ou quem usou `fulano+2@` depois de `fulano@`
 * (o registro é por caixa, não por endereço). A rota responde igual nos dois
 * casos, e a tela dizia "Seus 15 dias de teste começam agora" para todo mundo.
 *
 * A pessoa entrava no plano grátis — sem hierarquia, sem link de vídeo, sem
 * gira — tendo acabado de ler que tinha 15 dias. E como a frase é sobre o que
 * ela vai encontrar, o desmentido chega na primeira tela, sem nada ligando uma
 * coisa à outra: parece defeito, não regra.
 *
 * Então a tela PERGUNTA antes de prometer. Se a resposta não vier, ela não
 * inventa: some com a frase do teste e mantém a confirmação, que é o que esta
 * tela existe para dizer.
 */
export function TelaVerificar() {
  const { recarregar } = useAuth();
  const [estado, setEstado] = useState<Estado>("confirmando");
  const [erro, setErro] = useState<string | null>(null);
  /** O que dizer depois de "Conta confirmada". `null` = ainda não sei, então calo. */
  const [boas, setBoas] = useState<BoasVindas>(null);

  useEffect(() => {
    const token = tokenDoLink();
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
        // DEPOIS de mostrar "pronto", e sem `await` no caminho do sucesso: a
        // confirmação não pode ficar esperando o plano para aparecer.
        try {
          setBoas(boasVindas(await buscarEntitlements()));
        } catch {
          // Fica no `null`: sem resposta, a tela não afirma nada sobre plano.
        }
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
            <h1 className="text-xl font-bold text-foreground">Conta confirmada</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Pronto, você está dentro.
              {boas?.tipo === "teste" &&
                ` Seus ${boas.dias} dias de teste começam agora.`}
            </p>
            {boas?.tipo === "gratis" && (
              <p className="mt-2 text-sm text-muted-foreground">
                O teste de 15 dias já foi usado por esta caixa de entrada, então
                você entra no plano grátis.
              </p>
            )}
            <Link href="/">
              <Button className="mt-6 min-h-11 w-full">Ir para o app</Button>
            </Link>
            {boas?.tipo === "gratis" && (
              <Link href="/planos">
                <Button variant="secondary" className="mt-2 min-h-11 w-full">
                  Ver planos
                </Button>
              </Link>
            )}
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
