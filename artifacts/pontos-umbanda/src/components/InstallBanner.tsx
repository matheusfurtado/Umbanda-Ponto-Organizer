import { useState } from "react";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/usePWA";

export function InstallBanner() {
  const { isInstallable, isInstalled, isIOS, instalar } = usePWA();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  if (isInstalled || dismissed) return null;
  if (!isInstallable && !isIOS) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-primary text-primary-foreground shadow-xl">
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
          <button onClick={() => setDismissed(true)} className="opacity-70 hover:opacity-100">
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
