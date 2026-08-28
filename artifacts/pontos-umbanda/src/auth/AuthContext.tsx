/**
 * Quem está logado.
 *
 * A interface (`session`, `user`, `isPending`, `autenticado`) foi mantida do
 * cliente Better-Auth anterior de propósito: `App.tsx`, `RotaProtegida`,
 * `GerenciadorMigracao` e `MenuUsuario` continuam funcionando sem alteração.
 * Só o que está por baixo mudou — agora é a API Python.
 */

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { definirDono } from "@/dados/repositorio";
import { esquecerDoAparelho } from "@/dados/esquecer";
import {
  cadastrar as cadastrarNaApi,
  entrar as entrarNaApi,
  quemSou,
  sair as sairDaApi,
  type DadosCadastro,
  type Usuario,
} from "@/api/conta";

/**
 * Quem estava logado da última vez que deu para perguntar.
 *
 * **Falha de rede não é logout.** Sem isto, abrir o app sem sinal jogava a
 * pessoa na tela de login — e o cookie de sessão continuava lá, válido, no
 * navegador. Na gira, isso significava perder o acesso ao repertório justamente
 * na hora de cantar.
 *
 * Guarda só id e e-mail. A sessão em si é o cookie httpOnly, que o JavaScript
 * não lê nem escreve — nada aqui autentica coisa alguma, e um dump deste cache
 * não vale login nenhum.
 */
const CHAVE_USUARIO = "pontos-umbanda-usuario";

function lembrar(usuario: Usuario | null): void {
  try {
    if (usuario) localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
    else localStorage.removeItem(CHAVE_USUARIO);
  } catch {
    /* cota cheia: segue sem lembrar */
  }
}

function lembrado(): Usuario | null {
  try {
    const cru = localStorage.getItem(CHAVE_USUARIO);
    return cru ? (JSON.parse(cru) as Usuario) : null;
  } catch {
    return null;
  }
}

interface AuthContextType {
  session: { user: Usuario } | null;
  user: Usuario | null;
  /** Ainda descobrindo se há sessão. Antes disto não decida rota nem tela. */
  isPending: boolean;
  autenticado: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (dados: DadosCadastro) => Promise<string>;
  sair: () => Promise<void>;
  recarregar: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Começa do lembrado, SÍNCRONO: sem isto a tela pisca "deslogado" por um
  // instante antes de a resposta chegar, e o RotaProtegida chega a redirecionar.
  const [user, setUser] = useState<Usuario | null>(() => lembrado());

  // Quem é o dono do que está pendente de envio.
  //
  // O pendente é guardado no aparelho para sobreviver a recarregar — e o
  // aparelho pode ser o tablet do terreiro, onde uma pessoa sai e outra entra.
  // Sem dizer de quem ele é, o acervo de quem saiu era empurrado para dentro da
  // conta de quem entrou: não é sync, é sobrescrever a casa de outra pessoa.
  //
  // Roda também no logout (`user` vira nulo), que é quando o descarte importa.
  useEffect(() => {
    definirDono(user?.id ?? null);
  }, [user?.id]);
  const [isPending, setIsPending] = useState(true);

  const recarregar = useCallback(async () => {
    try {
      const atual = await quemSou();
      // `null` aqui é resposta do SERVIDOR (401): a sessão acabou de verdade.
      setUser(atual);
      lembrar(atual);
    } catch {
      // NÃO deslogar. Chegar aqui significa que não deu para PERGUNTAR quem é —
      // rede fora, servidor reiniciando, proxy com soluço, tempo esgotado.
      // Nada disso é "a sessão acabou": o cookie httpOnly continua no navegador
      // e volta a valer sozinho.
      //
      // Só o 401 é logout, e ele NÃO passa por aqui: `quemSou()` devolve `null`
      // nesse caso, tratado acima. Distinguir por tipo de erro era frágil
      // demais — um 500 do gateway expulsava a pessoa para o login, e na gira
      // isso custa o acesso ao repertório na hora de cantar.
      setUser(lembrado());
    } finally {
      setIsPending(false);
    }
  }, []);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  const entrar = useCallback(async (email: string, senha: string) => {
    const u = await entrarNaApi(email, senha);
    setUser(u);
    lembrar(u);
  }, []);

  /**
   * Cria a conta e devolve o recado para a tela mostrar. **Não** loga.
   *
   * O `setUser` daqui saiu junto com a sessão: o cadastro parou de abrir uma,
   * porque logar na resposta contava que o e-mail estava livre. Quem entra é
   * quem abre o link — e aí é `recarregar` que atualiza este contexto.
   */
  const cadastrar = useCallback(async (dados: DadosCadastro) => {
    const recado = await cadastrarNaApi(dados);
    return recado?.mensagem ?? "";
  }, []);

  const sair = useCallback(async () => {
    await sairDaApi();
    setUser(null);
    // Esquece na hora: sair tem que valer mesmo se a rede cair no meio.
    lembrar(null);
    // E o resto do aparelho junto — acervo, giras, fila. Sem isto o logout
    // limpava só o cookie, e no tablet do terreiro a próxima pessoa abria o
    // app vendo o acervo de quem saiu. Ver `dados/esquecer.ts`.
    esquecerDoAparelho();
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
