import { useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
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
    // 409 agora tem DOIS motivos: e-mail repetido e apelido repetido. O
    // servidor manda qual dos dois; escrever "esse e-mail já existe" aqui
    // mandaria a pessoa mexer no campo errado.
    if (erro.status === 409) return erro.detalhe;
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
  /**
   * Por que a pessoa foi parar aqui.
   *
   * A estrela dos pontos manda para cá quem ainda não entrou. Chegar numa tela
   * de login sem uma palavra sobre o que aconteceu é o beco que a estrela
   * existia para não ser: ela toca a estrela, a tela troca, e nada explica.
   *
   * Só um motivo por enquanto, e é de propósito — cada frase aqui é uma
   * promessa sobre o que a conta faz, e promessa genérica não ajuda ninguém.
   */
  const motivo = new URLSearchParams(useSearch()).get("motivo");
  const { entrar, cadastrar } = useAuth();
  const [modo, setModo] = useState<Modo>("entrar");
  const [email, setEmail] = useState("");
  const [apelido, setApelido] = useState("");
  const [senha, setSenha] = useState("");
  const [consentiu, setConsentiu] = useState(false);
  const [querComunicacao, setQuerComunicacao] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  /**
   * O recado do servidor depois de criar a conta.
   *
   * Quando existe, a tela troca o formulário por ele. Não é um "sucesso"
   * decorativo: é a única coisa que a pessoa recebe, porque o cadastro deixou
   * de logar — e a resposta é a mesma para e-mail livre e para e-mail que já
   * tem conta, de propósito.
   */
  const [conferirCaixa, setConferirCaixa] = useState<string | null>(null);

  const criando = modo === "criar";
  const podeEnviar =
    email.trim() !== "" &&
    senha !== "" &&
    (!criando || (senha.length >= MINIMO_SENHA && consentiu && apelido.trim().length >= 2));

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!podeEnviar || carregando) return;
    setCarregando(true);
    setErro(null);
    try {
      if (criando) {
        const recado = await cadastrar({
          email: email.trim(),
          apelido: apelido.trim(),
          senha,
          consinto_dado_religioso: consentiu,
          consinto_comunicacao: querComunicacao,
        });
        // Nada de `navegar("/")` aqui: não há sessão para levar a lugar
        // nenhum. Mandar para a tela principal faria parecer que deu errado.
        setConferirCaixa(recado);
        return;
      }
      await entrar(email.trim(), senha);
      navegar("/");
    } catch (problema) {
      setErro(traduzir(problema));
    } finally {
      setCarregando(false);
    }
  };

  if (conferirCaixa !== null) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="max-w-sm w-full mx-auto px-4 pt-8 flex-1 flex flex-col justify-center pb-16 text-center">
          <div className="text-4xl mb-3">📬</div>
          <h1 className="text-2xl font-bold text-foreground">Confira seu e-mail</h1>
          <p className="text-muted-foreground text-sm mt-2">{conferirCaixa}</p>
          <p className="text-muted-foreground text-xs mt-4">
            O link vale por 24 horas. Se não chegar, veja também a caixa de spam.
          </p>
          {/* A saída continua existindo: o app funciona sem conta. */}
          <Link href="/">
            <Button variant="secondary" className="mt-8 min-h-11 w-full">
              Continuar sem conta
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
              {motivo === "favoritos"
                ? "Seus favoritos ficam na conta — assim eles seguem com você quando trocar de aparelho."
                : motivo === "seguir-artista"
                  ? "Seguir um artista põe ele na sua biblioteca — e traz ele para a frente da lista de todo mundo."
                  : motivo === "sugerir-artista"
                    ? "Sugestões vêm de uma conta — é por ela que a gente responde o que aconteceu com a sua."
                    : "Guarde seus pontos na nuvem e acesse de qualquer aparelho."}
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

            {criando && (
              <div className="space-y-1.5">
                <Label htmlFor="apelido">Como você quer aparecer</Label>
                <Input
                  id="apelido"
                  autoComplete="nickname"
                  value={apelido}
                  onChange={(e) => setApelido(e.target.value)}
                  placeholder="Terreiro de Ogum Beira-Mar"
                  className="min-h-11"
                />
                {/* O aviso fica AQUI, colado no campo, e não no rodapé.
                    Este nome vai a público embaixo de todo ponto que a pessoa
                    mandar e de toda playlist que publicar — junto, portanto, da
                    informação de que ela é de Umbanda. Quem lê "nome" e escreve
                    o nome civil sem saber disso não consentiu com o que
                    aconteceu; e nome publicado não se despublica. */}
                <p className="text-xs text-muted-foreground">
                  Aparece publicamente quando você envia um ponto ou publica uma playlist.
                  Pode ser o nome do terreiro — não precisa ser o seu.
                </p>
              </div>
            )}

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
                  {/* O TEXTO NOMEIA AS DUAS FINALIDADES, e antes nomeava uma.
                      
                      Ele dizia só "autorizo guardar isso para sincronizar meus
                      pontos" — e o app faz mais que sincronizar: quando a
                      pessoa manda um ponto, publica uma playlist ou abre o perfil,
                      o apelido dela aparece para qualquer um, ligado a
                      conteúdo de Umbanda. Publicar é sempre escolha dela, mas
                      a autorização precisa dizer que existe essa
                      possibilidade; a LGPD (art. 9º) pede finalidade
                      específica, e "sincronizar" não cobre "publicar".
                      
                      O que não cabe aqui está na Política, cujo link fica logo
                      abaixo — no lugar onde a decisão é tomada. */}
                  <span className="text-foreground">
                    Entendo que ter uma conta aqui registra que eu uso um app de Umbanda, e
                    que isso é um dado sensível sobre minha religião. Autorizo guardar isso
                    para <strong className="font-medium">sincronizar meus pontos</strong> e,
                    quando eu escolher publicar alguma coisa — mandar um ponto, publicar
                    uma playlist, abrir meu perfil —, para{" "}
                    <strong className="font-medium">mostrar meu apelido junto</strong>.{" "}
                    <strong className="font-medium">Obrigatório para criar conta.</strong>
                  </span>
                </label>

                {/* O LINK MORA AQUI, e não num rodapé.
                    
                    A LGPD (art. 9º) obriga a informar finalidade, controlador,
                    duração e os direitos do titular — e a caixa de consentimento
                    não cabe tudo isso. O lugar de a informação estar alcançável
                    é onde o consentimento é DADO; um link no rodapé de outra
                    tela é informação que ninguém encontra na hora de decidir. */}
                <p className="text-xs text-muted-foreground">
                  Antes de decidir, leia a{" "}
                  <Link href="/privacidade" className="text-primary underline">
                    Política de Privacidade
                  </Link>{" "}
                  e os{" "}
                  <Link href="/termos" className="text-primary underline">
                    Termos de Uso
                  </Link>
                  .
                </p>

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

            {/*
              É um LINK, e não um `fetch`.

              O fluxo do Google é uma ida ao site dele e uma volta com cookie —
              coisa que o navegador faz e `fetch` não. Tentar por XHR esbarra em
              CORS e no bloqueio de janela, e o jeito de contornar seria abrir
              popup, que celular trata mal.

              O servidor responde 503 enquanto não houver credencial (ADR 0010),
              e a tela cai numa página de erro do navegador em vez de mentir que
              funcionou.
            */}
            <div className="flex items-center gap-3 py-1">
              <span className="h-px flex-1 bg-border" aria-hidden />
              <span className="text-xs uppercase tracking-wide text-muted-foreground">ou</span>
              <span className="h-px flex-1 bg-border" aria-hidden />
            </div>

            <a
              href="/api/v1/auth/google/iniciar"
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-muted"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden focusable="false">
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z" />
                <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9h-4v3.1A12 12 0 0 0 12 24z" />
                <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6v-3.1h-4a12 12 0 0 0 0 10.8l4-3.1z" />
                <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
              </svg>
              Entrar com Google
            </a>

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
