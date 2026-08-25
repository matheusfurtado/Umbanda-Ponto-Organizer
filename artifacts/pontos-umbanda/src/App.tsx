import { useEffect, useState, type ReactNode } from "react";
import { Route, Switch, Redirect } from "wouter";
import { AvisoAcervo } from "@/components/AvisoAcervo";
import { AvisoTeste } from "@/components/AvisoTeste";
import { InstallBanner } from "@/components/InstallBanner";
import { ModalMigracao } from "@/components/ModalMigracao";
import { AppProvider } from "@/context";
import { AuthProvider, useAuth } from "@/auth/AuthContext";
import { useEntitlements } from "@/billing/EntitlementsContext";
import { EntitlementsProvider } from "@/billing/EntitlementsContext";
import { TelaAcervoSimples } from "@/pages/TelaAcervoSimples";
import { TelaOrixas } from "@/pages/TelaOrixas";
import { TelaSubcategorias } from "@/pages/TelaSubcategorias";
import { TelaLogin } from "@/pages/TelaLogin";
import { TelaConta } from "@/pages/TelaConta";
import { TelaPlanos } from "@/pages/TelaPlanos";
import { TelaRepertorios } from "@/pages/TelaRepertorios";
import { Orixa } from "@/types";

const FLAG_MIGRACAO = "migracao-oferecida";

function AppInner() {
  const { ent, loading } = useEntitlements();
  const [orixaSelecionado, setOrixaSelecionado] = useState<Orixa | null>(null);

  // Sem plano, o servidor não envia orixás nem subcategorias (ADR 0002). A tela
  // de hierarquia recebia lista vazia e dizia "Nenhum Orixá ainda — toque em +
  // para adicionar" a quem tem 520 pontos: parecia app quebrado. A lista corrida
  // mostra o que a pessoa REALMENTE tem.
  if (!loading && !ent.acervoOrganizado) {
    return (
      <>
        <AvisoTeste />
        <AvisoAcervo />
        <TelaAcervoSimples />
      </>
    );
  }

  // A faixa de estado fica ACIMA da tela, nunca no lugar dela: informar que o
  // dado veio do cache não pode custar o acesso à letra do ponto.
  return (
    <>
      <AvisoTeste />
      <AvisoAcervo />
      {orixaSelecionado ? (
        <TelaSubcategorias orixa={orixaSelecionado} onVoltar={() => setOrixaSelecionado(null)} />
      ) : (
        <TelaOrixas onSelectOrixa={setOrixaSelecionado} />
      )}
    </>
  );
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
            <Route path="/repertorios">
              <RotaProtegida>
                <TelaRepertorios />
              </RotaProtegida>
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
