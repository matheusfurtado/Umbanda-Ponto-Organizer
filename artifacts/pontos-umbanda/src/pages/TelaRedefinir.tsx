import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { redefinirSenha } from "@/api/conta";
import { ehErroDeApi, ehErroDeRede } from "@/api/cliente";
import { useAuth } from "@/auth/AuthContext";
import { tokenDoLink } from "@/lib/tokenDoLink";

const MINIMO_SENHA = 10;

/**
 * Criar a senha nova, pelo link recebido por e-mail.
 *
 * Redefinir **derruba todas as sessões** do lado do servidor — é assim que quem
 * perdeu a conta expulsa quem a tomou. A tela avisa isso: a pessoa vai ser
 * deslogada nos outros aparelhos, e descobrir depois seria confuso.
 */
export function TelaRedefinir() {
  const [, navegar] = useLocation();
  const { recarregar } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setToken(tokenDoLink());
  }, []);

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || senha.length < MINIMO_SENHA || carregando) return;
    setCarregando(true);
    setErro(null);
    try {
      await redefinirSenha(token, senha);
      // O servidor já abriu uma sessão nova; o contexto precisa saber.
      await recarregar();
      navegar("/");
    } catch (problema) {
      setErro(
        ehErroDeRede(problema)
          ? "Sem conexão. Verifique a internet e tente de novo."
          : ehErroDeApi(problema)
            ? problema.detalhe
            : "Algo deu errado. Tente de novo.",
      );
    } finally {
      setCarregando(false);
    }
  };

  if (token === null) {
    return (
      <div className="flex min-h-screen items-center bg-background">
        <div className="mx-auto max-w-sm px-4 text-center">
          <AlertCircle className="mx-auto mb-4 h-10 w-10 text-destructive" aria-hidden />
          <h1 className="text-xl font-bold text-foreground">Link incompleto</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Abra o link exatamente como veio no e-mail. Se ele estiver quebrado,
            peça um novo.
          </p>
          <Link href="/recuperar">
            <Button className="mt-6 min-h-11 w-full">Pedir outro link</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <form onSubmit={submeter} className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 pb-16">
        <div className="mb-8 text-center">
          <div className="mb-3 text-4xl">🕯️</div>
          <h1 className="text-2xl font-bold text-foreground">Nova senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ao salvar, você sai da conta nos outros aparelhos — é assim que a
            recuperação protege quem perdeu o acesso.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="senha">Senha nova</Label>
            <Input
              id="senha"
              type="password"
              autoComplete="new-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="min-h-11"
            />
            <p className="text-xs text-muted-foreground">
              Pelo menos {MINIMO_SENHA} caracteres. Uma frase que você lembre vale
              mais que uma palavra com símbolos.
            </p>
          </div>

          {erro && (
            <p role="alert" className="text-sm text-destructive">
              {erro}
            </p>
          )}

          <Button
            type="submit"
            disabled={senha.length < MINIMO_SENHA || carregando}
            className="min-h-11 w-full"
          >
            {carregando && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
            Salvar e entrar
          </Button>
        </div>
      </form>
    </div>
  );
}
