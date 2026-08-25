import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { useAuth } from "@/auth/AuthContext";
import { buscarEntitlements, type Entitlements } from "@/lib/apiBilling";

export const ENTITLEMENTS_GRATIS: Entitlements = {
  plano: "gratis",
  acervoOrganizado: false,
  linksDeVideo: false,
  repertorios: false,
  sync: false,
  offline: false,
};

interface Ctx {
  ent: Entitlements;
  loading: boolean;
  refetch: () => void;
}

const EntitlementsContext = createContext<Ctx | null>(null);

export function EntitlementsProvider({ children }: { children: ReactNode }) {
  const { autenticado, isPending } = useAuth();
  const [ent, setEnt] = useState<Entitlements>(ENTITLEMENTS_GRATIS);
  const [loading, setLoading] = useState(false);

  const carregar = useCallback(() => {
    if (!autenticado) {
      setEnt(ENTITLEMENTS_GRATIS);
      return;
    }
    setLoading(true);
    buscarEntitlements()
      .then(setEnt)
      .catch(() => setEnt(ENTITLEMENTS_GRATIS))
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
