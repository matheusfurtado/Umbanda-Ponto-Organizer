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
import { TelaInicio } from "@/pages/TelaInicio";
import { TelaOrixa } from "@/pages/TelaOrixa";
import { TelaOrganizarAcervo } from "@/pages/TelaOrganizarAcervo";
import { BarraLateral } from "@/componentes/BarraLateral";
import { BarraInferior } from "@/componentes/BarraInferior";
import { EscolherPaleta } from "@/componentes/EscolherPaleta";
import { AdicionarAGira } from "@/componentes/AdicionarAGira";
import { TelaLogin } from "@/pages/TelaLogin";
import { TelaRecuperar } from "@/pages/TelaRecuperar";
import { TelaRedefinir } from "@/pages/TelaRedefinir";
import { TelaVerificar } from "@/pages/TelaVerificar";
import { TelaConta } from "@/pages/TelaConta";
import { TelaPlanos } from "@/pages/TelaPlanos";
import { TelaRetornoPagamento } from "@/pages/TelaRetornoPagamento";
import { TelaRepertorios } from "@/pages/TelaRepertorios";
import { Orixa, Ponto } from "@/types";

const FLAG_MIGRACAO = "migracao-oferecida";

function AppInner() {
  const [orixaAberto, setOrixaAberto] = useState<Orixa | null>(null);
  const [paraAdicionar, setParaAdicionar] = useState<Ponto | null>(null);
  const { ent } = useEntitlements();

  // O botão de adicionar só existe para quem tem repertório. Mostrá-lo a quem
  // não tem e abrir uma tela de "assine" seria vender empurrando: a pessoa
  // clica achando que vai fazer uma coisa e recebe outra.
  const adicionar = ent.repertorios ? setParaAdicionar : undefined;

  // A MESMA navegação para quem paga e para quem não paga. A diferença aparece
  // DENTRO do orixá, sozinha: com subcategoria vira seções da gira, sem ela
  // vira lista. Ver `TelaOrixa`.
  return (
    <>
      <AvisoTeste />
      <AvisoAcervo />
      {orixaAberto ? (
        <TelaOrixa
          orixa={orixaAberto}
          onVoltar={() => setOrixaAberto(null)}
          onAdicionar={adicionar}
        />
      ) : (
        <TelaInicio onAbrirOrixa={setOrixaAberto} onAdicionar={adicionar} />
      )}
      <AdicionarAGira ponto={paraAdicionar} onFechar={() => setParaAdicionar(null)} />
    </>
  );
}

/**
 * O esqueleto: barra fixa à esquerda no desktop, barra inferior no celular.
 *
 * Antes tudo era uma coluna estreita centralizada. Numa tela larga sobravam
 * dois terços vazios, e trocar de seção exigia voltar — cada ação custava uma
 * ida e volta. Com a navegação sempre visível, mudar de lugar é um clique de
 * onde você estiver, e o espaço horizontal vira conteúdo.
 */
function Moldura({ children }: { children: ReactNode }) {
  const [paleta, setPaleta] = useState(false);
  return (
    <div className="flex min-h-screen bg-background">
      <BarraLateral onTrocarPaleta={() => setPaleta(true)} />
      {/* `min-w-0`: sem isto um título longo estica o flex e a lista inteira
          passa a rolar na horizontal. */}
      <main className="min-w-0 flex-1 pb-16 lg:pb-0">{children}</main>
      <BarraInferior onTrocarPaleta={() => setPaleta(true)} />
      <EscolherPaleta aberto={paleta} onFechar={() => setPaleta(false)} />
    </div>
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
            <Route path="/recuperar">
              <TelaRecuperar />
            </Route>
            {/* Não é rota protegida: quem chega aqui está justamente sem
                conseguir entrar. */}
            <Route path="/redefinir">
              <TelaRedefinir />
            </Route>
            {/* Também não é protegida: o link do e-mail costuma abrir noutro
                aparelho, onde não há sessão. */}
            <Route path="/verificar">
              <TelaVerificar />
            </Route>
            {/* Daqui para baixo é o APP, e tudo mora dentro da moldura: a
                navegação fica sempre visível em vez de a pessoa ter que voltar
                para trocar de seção. As telas acima ficam de fora de propósito
                — quem está fazendo login não tem para onde navegar ainda. */}
            <Route>
              <Moldura>
                <Switch>
                  <Route path="/organizar">
                    <RotaProtegida>
                      <TelaOrganizarAcervo />
                    </RotaProtegida>
                  </Route>
                  <Route path="/planos">
                    <TelaPlanos />
                  </Route>
                  {/* Para onde o Mercado Pago devolve quem pagou. Protegida:
                      sem sessão não há o que confirmar, e a tela precisa
                      consultar os direitos da conta. */}
                  <Route path="/assinatura/retorno">
                    <RotaProtegida>
                      <TelaRetornoPagamento />
                    </RotaProtegida>
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
              </Moldura>
            </Route>
          </Switch>
          <InstallBanner />
        </AppProvider>
      </EntitlementsProvider>
    </AuthProvider>
  );
}

export default App;
