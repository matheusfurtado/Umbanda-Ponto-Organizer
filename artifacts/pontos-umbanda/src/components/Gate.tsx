import type { ReactNode } from "react";
import { useEntitlements } from "@/billing/EntitlementsContext";
import type { Entitlements } from "@/lib/apiBilling";

type Feature = keyof Omit<Entitlements, "plano">;

// Espelho de UX do gate. A fonte da verdade é SEMPRE o backend (HTTP 402 / gate do acervo);
// este componente só decide o que mostrar. Nunca coloque conteúdo secreto atrás só do Gate.
export function Gate({
  feature,
  children,
  fallback = null,
}: {
  feature: Feature;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { ent } = useEntitlements();
  return <>{ent[feature] ? children : fallback}</>;
}
