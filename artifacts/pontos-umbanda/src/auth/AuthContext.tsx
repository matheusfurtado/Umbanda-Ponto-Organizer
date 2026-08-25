/**
 * Quem está logado.
 *
 * A interface (`session`, `user`, `isPending`, `autenticado`) foi mantida do
 * cliente Better-Auth anterior de propósito: `App.tsx`, `RotaProtegida`,
 * `GerenciadorMigracao` e `MenuUsuario` continuam funcionando sem alteração.
 * Só o que está por baixo mudou — agora é a API Python.
 */

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  cadastrar as cadastrarNaApi,
  entrar as entrarNaApi,
  quemSou,
  sair as sairDaApi,
  type DadosCadastro,
  type Usuario,
} from "@/api/conta";

interface AuthContextType {
  session: { user: Usuario } | null;
  user: Usuario | null;
  /** Ainda descobrindo se há sessão. Antes disto não decida rota nem tela. */
  isPending: boolean;
  autenticado: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (dados: DadosCadastro) => Promise<void>;
  sair: () => Promise<void>;
  recarregar: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [isPending, setIsPending] = useState(true);

  const recarregar = useCallback(async () => {
    try {
      setUser(await quemSou());
    } catch {
      // Rede fora: trata como anônimo. O app funciona sem conta, então não há
      // motivo para travar a tela por não conseguir perguntar quem é.
      setUser(null);
    } finally {
      setIsPending(false);
    }
  }, []);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const entrar = useCallback(async (email: string, senha: string) => {
    setUser(await entrarNaApi(email, senha));
  }, []);

  const cadastrar = useCallback(async (dados: DadosCadastro) => {
    setUser(await cadastrarNaApi(dados));
  }, []);

  const sair = useCallback(async () => {
    await sairDaApi();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session: user ? { user } : null,
        user,
        isPending,
        autenticado: !!user,
        entrar,
        cadastrar,
        sair,
        recarregar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
