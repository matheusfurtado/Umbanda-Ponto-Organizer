import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Link2, ListMusic, Smartphone, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthContext";
import { useEntitlements } from "@/billing/EntitlementsContext";
import {
  FRASE,
  contarAbertura,
  marcarQueApareceu,
  observarConvite,
  podeAparecerSozinho,
  type MotivoDoConvite,
} from "@/billing/convite";

/**
 * O convite para assinar, em pop-up.
 *
 * ## Por que virou pop-up
 *
 * Antes ele era um cartão no rodapé de duas telas — a gira aberta por link e a
 * estante vazia. Palavras dele: *"eu não achei foi a propaganda do plano,
 * queria tipo um pop-up"*. Estava certo: os dois lugares eram exatamente os que
 * quase ninguém abre, e propaganda que não é vista não é propaganda.
 *
 * ## O que ele NÃO promete
 *
 * A letra, o link do vídeo e o app funcionar sem sinal são de todo mundo (ADR
 * 0002). O rodapé diz isso com todas as letras, e não por gentileza: uma faixa
 * de venda num app religioso, sem essa frase, lê como se o acervo fosse ficar
 * atrás de paywall — e ele nunca vai.
 *
 * A varredura `promessa-do-plano.test.tsx` reprova quem tentar prometer as três
 * aqui.
 *
 * ## Quando aparece
 *
 * Quem decide é `billing/convite.ts`, num lugar só. Esta tela só desenha.
 */

const O_QUE_O_PLANO_DA = [
  {
    Icone: ListMusic,
    titulo: "Crie suas playlists",
    diz: "A sequência da gira na sua ordem, com as seções da casa — chegada, louvação, firmeza.",
  },
  {
    Icone: Smartphone,
    titulo: "Carregue no bolso",
    diz: "A gira inteira vai junto no celular, para o terreiro onde o sinal não chega.",
  },
  {
    Icone: Link2,
    titulo: "Compartilhe como quiser",
    diz: "Um link só para quem você mandar — ou na vitrine, para a comunidade achar.",
  },
  {
    Icone: Users,
    titulo: "Siga quem você ouve",
    diz: "Seus artistas numa estante só, com o que eles gravaram.",
  },
];

export function PopUpDoPlano() {
  const { autenticado } = useAuth();
  const { ent, loading } = useEntitlements();
  const [motivo, setMotivo] = useState<MotivoDoConvite | null>(null);

  const assina = Boolean(ent.repertorios && ent.seguirArtistas);

  // O gatilho por INTENÇÃO: alguém tocou em algo do plano.
  useEffect(() => observarConvite((m) => {
    if (!assina) setMotivo(m);
  }), [assina]);

  // O gatilho SOZINHO. Roda uma vez por montagem da moldura.
  useEffect(() => {
    // `loading` importa: no primeiro quadro `ent` é o que ficou guardado da
    // sessão anterior, e um assinante veria o convite piscar antes de o
    // servidor confirmar o plano dele.
    if (loading || assina) return;
    const abriu = contarAbertura();
    if (abriu < 2 || !podeAparecerSozinho()) return;
    // Espera a tela assentar. Um diálogo que salta junto com o primeiro
    // desenho parece erro, e a pessoa fecha por reflexo sem ler.
    const t = setTimeout(() => {
      setMotivo("sozinho");
      marcarQueApareceu();
    }, 2500);
    return () => clearTimeout(t);
  }, [loading, assina]);

  if (motivo === null) return null;

  return (
    <Dialog open onOpenChange={(v) => !v && setMotivo(null)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base leading-snug">
            {FRASE[motivo]}
          </DialogTitle>
        </DialogHeader>

        <ul className="space-y-3">
          {O_QUE_O_PLANO_DA.map(({ Icone, titulo, diz }) => (
            <li key={titulo} className="flex gap-2.5">
              <Icone className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span>
                <span className="block text-sm font-medium text-foreground">{titulo}</span>
                <span className="block text-xs leading-snug text-muted-foreground">{diz}</span>
              </span>
            </li>
          ))}
        </ul>

        <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs leading-snug text-muted-foreground">
          As letras, os vídeos e o acervo inteiro seguem abertos, com ou sem plano.
          O que se cobra é a ferramenta.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/planos"
            onClick={() => setMotivo(null)}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            {autenticado ? "Ver planos" : "Começar o teste grátis"}
          </Link>
          {/* A saída existe e é fácil de achar. Pop-up sem "agora não" visível
              é o que ensina a pessoa a fechar sem ler o próximo. */}
          <Button variant="ghost" onClick={() => setMotivo(null)}>
            Agora não
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
