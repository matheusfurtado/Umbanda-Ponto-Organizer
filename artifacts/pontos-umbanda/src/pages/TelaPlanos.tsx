import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Check, Copy, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthContext";
import { useEntitlements } from "@/billing/EntitlementsContext";
import { criarCheckout, type CheckoutResult } from "@/lib/apiBilling";

type Tier = {
  codigo: string;
  nome: string;
  preco: string;
  periodo: string;
  destaque?: boolean;
  features: string[];
};

const TIERS: Tier[] = [
  {
    codigo: "fundador",
    nome: "Fundador",
    preco: "R$ 149",
    periodo: "pagamento único — vitalício",
    destaque: true,
    features: ["Acesso vitalício ao acervo completo", "Backup e sincronização na nuvem", "Download offline", "Você sustenta a preservação"],
  },
  {
    codigo: "pro",
    nome: "Pro",
    preco: "R$ 9,90",
    periodo: "por mês",
    features: ["Acervo completo", "Sincronização entre aparelhos"],
  },
  {
    codigo: "terreiro",
    nome: "Terreiro",
    preco: "R$ 39,90",
    periodo: "por mês",
    features: ["Tudo do Pro", "Repertório oficial da casa (em breve)", "Até 20 membros"],
  },
];

export function TelaPlanos() {
  const { autenticado } = useAuth();
  const { ent, refetch } = useEntitlements();
  const [aberto, setAberto] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [resultado, setResultado] = useState<CheckoutResult | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const assinar = async (codigo: string) => {
    setAberto(codigo);
    setResultado(null);
    setErro(null);
    setCarregando(true);
    try {
      setResultado(await criarCheckout(codigo));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao iniciar o pagamento.");
    } finally {
      setCarregando(false);
    }
  };

  const copiar = (texto: string) => {
    void navigator.clipboard?.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-8 pb-16">
        <Link href={autenticado ? "/conta" : "/"}>
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2 mb-6 text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
        </Link>

        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🕯️</div>
          <h1 className="text-2xl font-bold text-foreground">Planos</h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-xs mx-auto">
            Cobramos a ferramenta e a curadoria do acervo — <b>nunca as letras</b>, que são de todos.
          </p>
          <p className="text-xs text-muted-foreground mt-3">
            Seu plano atual: <span className="text-primary font-medium capitalize">{ent.plano}</span>
          </p>
        </div>

        <div className="space-y-4">
          {TIERS.map((t) => {
            const atual = ent.plano === t.codigo;
            return (
              <div
                key={t.codigo}
                className={`rounded-xl border p-5 ${
                  t.destaque ? "border-primary bg-primary/5" : "border-border bg-card"
                }`}
              >
                <div className="flex items-baseline justify-between">
                  <h2 className="text-lg font-bold text-foreground">{t.nome}</h2>
                  {t.destaque && (
                    <span className="text-[10px] uppercase tracking-wide bg-primary text-white rounded-full px-2 py-0.5">
                      Recomendado
                    </span>
                  )}
                </div>
                <div className="mt-1">
                  <span className="text-2xl font-bold text-foreground">{t.preco}</span>{" "}
                  <span className="text-sm text-muted-foreground">{t.periodo}</span>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>

                {atual ? (
                  <div className="mt-4 text-sm text-primary font-medium flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Seu plano atual
                  </div>
                ) : !autenticado ? (
                  <Link href="/login">
                    <Button className="w-full mt-4" variant={t.destaque ? "default" : "outline"}>
                      Entrar para assinar
                    </Button>
                  </Link>
                ) : (
                  <Button
                    className="w-full mt-4 gap-2"
                    variant={t.destaque ? "default" : "outline"}
                    onClick={() => assinar(t.codigo)}
                    disabled={carregando || (aberto === t.codigo && !!resultado)}
                  >
                    <QrCode className="w-4 h-4" />
                    {carregando && aberto === t.codigo
                      ? "Gerando Pix..."
                      : aberto === t.codigo && resultado
                        ? "Pix gerado abaixo"
                        : "Assinar com Pix"}
                  </Button>
                )}

                {aberto === t.codigo && (erro || resultado) && (
                  <div className="mt-4 pt-4 border-t border-border">
                    {erro && <p className="text-sm text-muted-foreground text-center">{erro}</p>}
                    {resultado?.pixQrCodeBase64 && (
                      <div className="flex flex-col items-center gap-3">
                        <img
                          src={`data:image/png;base64,${resultado.pixQrCodeBase64}`}
                          alt="QR Code Pix"
                          className="w-44 h-44 rounded-lg bg-white p-2"
                        />
                        {resultado.pixCopiaCola && (
                          <Button variant="outline" size="sm" className="gap-2" onClick={() => copiar(resultado.pixCopiaCola!)}>
                            <Copy className="w-4 h-4" /> {copiado ? "Copiado!" : "Copiar código Pix"}
                          </Button>
                        )}
                        <p className="text-xs text-muted-foreground text-center">
                          Pague pelo app do seu banco. O acesso é liberado assim que o pagamento é confirmado.
                        </p>
                        <Button variant="ghost" size="sm" onClick={refetch}>
                          Já paguei — atualizar acesso
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          O plano <b>Grátis</b> continua para sempre: crie e organize seus próprios pontos, offline. Casas de santo sem
          condição podem pedir uma bolsa — fale com a gente.
        </p>
      </div>
    </div>
  );
}
