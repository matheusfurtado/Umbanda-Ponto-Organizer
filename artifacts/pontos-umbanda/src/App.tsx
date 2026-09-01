import { useEffect, useState, type ReactNode } from "react";
import { Route, Switch, Redirect } from "wouter";
import { AvisoAcervo } from "@/components/AvisoAcervo";
import { AvisoTeste } from "@/components/AvisoTeste";
import { InstallBanner } from "@/components/InstallBanner";
import { AppProvider } from "@/context";
import { AuthProvider, useAuth } from "@/auth/AuthContext";
import { GerenciadorMigracao } from "@/componentes/GerenciadorMigracao";
import { EntitlementsProvider } from "@/billing/EntitlementsContext";
import { TelaInicio } from "@/pages/TelaInicio";
import { TelaOrixa } from "@/pages/TelaOrixa";
import { TelaOrganizarAcervo } from "@/pages/TelaOrganizarAcervo";
import { BarraLateral } from "@/componentes/BarraLateral";
import { BarraInferior } from "@/componentes/BarraInferior";
import { EscolherPaleta } from "@/componentes/EscolherPaleta";
import { useAcoesDePonto } from "@/componentes/AcoesDePonto";
import { TelaEnviarPonto } from "@/pages/TelaEnviarPonto";
import { TelaMeusEnvios } from "@/pages/TelaMeusEnvios";
import { TelaModeracao } from "@/pages/TelaModeracao";
import { TelaDenuncias } from "@/pages/TelaDenuncias";
import { TelaPainel } from "@/pages/TelaPainel";
import { TelaNovidades } from "@/pages/TelaNovidades";
import { TelaArtista } from "@/pages/TelaArtista";
import { TelaModerarArtistas } from "@/pages/TelaModerarArtistas";
import { TelaSugestoesDeArtista } from "@/pages/TelaSugestoesDeArtista";
import { TelaCasamentos } from "@/pages/TelaCasamentos";
import { TelaDesativados } from "@/pages/TelaDesativados";
import { TelaRemocoesDeArtista } from "@/pages/TelaRemocoesDeArtista";
import { TelaPedirArtista } from "@/pages/TelaPedirArtista";
import { TelaArtistas } from "@/pages/TelaArtistas";
import { TelaGirasPublicas } from "@/pages/TelaGirasPublicas";
import { TelaGiraPublica } from "@/pages/TelaGiraPublica";
import { TelaLogin } from "@/pages/TelaLogin";
import { TelaPrivacidade } from "@/pages/TelaPrivacidade";
import { TelaRecuperar } from "@/pages/TelaRecuperar";
import { TelaTermos } from "@/pages/TelaTermos";
import { TelaRedefinir } from "@/pages/TelaRedefinir";
import { TelaVerificar } from "@/pages/TelaVerificar";
import { TelaConta } from "@/pages/TelaConta";
import { TelaFavoritos } from "@/pages/TelaFavoritos";
import { TelaPerfil } from "@/pages/TelaPerfil";
import { TelaSeguindo } from "@/pages/TelaSeguindo";
import { TelaPlanos } from "@/pages/TelaPlanos";
import { TelaRetornoPagamento } from "@/pages/TelaRetornoPagamento";
import { TelaRepertorios } from "@/pages/TelaRepertorios";
import { Orixa } from "@/types";

