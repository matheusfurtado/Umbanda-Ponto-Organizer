import { useState } from "react";
import { Download, X, Smartphone } from "lucide-react";
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
            <p className="text-xs opacity-80 truncate">Acesse offline, sem precisar do navegador</p>
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
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal pl-4">
              <li>Toque no ícone de compartilhar <span className="text-foreground font-mono">⎋</span> na barra do Safari</li>
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
