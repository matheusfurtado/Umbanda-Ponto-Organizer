import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/auth/AuthContext";
import { ehErroDeApi, ehErroDeRede } from "@/api/cliente";

type Modo = "entrar" | "criar";

const MINIMO_SENHA = 10;

function traduzir(erro: unknown): string {
  if (ehErroDeRede(erro)) return "Sem conexão. Verifique a internet e tente de novo.";
  if (ehErroDeApi(erro)) {
    if (erro.status === 401) return "E-mail ou senha incorretos.";
    if (erro.status === 409) return "Já existe uma conta com esse e-mail. Tente entrar.";
    if (erro.status === 422) return erro.detalhe;
    // 429: o servidor já manda "Muitas tentativas. Tente de novo em N minutos",
    // com o tempo calculado. Repassar é melhor que inventar texto aqui — e o
    // caso é explícito para uma mudança futura não engolir a mensagem sem
    // querer, deixando a pessoa sem entender por que não consegue entrar.
    if (erro.status === 429) return erro.detalhe;
    if (erro.status >= 500) return "O servidor teve um problema. Tente de novo em instantes.";
    return erro.detalhe;
  }
  return "Algo deu errado. Tente de novo.";
}

export function TelaLogin() {
  const [, navegar] = useLocation();
  const { entrar, cadastrar } = useAuth();
  const [modo, setModo] = useState<Modo>("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [consentiu, setConsentiu] = useState(false);
  const [querComunicacao, setQuerComunicacao] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const criando = modo === "criar";
  const podeEnviar =
    email.trim() !== "" &&
    senha !== "" &&
    (!criando || (senha.length >= MINIMO_SENHA && consentiu));

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeEnviar || carregando) return;
    setCarregando(true);
    setErro(null);
    try {
      if (criando) {
        await cadastrar({
          email: email.trim(),
          senha,
          consinto_dado_religioso: consentiu,
          consinto_comunicacao: querComunicacao,
        });
      } else {
        await entrar(email.trim(), senha);
      }
      navegar("/");
    } catch (problema) {
      setErro(traduzir(problema));
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="max-w-sm w-full mx-auto px-4 pt-8 flex-1 flex flex-col">
        <Link href="/">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 -ml-2 text-muted-foreground self-start"
          >
            {/* A saída fica em primeiro: o app funciona sem conta, e quem chegou
                aqui sem querer precisa poder voltar sem se cadastrar. */}
            <ArrowLeft className="w-4 h-4" /> Continuar sem conta
          </Button>
        </Link>

        <form onSubmit={submeter} className="flex-1 flex flex-col justify-center pb-16">
          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🕯️</div>
            <h1 className="text-2xl font-bold text-foreground">
              {criando ? "Criar conta" : "Entrar"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Guarde seus pontos na nuvem e acesse de qualquer aparelho.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
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

            <div className="space-y-1.5">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                autoComplete={criando ? "new-password" : "current-password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="min-h-11"
              />
              {criando && (
                <p className="text-xs text-muted-foreground">
                  Pelo menos {MINIMO_SENHA} caracteres. Uma frase que você lembre vale mais
                  que uma palavra com símbolos.
                </p>
              )}
            </div>

            {criando && (
              // LGPD: convicção religiosa é dado sensível (art. 5º, II). O
              // consentimento precisa ser específico e destacado — não vale
              // enterrar num "aceito os termos".
              <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
                <label className="flex gap-2.5 text-xs leading-snug cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentiu}
                    onChange={(e) => setConsentiu(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                  />
                  <span className="text-foreground">
                    Entendo que ter uma conta aqui registra que eu uso um app de Umbanda, e
                    que isso é um dado sensível sobre minha religião. Autorizo guardar isso
                    para sincronizar meus pontos.{" "}
                    <strong className="font-medium">Obrigatório para criar conta.</strong>
                  </span>
                </label>

                <label className="flex gap-2.5 text-xs leading-snug cursor-pointer">
                  <input
                    type="checkbox"
                    checked={querComunicacao}
                    onChange={(e) => setQuerComunicacao(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                  />
                  <span className="text-muted-foreground">
                    Quero receber avisos sobre novidades do app. Opcional — recusar não
                    muda nada.
                  </span>
                </label>
              </div>
            )}

            {erro && (
              <p role="alert" className="text-sm text-destructive">
                {erro}
              </p>
            )}

            <Button type="submit" disabled={!podeEnviar || carregando} className="w-full min-h-11">
              {carregando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {criando ? "Criar conta" : "Entrar"}
            </Button>

            <button
              type="button"
              onClick={() => {
                setModo(criando ? "entrar" : "criar");
                setErro(null);
              }}
              className="w-full min-h-11 text-sm text-muted-foreground underline underline-offset-4"
            >
              {criando ? "Já tenho conta" : "Criar uma conta"}
            </button>

            {!criando && (
              // Só em "entrar": oferecer recuperação a quem está criando conta
              // não faz sentido, e ainda sugere que ela já existe.
              <Link href="/recuperar">
                <span className="block min-h-11 w-full py-2 text-center text-sm text-muted-foreground underline underline-offset-4">
                  Esqueci minha senha
                </span>
              </Link>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
