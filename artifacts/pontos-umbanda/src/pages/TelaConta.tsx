import { useEffect, useState, type ReactNode } from "react";
import { mensagemDeErro } from "@/api/cliente";
import { Link, useLocation } from "wouter";
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  CloudUpload,
  Download,
  DownloadCloud,
  Flag,
  Loader2,
  LogOut,
  MailCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthContext";
import { apelido, inicial } from "@/auth/apelido";
import { TrocarApelido } from "@/componentes/TrocarApelido";
import { ApagarConta } from "@/componentes/ApagarConta";
import { mudarConsentimentoDeComunicacao, pedirVerificacao } from "@/api/conta";
import { useApp } from "@/context";
import { useEntitlements } from "@/billing/EntitlementsContext";
import { exportarConta, baixarDadosDaConta } from "@/lib/apiConta";
import { ModalMigracao } from "@/components/ModalMigracao";
import { CancelarAssinatura } from "@/componentes/CancelarAssinatura";
import { minhaAssinatura, type Assinatura } from "@/lib/apiBilling";

export function TelaConta() {
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null);

  // Carregada à parte dos direitos: quem está no teste de 15 dias não tem
  // assinatura, e uma falha aqui não pode esconder o resto da tela de conta —
  // exportar e apagar os dados são direitos da LGPD e precisam abrir sempre.
  useEffect(() => {
    minhaAssinatura().then(setAssinatura).catch(() => setAssinatura(null));
  }, []);
  const { user, sair: encerrarSessao, recarregar } = useAuth();
  const { substituirDados } = useApp();
  const { ent, loading: entLoading } = useEntitlements();
  const [, navegar] = useLocation();
  const [migrar, setMigrar] = useState(false);
  const [trocando, setTrocando] = useState(false);
  const [apagando, setApagando] = useState(false);
  const [baixando, setBaixando] = useState(false);
  const [confirmandoBaixar, setConfirmandoBaixar] = useState(false);
  const [baixandoConta, setBaixandoConta] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  // O consentimento opcional. Estado local para o clique responder na hora, e
  // `recarregar()` depois para o que a tela mostra ser o que o servidor gravou.
  const [aceitaComunicacao, setAceitaComunicacao] = useState(
    user?.consentiu_comunicacao_em != null,
  );
  const [mudandoConsentimento, setMudandoConsentimento] = useState(false);

  useEffect(() => {
    setAceitaComunicacao(user?.consentiu_comunicacao_em != null);
  }, [user?.consentiu_comunicacao_em]);

  async function trocarComunicacao(quer: boolean) {
    setMudandoConsentimento(true);
    setAceitaComunicacao(quer);
    setMsg(null);
    try {
      await mudarConsentimentoDeComunicacao(quer);
      await recarregar();
    } catch {
      // Volta ao que era: deixar o checkbox marcado sem o servidor saber
      // seria a tela mentindo sobre um consentimento, que é o oposto do ponto.
      setAceitaComunicacao(!quer);
      setMsg("Não consegui salvar agora. Tente de novo.");
    } finally {
      setMudandoConsentimento(false);
    }
  }
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
      setMsg(mensagemDeErro(e, "Erro ao baixar da conta."));
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

        <div className="flex items-center gap-3 mb-6">
          <span className="w-14 h-14 rounded-full bg-primary/25 text-primary flex items-center justify-center text-xl font-semibold">
            {inicial(user?.email)}
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-foreground truncate">{apelido(user?.email)}</h1>
            <p className="text-muted-foreground text-sm truncate">{user?.email}</p>
          </div>
        </div>

        {/* O nome PÚBLICO, separado do e-mail de propósito.
            São coisas diferentes e a confusão entre elas é o risco central
            deste app: o e-mail identifica a pessoa e nunca aparece para
            ninguém; o apelido é o que o mundo vê ao lado de uma lista de
            pontos de Umbanda. Mostrar os dois na mesma linha, como se fossem
            variações do mesmo dado, é como alguém acaba publicando o errado. */}
        <div className="mb-8 rounded-xl border p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Nome público</p>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {user?.apelido || "Você ainda não escolheu"}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setTrocando(true)}>
              {user?.apelido ? "Trocar" : "Escolher"}
            </Button>
          </div>
          <p className="mt-2 text-xs leading-snug text-muted-foreground">
            É o que aparece no seu perfil, nas playlists que você publica e embaixo dos
            pontos que você envia. Seu e-mail nunca aparece para outras pessoas.
          </p>
          {user?.apelido && (
            <Link
              href={`/perfil/${encodeURIComponent(user.apelido)}`}
              className="mt-2 inline-block text-xs font-medium text-primary underline"
            >
              Ver meu perfil como os outros veem
            </Link>
          )}
        </div>

        <TrocarApelido aberto={trocando} onFechar={() => setTrocando(false)} />

        {/* O CAMINHO DE ADMIN NO CELULAR.
            Moderação, denúncias e painel só existiam na barra lateral, que
            aparece de `lg:` para cima — então a área inteira de administração
            era exclusiva de desktop. Quem modera este app é uma pessoa só, e o
            aparelho dela é o celular. A fila de contribuições e a de denúncias
            ficavam inalcançáveis justamente onde ela está.

            Entra aqui, e não como aba nova na barra de baixo: os cinco lugares
            de lá são de quem canta, não de quem modera. `lg:hidden` porque no
            desktop a barra lateral já leva.

            O link só aparece para admin por conveniência — a defesa é a rota,
            que responde 404 a quem não for. */}
        {user?.admin && (
          <div className="mb-6 rounded-xl border p-4 lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Administração
            </p>
            <div className="mt-3 flex flex-col gap-1">
              <Link
                href="/moderacao"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-foreground"
              >
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
                Fila de moderação
              </Link>
              <Link
                href="/denuncias"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-foreground"
              >
                <Flag className="h-4 w-4 text-primary" aria-hidden />
                Denúncias
              </Link>
              <Link
                href="/painel"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-foreground"
              >
                <BarChart3 className="h-4 w-4 text-primary" aria-hidden />
                Painel
              </Link>
            </div>
          </div>
        )}

        {entLoading ? (
          <div className="mb-6 h-16 rounded-xl bg-muted/40 animate-pulse" />
        ) : ent.acervoOrganizado ? (
          <div className="mb-6 space-y-3">
          <div className="flex items-center gap-1.5 text-sm text-primary">
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
          {/* CANCELAR MORA AQUI, ao lado do estado do plano, e não escondido.
              Assinar levava um clique e cancelar não tinha caminho nenhum — o
              CDC exige que se possa rescindir pelo mesmo meio, e este app não
              tem suporte por e-mail para onde mandar a pessoa.
              
              Só aparece para quem tem assinatura de verdade: quem está no teste
              de 15 dias não tem o que cancelar, e o botão ali só assustaria. */}
          {assinatura && ent.plano !== "teste" && (
            <CancelarAssinatura assinatura={assinatura} onCancelou={setAssinatura} />
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

        {/* Os dois consentimentos, e o que dá para fazer com cada um.
            
            O de comunicação é opcional e se desmarca aqui. O de dado religioso
            não tem botão: sem ele não há base para a conta existir, então
            revogá-lo É apagar a conta — e dizer isso é mais honesto que
            oferecer um interruptor que não poderia funcionar. */}
        <div className="mt-10 pt-6 border-t border-border">
          <h2 className="text-sm font-medium text-foreground">Consentimentos</h2>
          <label className="mt-3 flex min-h-11 items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={aceitaComunicacao}
              disabled={mudandoConsentimento}
              onChange={(e) => void trocarComunicacao(e.target.checked)}
            />
            <span className="text-muted-foreground">
              Aceito receber avisos sobre o app por e-mail. Você pode desmarcar
              quando quiser, e nada deixa de funcionar.
            </span>
          </label>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            O consentimento para tratar o dado da sua prática religiosa é o que
            permite a conta existir — ele não se desmarca sozinho. Retirá-lo é
            apagar a conta, no link ali embaixo.
          </p>
        </div>

        <div className="mt-10 pt-6 border-t border-border">
          <Button variant="ghost" onClick={sair} className="gap-2 text-destructive hover:text-destructive">
            <LogOut className="w-4 h-4" /> Sair da conta
          </Button>
        </div>

        {/* Apagar a conta é direito, não escape de suporte: a LGPD garante a
            eliminação (art. 18, VI), e aqui isso pesa mais porque a simples
            existência da conta revela convicção religiosa.

            Fica embaixo e discreto — quem procura acha, e quem não procura não
            esbarra. Ao lado de "baixar meus dados" de propósito: portabilidade
            e eliminação são o mesmo par de direitos, e ver os dois juntos é o
            que faz alguém entender que pode levar o seu antes de sair. */}
        <div className="mt-4">
          <button
            onClick={() => setApagando(true)}
            className="text-xs text-muted-foreground underline underline-offset-2 hover:text-destructive"
          >
            Apagar minha conta e meus dados
          </button>
        </div>
      </div>

      <ModalMigracao aberto={migrar} onFechar={() => setMigrar(false)} />
      <ApagarConta aberto={apagando} onFechar={() => setApagando(false)} />
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
