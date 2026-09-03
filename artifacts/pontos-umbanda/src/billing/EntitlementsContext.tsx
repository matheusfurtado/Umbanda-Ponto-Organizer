import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useAuth } from "@/auth/AuthContext";
import { buscarEntitlements, type Entitlements } from "@/lib/apiBilling";
import { esquecerPlano, lembrarPlano, planoLembrado } from "@/billing/ultimoPlano";

export const ENTITLEMENTS_GRATIS: Entitlements = {
  plano: "gratis",
  acervoOrganizado: false,
  repertorios: false,
  sync: false,
  seguirArtistas: false,
};

interface Ctx {
  ent: Entitlements;
  loading: boolean;
  refetch: () => void;
}

const EntitlementsContext = createContext<Ctx | null>(null);

export function EntitlementsProvider({ children }: { children: ReactNode }) {
  const { autenticado, isPending } = useAuth();
  // Começa do que o servidor confirmou por último, e não do grátis: numa
  // abertura sem rede — a do terreiro — o assinante veria o produto que ele
  // paga simplesmente não estar lá.
  const [ent, setEnt] = useState<Entitlements>(() => planoLembrado() ?? ENTITLEMENTS_GRATIS);
  const [loading, setLoading] = useState(false);

  const carregar = useCallback(() => {
    if (!autenticado) {
      // Sem sessão é o único caso em que rebaixar está certo — e aí a memória
      // também sai, porque ela é sobre a pessoa que estava aqui.
      setEnt(ENTITLEMENTS_GRATIS);
      esquecerPlano();
      return;
    }
    setLoading(true);
    buscarEntitlements()
      .then((novo) => {
        setEnt(novo);
        lembrarPlano(novo);
      })
      // **Falhar não rebaixa.** Era `.catch(() => setEnt(ENTITLEMENTS_GRATIS))`,
      // e com isso uma oscilação de rede tirava de quem paga a hierarquia, os
      // links e as giras, sem uma palavra na tela. Fica o último estado
      // conhecido; quem decide de verdade é o servidor, que confere o plano em
      // toda rota (ADR 0002).
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [autenticado]);

  useEffect(() => {
    if (!isPending) carregar();
  }, [isPending, carregar]);

  // Reflete o pagamento aprovado (webhook assíncrono): recarrega ao voltar para a aba/janela.
  useEffect(() => {
    const aoVoltar = () => {
      if (document.visibilityState === "visible") carregar();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    window.addEventListener("focus", carregar);
    return () => {
      document.removeEventListener("visibilitychange", aoVoltar);
      window.removeEventListener("focus", carregar);
    };
  }, [carregar]);

  return <EntitlementsContext.Provider value={{ ent, loading, refetch: carregar }}>{children}</EntitlementsContext.Provider>;
}

export function useEntitlements(): Ctx {
  const c = useContext(EntitlementsContext);
  if (!c) throw new Error("useEntitlements deve ser usado dentro de EntitlementsProvider");
  return c;
}
