import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pedirRecuperacao } from "@/api/conta";
import { ehErroDeRede } from "@/api/cliente";

/**
 * Pedir o link de redefinição.
 *
 * A tela **nunca diz se o e-mail existe**. A resposta é a mesma nos dois casos,
 * porque o contrário transformaria isto num verificador de quem tem conta num
 * app de Umbanda — o mesmo motivo pelo qual o login não diferencia "e-mail não
 * existe" de "senha errada".
 */
export function TelaRecuperar() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || carregando) return;
    setCarregando(true);
    setErro(null);
    try {
      await pedirRecuperacao(email.trim());
      setEnviado(true);
    } catch (problema) {
      // Só falha de rede aparece: o servidor responde igual para e-mail que
      // existe e que não existe, então não há outro erro a mostrar.
      setErro(
        ehErroDeRede(problema)
          ? "Sem conexão. Verifique a internet e tente de novo."
          : "Algo deu errado. Tente de novo em instantes.",
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col px-4 pt-8">
        <Link href="/login">
          <Button variant="ghost" size="sm" className="-ml-2 gap-1.5 self-start text-muted-foreground">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar
          </Button>
        </Link>

        {enviado ? (
          <div className="flex flex-1 flex-col justify-center pb-16 text-center">
            <MailCheck className="mx-auto mb-4 h-10 w-10 text-primary" aria-hidden />
            <h1 className="text-xl font-bold text-foreground">Confira seu e-mail</h1>
            {/* "Se existir uma conta": a frase é deliberada. Confirmar que existe
                contaria a quem só quer saber se a pessoa usa o app. */}
            <p className="mt-2 text-sm text-muted-foreground">
              Se existir uma conta com <strong className="text-foreground">{email.trim()}</strong>,
              enviamos um link para redefinir a senha. Ele vale por 1 hora e só
              funciona uma vez.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              Não chegou? Veja o spam, ou peça de novo em alguns minutos.
            </p>
            <Link href="/login">
              <Button variant="secondary" className="mt-6 min-h-11 w-full">
                Voltar para entrar
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={submeter} className="flex flex-1 flex-col justify-center pb-16">
            <div className="mb-8 text-center">
              <div className="mb-3 text-4xl">🕯️</div>
              <h1 className="text-2xl font-bold text-foreground">Esqueci minha senha</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enviamos um link para você criar uma nova.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail da conta</Label>
                <Input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@exemplo.com"
                  className="min-h-11"
                />
              </div>

              {erro && (
                <p role="alert" className="text-sm text-destructive">
                  {erro}
                </p>
              )}

              <Button
                type="submit"
                disabled={!email.trim() || carregando}
                className="min-h-11 w-full"
              >
                {carregando && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
                Enviar link
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
