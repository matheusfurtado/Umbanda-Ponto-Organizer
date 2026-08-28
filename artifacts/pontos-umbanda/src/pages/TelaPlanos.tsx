import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Check, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthContext";
import { useEntitlements } from "@/billing/EntitlementsContext";
import { registrarPagamentoPendente } from "@/billing/pagamentoPendente";
import {
  criarCheckout,
  emReais,
  listarPlanos,
  type CheckoutResult,
  type Plano,
} from "@/lib/apiBilling";

/**
 * Os planos vêm do SERVIDOR, com preço e periodicidade.
 *
 * Antes esta tela trazia a lista fixa no código, com preços escritos à mão. Isso
 * é uma tabela de preços que mente assim que alguém muda o valor no banco — e o
 * lugar onde ela mente é a tela onde a pessoa decide pagar.
 *
 * O que a tela ainda decide é o TEXTO de cada plano: o que muda de verdade entre
 * eles é sempre a mesma ferramenta, e o servidor não precisa carregar copy.
 */
const DESCRICOES: Record<string, string> = {
  mensal: "Para quem quer experimentar sem compromisso.",
  anual: "Dois meses de desconto em relação ao mensal.",
  vitalicio: "Paga uma vez e nunca mais. Você sustenta a preservação do acervo.",
};

const O_QUE_VEM = [
  "Acervo organizado por orixá, na ordem da gira",
  "Link do vídeo de cada ponto",
  "Reordenar e montar seu repertório",
  "Sincronizar entre seus aparelhos",
  "Usar offline, sem depender de sinal",
];

function periodo(p: Plano): string {
  return { mensal: "por mês", anual: "por ano", unico: "pagamento único" }[p.periodicidade];
}

export function TelaPlanos() {
  const [, navegar] = useLocation();
  const { autenticado } = useAuth();
  const { ent, refetch } = useEntitlements();
  const [planos, setPlanos] = useState<Plano[] | null>(null);
  const [erroCarga, setErroCarga] = useState<string | null>(null);
  const [processando, setProcessando] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<CheckoutResult | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarPlanos()
      .then(setPlanos)
      .catch((e) => setErroCarga(e instanceof Error ? e.message : "Falha ao carregar os planos."));
  }, []);

  const assinar = async (plano: Plano) => {
    if (!autenticado) {
      navegar("/login");
      return;
    }
    setProcessando(plano.id);
    setErro(null);
    try {
      setCheckout(await criarCheckout(plano.id));
      // A tela de retorno precisa saber QUAL plano esperar. Durante o teste os
      // direitos já são os do pago, então "tem plano?" não distingue nada.
      registrarPagamentoPendente(plano.id);
      // O plano NÃO está ativo ainda: quem libera é o webhook. Reconsultar é o
      // que faz a tela contar a verdade em vez de comemorar cedo demais.
      refetch();
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : "Falha ao iniciar o pagamento.");
    } finally {
      setProcessando(null);
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

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Planos</h1>
          {/* O enquadramento importa: não se cobra pela letra do ponto. */}
          <p className="text-muted-foreground text-sm mt-1">
            As letras dos pontos são e continuam gratuitas. O plano paga a
            ferramenta que organiza a sua gira.
          </p>
        </div>

        {ent.plano !== "gratis" && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 p-3 text-sm text-primary">
            <Check className="h-4 w-4 shrink-0" aria-hidden />
            Você já tem o plano <strong className="font-medium">{ent.plano}</strong> ativo.
          </div>
        )}

        <ul className="mb-8 space-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
          {O_QUE_VEM.map((item) => (
            <li key={item} className="flex gap-2 text-muted-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              {item}
            </li>
          ))}
        </ul>

        {erroCarga && (
          <p role="alert" className="text-sm text-destructive">
            {erroCarga}
          </p>
        )}

        {planos === null && !erroCarga && (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/40" />
            ))}
          </div>
        )}

        {planos?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum plano disponível no momento.
          </p>
        )}

        <div className="space-y-3">
          {planos?.map((plano) => (
            <div key={plano.id} className="rounded-xl border border-border p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-semibold text-foreground">{plano.nome}</h2>
                <div className="text-right">
                  <span className="text-lg font-bold text-foreground">
                    {emReais(plano.preco_centavos)}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">{periodo(plano)}</span>
                </div>
              </div>
              {DESCRICOES[plano.id] && (
                <p className="mt-1 text-sm text-muted-foreground">{DESCRICOES[plano.id]}</p>
              )}
              <Button
                onClick={() => assinar(plano)}
                disabled={processando !== null || ent.plano !== "gratis"}
                className="mt-3 w-full min-h-11"
                variant={ent.plano === "gratis" ? "default" : "secondary"}
              >
                {processando === plano.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {autenticado ? "Assinar" : "Entrar para assinar"}
              </Button>
            </div>
          ))}
        </div>

        {/* ANTES DE COBRAR, e não depois.
            
            O CDC (art. 46) diz que contrato cujos termos não foram PREVIAMENTE
            apresentados não obriga o consumidor — sem isto, a assinatura seria
            inexigível e quem pagasse teria razão em pedir tudo de volta. Por
            isso o resumo do que importa fica aqui, ao lado do botão, e não só
            atrás do link: renovação automática e os 7 dias de arrependimento
            são o que a pessoa precisa saber para decidir. */}
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          A assinatura se renova sozinha todo mês até você cancelar, e você tem{" "}
          <strong className="text-foreground">7 dias para desistir</strong> e
          receber tudo de volta (CDC, art. 49). Nada do que é seu é apagado se o
          plano acabar. Leia os{" "}
          <Link href="/termos" className="text-primary underline">
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" className="text-primary underline">
            Política de Privacidade
          </Link>
          .
        </p>

        {erro && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {erro}
          </p>
        )}

        {checkout && (
          <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4 text-sm">
            <p className="font-medium text-foreground">Falta pagar</p>
            <p className="mt-1 text-muted-foreground">
              Abra o link abaixo para concluir. O plano é liberado quando o pagamento
              for confirmado — pode levar alguns instantes depois de pagar.
            </p>
            <a
              href={checkout.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md border px-4 font-medium"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              Ir para o pagamento
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
