import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CloudUpload,
  Download,
  DownloadCloud,
  Loader2,
  LogOut,
  MailCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthContext";
import { apelido, inicial } from "@/auth/apelido";
import { pedirVerificacao } from "@/api/conta";
import { useApp } from "@/context";
import { useEntitlements } from "@/billing/EntitlementsContext";
import { exportarConta, baixarDadosDaConta } from "@/lib/apiConta";
import { ModalMigracao } from "@/components/ModalMigracao";

export function TelaConta() {
  const { user, sair: encerrarSessao } = useAuth();
  const { substituirDados } = useApp();
  const { ent, loading: entLoading } = useEntitlements();
  const [, navegar] = useLocation();
  const [migrar, setMigrar] = useState(false);
  const [baixando, setBaixando] = useState(false);
  const [confirmandoBaixar, setConfirmandoBaixar] = useState(false);
  const [baixandoConta, setBaixandoConta] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [verificacao, setVerificacao] = useState<"parado" | "enviando" | "enviado" | "erro">(
    "parado",
  );

  const sair = async () => {
    await encerrarSessao();
    navegar("/");
  };

  const baixar = async () => {
    setBaixando(true);
    try {
      const dados = await exportarConta();
      const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "meus-dados-umbanda.json";
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBaixando(false);
    }
  };

  const baixarDaConta = async () => {
    setBaixandoConta(true);
    setMsg(null);
    try {
      const dados = await baixarDadosDaConta();
      substituirDados(dados);
      setConfirmandoBaixar(false);
      setMsg("Pronto! Este aparelho agora mostra os pontos da sua conta.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao baixar da conta.");
    } finally {
      setBaixandoConta(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-8 pb-16">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 mb-6 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Voltar ao app
          </Button>
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <span className="w-14 h-14 rounded-full bg-primary/25 text-primary flex items-center justify-center text-xl font-semibold">
            {inicial(user?.email)}
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">{apelido(user?.email)}</h1>
            <p className="text-muted-foreground text-sm truncate">{user?.email}</p>
          </div>
        </div>

        {entLoading ? (
          <div className="mb-6 h-16 rounded-xl bg-muted/40 animate-pulse" />
        ) : ent.acervoOrganizado ? (
          <div className="mb-6 flex items-center gap-1.5 text-sm text-primary">
            <Sparkles className="h-4 w-4" aria-hidden />
            {ent.plano === "teste" ? (
              <>
                Teste ativo — {ent.diasRestantes ?? 0} dia
                {(ent.diasRestantes ?? 0) === 1 ? "" : "s"} restante
                {(ent.diasRestantes ?? 0) === 1 ? "" : "s"}.
              </>
            ) : (
              <>
                Plano <b className="capitalize">{ent.plano}</b> ativo.
              </>
            )}
          </div>
        ) : (
          <Link href="/planos">
            <button className="mb-6 w-full rounded-xl border border-primary/30 bg-primary/10 p-4 text-left transition-colors hover:bg-primary/15">
              {/* NÃO vende o acervo. O texto anterior prometia "desbloqueie o
                  acervo completo, 380+ pontos curados" — vendia o conteúdo
                  religioso, exatamente o que o ADR 0002 decidiu não cobrar. E
                  era falso: as letras já estão todas aqui, de graça. */}
              <span className="block font-semibold text-foreground">
                Organize a sua gira 🕯️
              </span>
              <span className="block text-sm text-muted-foreground">
                As letras continuam grátis. O plano traz o acervo por orixá na ordem
                da gira, o vídeo de cada ponto, o repertório e o uso offline. Ver
                planos →
              </span>
            </button>
          </Link>
        )}

        {/* Verificar o e-mail não é burocracia: é o que permite RECUPERAR a
            conta depois. Sem endereço confirmado, esquecer a senha significa
            perder o acervo montado — por isso o aviso fica aqui, visível, e não
            escondido numa tela de configurações. */}
        {user && !user.email_verificado && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="flex items-center gap-1.5 text-sm font-medium text-amber-200">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
              E-mail ainda não confirmado
            </p>
            <p className="mt-1 text-xs leading-snug text-muted-foreground">
              Confirmar é o que permite recuperar a conta se você esquecer a senha.
              Sem isso, esquecer significa perder o acervo que você montou.
            </p>
            {verificacao === "enviado" ? (
              <p className="mt-3 flex items-center gap-1.5 text-xs text-primary">
                <MailCheck className="h-4 w-4 shrink-0" aria-hidden />
                Link enviado. Confira sua caixa de entrada.
              </p>
            ) : (
              <button
                onClick={async () => {
                  setVerificacao("enviando");
                  try {
                    await pedirVerificacao();
                    setVerificacao("enviado");
                  } catch {
                    setVerificacao("erro");
                  }
                }}
                disabled={verificacao === "enviando"}
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md border border-amber-500/40 px-4 text-sm font-medium text-amber-200"
              >
                {verificacao === "enviando" && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                )}
                Enviar link de confirmação
              </button>
            )}
            {verificacao === "erro" && (
              <p role="alert" className="mt-2 text-xs text-destructive">
                Não consegui enviar agora. Tente de novo em instantes.
              </p>
            )}
          </div>
        )}

        {user?.email_verificado && (
          <p className="mb-6 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            E-mail confirmado
          </p>
        )}

        <div className="space-y-3">
          <LinhaAcao
            icone={<CloudUpload className="w-5 h-5" />}
            titulo="Enviar meus pontos deste aparelho"
            descricao="Cria/atualiza uma cópia dos seus dados na conta. Nada é apagado."
            onClick={() => setMigrar(true)}
          />

          {confirmandoBaixar ? (
            <div className="p-4 rounded-xl bg-card border border-amber-500/40 space-y-3">
              <p className="text-sm text-foreground">
                Isto vai <b>substituir</b> os pontos deste aparelho pelos da sua conta. Se você tem algo só
                aqui, envie primeiro (ação acima).
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setConfirmandoBaixar(false)}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={baixarDaConta} disabled={baixandoConta}>
                  {baixandoConta ? "Baixando..." : "Substituir pelos da conta"}
                </Button>
              </div>
            </div>
          ) : (
            <LinhaAcao
              icone={<DownloadCloud className="w-5 h-5" />}
              titulo="Baixar da conta para este aparelho"
              descricao="Mostra aqui os pontos que estão na sua conta (ex.: outro celular)."
              onClick={() => {
                setMsg(null);
                setConfirmandoBaixar(true);
              }}
            />
          )}

          <LinhaAcao
            icone={<Download className="w-5 h-5" />}
            titulo={baixando ? "Preparando..." : "Baixar meus dados"}
            descricao="Exporta tudo que está na sua conta (portabilidade)."
            onClick={baixar}
          />
        </div>
        {msg && <p className="text-sm text-muted-foreground mt-3">{msg}</p>}

        <div className="mt-10 pt-6 border-t border-border">
          <Button variant="ghost" onClick={sair} className="gap-2 text-destructive hover:text-destructive">
            <LogOut className="w-4 h-4" /> Sair da conta
          </Button>
        </div>
      </div>

      <ModalMigracao aberto={migrar} onFechar={() => setMigrar(false)} />
    </div>
  );
}

function LinhaAcao({
  icone,
  titulo,
  descricao,
  onClick,
}: {
  icone: ReactNode;
  titulo: string;
  descricao: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-start gap-3 text-left p-4 rounded-xl bg-card border border-border hover:bg-muted/40 transition-colors"
    >
      <span className="text-primary mt-0.5">{icone}</span>
      <span className="min-w-0">
        <span className="block font-medium text-foreground">{titulo}</span>
        <span className="block text-sm text-muted-foreground">{descricao}</span>
      </span>
    </button>
  );
}
