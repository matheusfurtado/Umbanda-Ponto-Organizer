import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/authClient";

type Modo = "entrar" | "criar" | "otp";

function traduzirErro(msg?: string): string {
  if (!msg) return "Algo deu errado. Tente de novo.";
  const m = msg.toLowerCase();
  if (m.includes("invalid") && m.includes("password")) return "E-mail ou senha incorretos.";
  if (m.includes("credential")) return "E-mail ou senha incorretos.";
  if (m.includes("exist")) return "Já existe uma conta com esse e-mail. Tente entrar.";
  if (m.includes("otp") || m.includes("code")) return "Código inválido ou expirado.";
  if (m.includes("password")) return "Senha muito curta (mínimo 8 caracteres).";
  return msg;
}

export function TelaLogin() {
  const [, navegar] = useLocation();
  const [modo, setModo] = useState<Modo>("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [otp, setOtp] = useState("");
  const [otpEnviado, setOtpEnviado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const concluir = () => navegar("/");

  const submeterSenha = async () => {
    if (!email || !senha) return;
    setCarregando(true);
    setErro(null);
    const res =
      modo === "criar"
        ? await authClient.signUp.email({ email, password: senha, name: nome.trim() || email.split("@")[0] })
        : await authClient.signIn.email({ email, password: senha });
    setCarregando(false);
    if (res.error) setErro(traduzirErro(res.error.message));
    else concluir();
  };

  const enviarOtp = async () => {
    if (!email) return;
    setCarregando(true);
    setErro(null);
    const res = await authClient.emailOtp.sendVerificationOtp({ email, type: "sign-in" });
    setCarregando(false);
    if (res.error) setErro(traduzirErro(res.error.message));
    else setOtpEnviado(true);
  };

  const entrarComOtp = async () => {
    if (!otp) return;
    setCarregando(true);
    setErro(null);
    const res = await authClient.signIn.emailOtp({ email, otp });
    setCarregando(false);
    if (res.error) setErro(traduzirErro(res.error.message));
    else concluir();
  };

  const entrarGoogle = () => {
    void authClient.signIn.social({ provider: "google", callbackURL: window.location.origin });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="max-w-sm w-full mx-auto px-4 pt-8 flex-1 flex flex-col">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 text-muted-foreground self-start">
            <ArrowLeft className="w-4 h-4" /> Continuar sem conta
          </Button>
        </Link>

        <div className="flex-1 flex flex-col justify-center pb-16">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🕯️</div>
            <h1 className="text-2xl font-bold text-foreground">
              {modo === "criar" ? "Criar conta" : "Entrar"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Guarde seus pontos na nuvem e acesse de qualquer aparelho.
            </p>
          </div>

          {modo === "otp" ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="email" className="text-muted-foreground text-sm mb-1 block">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@exemplo.com"
                  className="bg-card border-border"
                  disabled={otpEnviado}
                  autoFocus
                />
              </div>
              {otpEnviado && (
                <div>
                  <Label htmlFor="otp" className="text-muted-foreground text-sm mb-1 block">
                    Código enviado por e-mail
                  </Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="000000"
                    className="bg-card border-border tracking-widest text-center text-lg"
                    onKeyDown={(e) => e.key === "Enter" && entrarComOtp()}
                    autoFocus
                  />
                </div>
              )}
              {erro && <p className="text-sm text-destructive text-center">{erro}</p>}
              <Button
                className="w-full"
                disabled={carregando}
                onClick={otpEnviado ? entrarComOtp : enviarOtp}
              >
                {carregando ? "Aguarde..." : otpEnviado ? "Entrar" : "Enviar código"}
              </Button>
              <button
                className="w-full text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setModo("entrar");
                  setOtpEnviado(false);
                  setErro(null);
                }}
              >
                Usar e-mail e senha
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {modo === "criar" && (
                <div>
                  <Label htmlFor="nome" className="text-muted-foreground text-sm mb-1 block">
                    Nome
                  </Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Como quer ser chamado"
                    className="bg-card border-border"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="email" className="text-muted-foreground text-sm mb-1 block">
                  E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@exemplo.com"
                  className="bg-card border-border"
                />
              </div>
              <div>
                <Label htmlFor="senha" className="text-muted-foreground text-sm mb-1 block">
                  Senha
                </Label>
                <Input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="bg-card border-border"
                  onKeyDown={(e) => e.key === "Enter" && submeterSenha()}
                />
              </div>
              {erro && <p className="text-sm text-destructive text-center">{erro}</p>}
              <Button className="w-full" disabled={carregando} onClick={submeterSenha}>
                {carregando ? "Aguarde..." : modo === "criar" ? "Criar conta" : "Entrar"}
              </Button>
            </div>
          )}

          {modo !== "otp" && (
            <>
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">ou</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="space-y-2">
                <Button variant="outline" className="w-full gap-2" onClick={entrarGoogle}>
                  <GoogleIcon /> Continuar com Google
                </Button>
                <Button
                  variant="ghost"
                  className="w-full gap-2 text-muted-foreground"
                  onClick={() => {
                    setModo("otp");
                    setErro(null);
                  }}
                >
                  <Mail className="w-4 h-4" /> Entrar com código por e-mail
                </Button>
              </div>
            </>
          )}

          <p className="text-center text-sm text-muted-foreground mt-6">
            {modo === "criar" ? "Já tem conta? " : "Ainda não tem conta? "}
            <button
              className="text-primary font-medium hover:underline"
              onClick={() => {
                setModo(modo === "criar" ? "entrar" : "criar");
                setErro(null);
              }}
            >
              {modo === "criar" ? "Entrar" : "Criar conta"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
