import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Check, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthContext";
import { useEntitlements } from "@/billing/EntitlementsContext";
import {
  lerPagamentoPendente,
  limparPagamentoPendente,
} from "@/billing/pagamentoPendente";
import { buscarEntitlements } from "@/lib/apiBilling";

/**
 * Para onde o Mercado Pago devolve quem acabou de pagar.
 *
 * ## Por que esta tela existe
 *
 * O pagamento não libera nada na hora: quem libera é o webhook, que chega ao
 * servidor por fora e pode demorar. Sem esta tela, quem pagou voltava direto
 * para o app — e o app, corretamente, ainda dizia que ela não tem plano.
 * Alguém que acabou de ser cobrado lendo "você não tem plano" conclui que
 * perdeu o dinheiro. É o pior momento possível para uma ambiguidade.
 *
 * ## O que esta tela nunca faz
 *
 * **Não diz que o pagamento falhou.** Não temos essa informação: só sabemos se
 * o acesso já virou ou ainda não. Dizer "falhou" para quem foi cobrado é o erro
 * mais caro que esta tela poderia cometer — em confiança e em estorno.
 *
 * **Não acredita no que vem na URL.** O Mercado Pago devolve parâmetros de
 * status no endereço, e eles são só um enfeite: quem decide o acesso é o nosso
 * servidor, com base no webhook que ele mesmo conferiu. Liberar por parâmetro
 * de URL daria plano de graça a quem digitasse o endereço à mão.
 */

// Perto de um minuto: cobre a demora comum do webhook sem deixar ninguém preso
// num relógio girando. Passou disso, a tela assume e explica.
const ATE_MS = 60_000;
const INTERVALO_MS = 2_500;

export function TelaRetornoPagamento() {
  const { autenticado, isPending } = useAuth();
  const { refetch } = useEntitlements();
  const [confirmado, setConfirmado] = useState(false);
  const [desistiu, setDesistiu] = useState(false);
  const [conferindo, setConferindo] = useState(true);
  const esperado = useRef(lerPagamentoPendente());

  const conferir = useCallback(async (): Promise<boolean> => {
    try {
      const atual = await buscarEntitlements();
      // Durante o teste `plano` vale "teste" e os direitos já são os do pago.
      // Por isso a confirmação é "virou o plano que ela foi comprar" — e não
      // "tem algum plano", que seria verdade antes mesmo de pagar.
      const virou = esperado.current
        ? atual.plano === esperado.current
        : atual.plano !== "gratis" && atual.plano !== "teste";
      if (virou) {
        limparPagamentoPendente();
        setConfirmado(true);
        refetch();
      }
      return virou;
    } catch {
      // Rede oscilando não é resposta: continua tentando até o prazo.
      return false;
    }
  }, [refetch]);

  useEffect(() => {
    if (isPending || !autenticado) return;
    let vivo = true;
    const limite = Date.now() + ATE_MS;

    const rodar = async () => {
      while (vivo && Date.now() < limite) {
        if (await conferir()) {
          if (vivo) setConferindo(false);
          return;
        }
        await new Promise((r) => setTimeout(r, INTERVALO_MS));
      }
      if (vivo) {
        setConferindo(false);
        setDesistiu(true);
      }
    };
    void rodar();
    return () => {
      vivo = false;
    };
  }, [isPending, autenticado, conferir]);

  const reconferir = async () => {
    setConferindo(true);
    setDesistiu(false);
    if (!(await conferir())) setDesistiu(true);
    setConferindo(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-md flex-col items-center px-4 pt-20 text-center">
        {confirmado ? (
          <>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-7 w-7 text-primary" aria-hidden />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Tudo certo</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Seu plano está ativo. O acervo já aparece organizado por orixá,
              com o vídeo de cada ponto, e funciona offline.
            </p>
            <Link href="/">
              <Button className="mt-8 w-full">Ir para o acervo</Button>
            </Link>
          </>
        ) : conferindo ? (
          <>
            <Loader2 className="mb-5 h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
            <h1 className="text-2xl font-bold text-foreground">
              Confirmando seu pagamento
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Isso costuma levar alguns segundos. Pode deixar esta tela aberta.
            </p>
          </>
        ) : (
          <>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Clock className="h-7 w-7 text-muted-foreground" aria-hidden />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Está demorando um pouco mais
            </h1>
            {/* Nada aqui afirma que falhou: a tela não sabe disso, e dizer a
                quem foi cobrado que falhou é o pior erro possível. */}
            <p className="mt-2 text-sm text-muted-foreground">
              Se o pagamento foi concluído, seu acesso libera sozinho assim que
              a confirmação chegar — não precisa pagar de novo. Pode fechar esta
              tela; o app já vai estar liberado quando você voltar.
            </p>
            <Button onClick={reconferir} variant="outline" className="mt-8 w-full">
              Conferir de novo
            </Button>
            <Link href="/">
              <Button variant="ghost" className="mt-2 w-full text-muted-foreground">
                Voltar ao app
              </Button>
            </Link>
          </>
        )}

        {desistiu && (
          <p className="mt-6 text-xs text-muted-foreground">
            Continua assim depois de alguns minutos? Fale com a gente — e tenha
            em mãos o comprovante do Mercado Pago.
          </p>
        )}
      </div>
    </div>
  );
}
