import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, CloudUpload, Download, DownloadCloud, LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthContext";
import { apelido, inicial } from "@/auth/apelido";
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
          <div className="mb-6 text-sm text-primary flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Plano <b className="capitalize">{ent.plano}</b> — acervo completo liberado.
          </div>
        ) : (
          <Link href="/planos">
            <button className="w-full mb-6 text-left p-4 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/15 transition-colors">
              <span className="block font-semibold text-foreground">Desbloqueie o acervo completo 🕯️</span>
              <span className="block text-sm text-muted-foreground">
                Seja Fundador (vitalício) e tenha os 380+ pontos curados, backup e sync. Ver planos →
              </span>
            </button>
          </Link>
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
