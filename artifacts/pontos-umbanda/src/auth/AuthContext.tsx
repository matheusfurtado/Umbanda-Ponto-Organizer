import { createContext, useContext, type ReactNode } from "react";
import { authClient } from "@/lib/authClient";

type Sessao = ReturnType<typeof authClient.useSession>;
type DadosSessao = Sessao["data"];
type Usuario = NonNullable<DadosSessao>["user"];

interface AuthContextType {
  session: DadosSessao;
  user: Usuario | null;
  isPending: boolean;
  autenticado: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isPending } = authClient.useSession();
  const value: AuthContextType = {
    session: data,
    user: data?.user ?? null,
    isPending,
    autenticado: !!data?.user,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
