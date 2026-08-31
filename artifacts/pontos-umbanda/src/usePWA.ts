import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * "É um aparelho da Apple?" — e por que o user agent sozinho não responde.
 *
 * A checagem era `/iphone|ipad|ipod/i.test(navigator.userAgent)`. Desde o
 * iPadOS 13 o Safari do iPad se apresenta como **Macintosh**: a string "iPad"
 * não aparece mais. Ou seja, no iPad a checagem dava `false`, e como o iOS não
 * dispara `beforeinstallprompt`, `isInstallable` também era `false` — a faixa
 * de instalar simplesmente **nunca aparecia** no aparelho onde ela é a única
 * forma de instalar, porque lá não há botão nativo nenhum.
 *
 * `maxTouchPoints` é o que separa um Mac de verdade (0) de um iPad fingindo de
 * Mac (5). É a checagem que a própria Apple recomenda desde então.
 */
function ehApplePortatil(): boolean {
  const ua = navigator.userAgent;
  // iPhone e iPod continuam se declarando. iPad antigo (iOS 12 e antes) também.
  if (/iphone|ipod|ipad/i.test(ua)) return true;
  return /macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
}

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsIOS(ehApplePortatil());
    setIsInstalled(isStandalone);

    const aoPoderInstalar = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Este tinha de ser nomeado também. Estava anônimo, e o `return` embaixo só
    // removia o outro: cada montagem do hook deixava mais um ouvinte de
    // `appinstalled` pendurado na janela, chamando `setState` de um componente
    // que já saiu.
    const aoInstalar = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", aoPoderInstalar);
    window.addEventListener("appinstalled", aoInstalar);

    return () => {
      window.removeEventListener("beforeinstallprompt", aoPoderInstalar);
      window.removeEventListener("appinstalled", aoInstalar);
    };
  }, []);

  /**
   * O convite nativo é de UMA vez só.
   *
   * Depois de `prompt()`, o mesmo evento não serve mais — chamar de novo
   * rejeita com `InvalidStateError`. O código só limpava o estado quando a
   * pessoa ACEITAVA; recusando, `isInstallable` continuava `true`, o botão
   * "Instalar" continuava na faixa e **não fazia mais nada**. Tocar nele
   * rejeitava uma promessa que ninguém pegava.
   *
   * Botão que não faz nada é pior que botão nenhum: a pessoa conclui que o app
   * está quebrado, no primeiro gesto que ele pediu que ela fizesse.
   *
   * Por isso o evento sai daqui aconteça o que acontecer. Recusar esconde a
   * faixa até a próxima abertura — que é o que "não, obrigada" quer dizer.
   */
  const instalar = async () => {
    if (!installPrompt) return;
    setInstallPrompt(null);
    setIsInstallable(false);
    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") setIsInstalled(true);
    } catch {
      // O navegador recusou o convite (já foi usado, ou o gesto não conta).
      // Não há o que dizer à pessoa: ela não pediu isto, ofereceram a ela.
    }
  };

  return { isInstallable, isInstalled, isIOS, instalar };
}
