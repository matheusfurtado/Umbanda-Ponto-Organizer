import { useEffect, useState, type ReactNode } from "react";
import { Route, Switch, Redirect } from "wouter";
import { InstallBanner } from "@/components/InstallBanner";
import { ModalMigracao } from "@/components/ModalMigracao";
import { AppProvider } from "@/context";
import { AuthProvider, useAuth } from "@/auth/AuthContext";
import { EntitlementsProvider } from "@/billing/EntitlementsContext";
import { TelaOrixas } from "@/pages/TelaOrixas";
import { TelaSubcategorias } from "@/pages/TelaSubcategorias";
import { TelaLogin } from "@/pages/TelaLogin";
import { TelaConta } from "@/pages/TelaConta";
import { TelaPlanos } from "@/pages/TelaPlanos";
import { Orixa } from "@/types";

const FLAG_MIGRACAO = "migracao-oferecida";

function AppInner() {
  const [orixaSelecionado, setOrixaSelecionado] = useState<Orixa | null>(null);

  if (orixaSelecionado) {
    return <TelaSubcategorias orixa={orixaSelecionado} onVoltar={() => setOrixaSelecionado(null)} />;
  }

  return <TelaOrixas onSelectOrixa={setOrixaSelecionado} />;
}

// Oferece a migração uma única vez, logo após o login, se houver dados locais.
// O modo anônimo nunca vê isto. Fechar (mesmo "Agora não") marca como oferecido.
function GerenciadorMigracao() {
  const { autenticado, isPending } = useAuth();
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (isPending || !autenticado) return;
    if (localStorage.getItem(FLAG_MIGRACAO) === "1") return;
    if (localStorage.getItem("pontos-umbanda-data")) setAberto(true);
  }, [autenticado, isPending]);

  const fechar = () => {
    localStorage.setItem(FLAG_MIGRACAO, "1");
    setAberto(false);
  };

  return <ModalMigracao aberto={aberto} onFechar={fechar} />;
}

function RotaProtegida({ children }: { children: ReactNode }) {
  const { autenticado, isPending } = useAuth();
  if (isPending) return null;
  if (!autenticado) return <Redirect to="/login" />;
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <EntitlementsProvider>
        <AppProvider>
          <Switch>
            <Route path="/login">
              <TelaLogin />
            </Route>
            <Route path="/planos">
              <TelaPlanos />
            </Route>
            <Route path="/conta">
              <RotaProtegida>
                <TelaConta />
              </RotaProtegida>
            </Route>
            <Route>
              <AppInner />
              <GerenciadorMigracao />
            </Route>
          </Switch>
          <InstallBanner />
        </AppProvider>
      </EntitlementsProvider>
    </AuthProvider>
  );
}

export default App;
