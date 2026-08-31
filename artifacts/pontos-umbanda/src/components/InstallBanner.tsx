import { useState } from "react";
import { Download, Share, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/usePWA";

/**
 * "Já dispensei esta faixa." Mora no aparelho, não na memória da aba.
 *
 * Era `useState(false)`: recarregar trazia a faixa de volta, para sempre. Quem
 * não quer instalar a via de novo a cada abertura, e a única forma de se ver
 * livre dela era instalar — o que faz a sugestão parecer uma cobrança.
 */
const CHAVE_DISPENSADA = "instalar-dispensado";

function jaDispensou(): boolean {
  try {
    return localStorage.getItem(CHAVE_DISPENSADA) === "1";
  } catch {
    return false;
  }
}

export function InstallBanner() {
  const { isInstallable, isInstalled, isIOS, instalar } = usePWA();
  const [dismissed, setDismissed] = useState(jaDispensou);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  function dispensar() {
    setDismissed(true);
    try {
      localStorage.setItem(CHAVE_DISPENSADA, "1");
    } catch {
      /* sem storage a faixa volta na próxima abertura, como antes */
    }
  }

  if (isInstalled || dismissed) return null;
  if (!isInstallable && !isIOS) return null;

  return (
    <>
      {/* ACIMA da barra de navegação, não por cima dela.
          
          Era `bottom-0 z-50` contra a `BarraInferior`, que é `bottom-0 z-40`:
          a faixa cobria Início, Buscar, Favoritos, Giras e Cores — a navegação
          inteira do celular — e no iPhone, onde ela aparece para todo mundo
          (não há `beforeinstallprompt`), o app ficava sem menu.
          
          A barra mede ~55px (`py-2` + ícone de 20 + rótulo de 11 + borda);
          `bottom-16` são 64, e a folga é de propósito — com 56 exatos, mudar
          a fonte do rótulo em um pixel traria a sobreposição de volta sem
          ninguém notar. `lg:bottom-0` devolve a faixa ao pé da tela no
          desktop, onde a barra não existe. O `pb-[env(...)]` é a barra de
          gestos do iPhone, que come o rodapé. */}
      <div className="fixed bottom-16 left-0 right-0 z-50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-primary text-primary-foreground shadow-xl lg:bottom-0">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <Smartphone className="w-5 h-5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Instalar o app</p>
            {/* NÃO promete offline aqui.
                
                Dizia "Acesse offline, sem precisar do navegador" — para todo
                mundo, inclusive para quem não tem conta. E a `TelaPlanos`
                VENDE "Usar offline, sem depender de sinal" como vantagem da
                assinatura. O mesmo app oferecia de graça, na faixa, o que
                cobrava na outra tela.
                
                Qual das duas linhas é a mentira é decisão do Matheus e está
                aberta no ADR 0002 — não dá para consertar escolhendo um lado.
                O que dá é parar de prometer: esta frase agora diz só o que
                instalar faz de fato, e vale igual nas duas saídas do ADR. Se a
                decisão for "(A) offline é grátis", a promessa volta para cá. */}
            <p className="text-xs opacity-80 truncate">Abre direto da tela inicial, sem a barra do navegador</p>
          </div>
          {isInstallable ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={instalar}
              className="shrink-0 text-xs px-3"
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              Instalar
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setShowIOSHelp(true)}
              className="shrink-0 text-xs px-3"
            >
              Como instalar
            </Button>
          )}
          <button
            onClick={dispensar}
            aria-label="Dispensar o convite para instalar"
            className="min-h-11 min-w-11 flex items-center justify-center opacity-70 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showIOSHelp && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-end" onClick={() => setShowIOSHelp(false)}>
          <div className="bg-card text-foreground w-full rounded-t-2xl p-6 space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg">Instalar no iPhone/iPad</h3>
            {/* "No Safari" dito na cara, e não pressuposto.
                
                No iPhone e no iPad, adicionar à tela de início é do Safari. Um
                passo a passo que fala em "a barra do navegador" manda quem
                está em outro navegador procurar um botão que não existe ali —
                e ela conclui que o app não instala no aparelho dela. */}
            <p className="text-sm text-muted-foreground">
              Estes passos são <strong className="text-foreground">no Safari</strong>. Se você
              abriu em outro navegador, abra este endereço no Safari primeiro.
            </p>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-4">
              {/* O símbolo era `⎋` — U+238B, que é a tecla ESC, não o
                  compartilhar. Quem seguisse a instrução procuraria na barra
                  do Safari um desenho que não está lá. Agora é o glifo de
                  verdade (quadrado com a seta saindo para cima), desenhado, e
                  descrito em palavras para quem não vê a tela. */}
              <li className="flex flex-wrap items-center gap-1">
                <span>Toque no ícone de compartilhar</span>
                <Share className="inline h-4 w-4 text-foreground" aria-hidden />
                <span>— o quadrado com a seta para cima, na barra do Safari</span>
              </li>
              <li>Role para baixo e toque em <strong className="text-foreground">"Adicionar à Tela de Início"</strong></li>
              <li>Toque em <strong className="text-foreground">"Adicionar"</strong> no canto superior direito</li>
            </ol>
            <Button className="w-full" onClick={() => setShowIOSHelp(false)}>Entendi</Button>
          </div>
        </div>
      )}
    </>
  );
}