function AppInner({ focarBusca = false }: { focarBusca?: boolean }) {
  const [orixaAberto, setOrixaAberto] = useState<Orixa | null>(null);
  const { adicionar, sugerir, modais } = useAcoesDePonto();

  // A MESMA navegação para quem paga e para quem não paga. A diferença aparece
  // DENTRO do orixá, sozinha: com subcategoria vira seções da gira, sem ela
  // vira lista. Ver `TelaOrixa`.
  return (
    <>
      <AvisoTeste />
      {orixaAberto ? (
        <TelaOrixa
          orixa={orixaAberto}
          onVoltar={() => setOrixaAberto(null)}
          onAdicionar={adicionar}
          onSugerirAutor={sugerir}
        />
      ) : (
        <TelaInicio
          onAbrirOrixa={setOrixaAberto}
          onAdicionar={adicionar}
          onSugerirAutor={sugerir}
          focarBusca={focarBusca}
        />
      )}
      {modais}
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
export function Moldura({ children }: { children: ReactNode }) {
  const [paleta, setPaleta] = useState(false);
  return (
    <div className="flex min-h-screen bg-background">
      <BarraLateral onTrocarPaleta={() => setPaleta(true)} />
      {/* `min-w-0`: sem isto um título longo estica o flex e a lista inteira
          passa a rolar na horizontal. */}
      <main className="min-w-0 flex-1 pb-16 lg:pb-0">
        {/* AQUI, e não dentro do `AppInner`.
            
            Pendurada no `AppInner`, a faixa só existia na rota catch-all e em
            `/buscar` — e as telas que MUTAM o acervo são outras. `/favoritos`
            é a que dói: está nas duas barras, qualquer pessoa chega nela, e
            cada estrela chama `persistir` e entra na mesma fila. Com a fila em
            conflito o `agendar()` desiste, e cada estrela acendia na tela sem
            nunca subir, sem uma palavra — enquanto a decisão ("Manter o deste
            aparelho" / "Ficar com o do outro") só existia na outra rota.
            
            Dentro do `<main>` e não acima dele: fora, ela dividiria a linha
            com a barra lateral. */}
        <AvisoAcervo />
        {children}
        {/* Junto com a moldura, e não solta no fim do App.
            
            Solta, ela aparecia por cima do login, do verificar e-mail e do
            redefinir senha — telas que ficam FORA da moldura de propósito
            ("quem está fazendo login não tem para onde navegar ainda"). Pedir
            para instalar no meio de um cadastro é interromper a única coisa
            que a pessoa está tentando fazer. */}
        <InstallBanner />
      </main>
      <BarraInferior onTrocarPaleta={() => setPaleta(true)} />
      <EscolherPaleta aberto={paleta} onFechar={() => setPaleta(false)} />
    </div>
  );
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
            {/* FORA da moldura, ao lado do login: precisam abrir para quem
                ainda não tem conta — é justamente no cadastro que o
                consentimento é dado, e o link vai de lá para cá. */}
            <Route path="/privacidade">
              <TelaPrivacidade />
            </Route>
            <Route path="/termos">
              <TelaTermos />
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
                  {/* As duas barras têm "Buscar" apontando para cá. Sem esta
                      rota o link caía no catch-all e renderizava a tela inicial
                      sem o campo em foco — parecia funcionar, e não funcionava:
                      a aba nunca ficava marcada e o teclado nunca abria. */}
                  <Route path="/buscar">
                    <AppInner focarBusca />
                  </Route>
                  {/* Protegida: a lista de favoritos é da CONTA. Sem isto, o
                      link colado ou o histórico abriam uma tela que só sabe
                      dizer "nenhum favorito" para sempre. */}
                  <Route path="/favoritos">
                    <RotaProtegida>
                      <TelaFavoritos />
                    </RotaProtegida>
                  </Route>
                  <Route path="/novidades">
                    <TelaNovidades />
                  </Route>
                  {/* Sem RotaProtegida de propósito: a vitrine e o link de uma
                      gira precisam abrir para quem NÃO tem conta — é por eles
                      que o app circula no boca a boca do terreiro. */}
                  {/* Sem RotaProtegida: um link de perfil precisa abrir para
                      quem não tem conta, pelo mesmo motivo da vitrine. */}
                  <Route path="/perfil/:apelido">
                    <TelaPerfil />
                  </Route>
                  {/* Sem `RotaProtegida`: descobrir artista é aberto, e é
                      isso que faz alguém querer conta. Seguir, dentro da
                      página, é que pede login. */}
                  <Route path="/artistas">
                    <TelaArtistas />
                  </Route>
                  <Route path="/artista/:id">
                    <TelaArtista />
                  </Route>
                  <Route path="/seguindo">
                    <RotaProtegida>
                      <TelaSeguindo />
                    </RotaProtegida>
                  </Route>
                  <Route path="/giras-publicas">
                    <TelaGirasPublicas />
                  </Route>
                  <Route path="/gira/:id">
                    <TelaGiraPublica />
                  </Route>
                  <Route path="/enviar-ponto">
                    <RotaProtegida>
                      <TelaEnviarPonto />
                    </RotaProtegida>
                  </Route>
                  <Route path="/meus-envios">
                    <RotaProtegida>
                      <TelaMeusEnvios />
                    </RotaProtegida>
                  </Route>
                  {/* Protegida só por login. Quem não é admin recebe 404 da
                      API — a tela não decide isso sozinha. */}
                  <Route path="/quero-meu-perfil">
                    <RotaProtegida>
                      <TelaPedirArtista />
                    </RotaProtegida>
                  </Route>
                  {/* Mesma proteção da moderação: só login aqui, e a API
                      responde 404 a quem não é admin.
                      
                      O `RotaProtegida` FALTAVA aqui — era a única das seis
                      telas de admin sem ele, logo abaixo do comentário que
                      jurava o contrário. Quem abrisse a URL sem sessão (link
                      colado, histórico, o tablet do terreiro) via a tela
                      montar e falhar no fetch, em vez de ser mandado para o
                      login. A defesa de verdade está na API, que responde 404;
                      isto é o que faz a tela se comportar. */}
                  <Route path="/moderacao/remocoes">
                    <RotaProtegida>
                      <TelaRemocoesDeArtista />
                    </RotaProtegida>
                  </Route>
                  <Route path="/moderacao/artistas">
                    <RotaProtegida>
                      <TelaModerarArtistas />
                    </RotaProtegida>
                  </Route>
                  {/* Mesma proteção das outras filas: só login aqui, e a API
                      responde 404 a quem não é admin. */}
                  <Route path="/moderacao/casamentos">
                    <RotaProtegida>
                      <TelaCasamentos />
                    </RotaProtegida>
                  </Route>
                  {/* Mesma proteção das outras filas. Esta é a única que não
                      DECIDE nada — só mostra o que saiu do app —, e por isso
                      mesmo precisa existir: ninguém confere o que não lista. */}
                  <Route path="/moderacao/desativados">
                    <RotaProtegida>
                      <TelaDesativados />
                    </RotaProtegida>
                  </Route>
                  <Route path="/moderacao/sugestoes">
                    <RotaProtegida>
                      <TelaSugestoesDeArtista />
                    </RotaProtegida>
                  </Route>
                  <Route path="/moderacao">
                    <RotaProtegida>
                      <TelaModeracao />
                    </RotaProtegida>
                  </Route>
                  {/* Mesma proteção da moderação: só login aqui, e a API
                      responde 404 a quem não é admin. A tela não decide isso
                      sozinha — esconder o link é conveniência, nunca a defesa. */}
                  <Route path="/painel">
                    <RotaProtegida>
                      <TelaPainel />
                    </RotaProtegida>
                  </Route>
                  <Route path="/denuncias">
                    <RotaProtegida>
                      <TelaDenuncias />
                    </RotaProtegida>
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
        </AppProvider>
      </EntitlementsProvider>
    </AuthProvider>
  );
}

export default App;
