import { useEffect, useState, type ReactNode } from "react";
import { Link, Redirect, Route, Switch, useLocation } from "wouter";
import { AvisoAcervo } from "@/components/AvisoAcervo";
import { AvisoTeste } from "@/components/AvisoTeste";
import { InstallBanner } from "@/components/InstallBanner";
import { PopUpDoPlano } from "@/componentes/PopUpDoPlano";
import { AppProvider, useApp } from "@/context";
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
import { TelaPalpites } from "@/pages/TelaPalpites";
import { TelaSemVideo } from "@/pages/TelaSemVideo";
import { TelaRemocoesDeArtista } from "@/pages/TelaRemocoesDeArtista";
import { TelaPedirArtista } from "@/pages/TelaPedirArtista";
import { TelaArtistas } from "@/pages/TelaArtistas";
import { TelaGirasPublicas } from "@/pages/TelaGirasPublicas";
import { TelaGiraPublica } from "@/pages/TelaGiraPublica";
import { TelaLogin } from "@/pages/TelaLogin";
import { TelaConsentimentoGoogle } from "@/pages/TelaConsentimentoGoogle";
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

/**
 * O orixá aberto por URL.
 *
 * Ele abria só por estado, e por isso não tinha endereço: não dava para
 * compartilhar "os pontos de Ogum", nem para a biblioteca (ADR 0009) levar a
 * ele — um item de estante que não abre não é estante, é lista.
 *
 * A tela inicial passou a navegar para cá em vez de guardar estado próprio.
 * Duas portas para a mesma sala é o que faz uma delas envelhecer sozinha.
 */
export function OrixaPorId({ id }: { id: string }) {
  const [, navegar] = useLocation();
  // NO CATÁLOGO, e não no acervo dela.
  //
  // A tela inicial lista os orixás do catálogo (ids canônicos: "ogum"), e quem
  // organizou o acervo tem ids PREFIXADOS ("276b070d:ogum"). Procurando em
  // `dados`, o clique em qualquer orixá caía no "não achei" — *"por que no
  // início as playlist tão vazias? só aparece voltar ao início"* (02/09).
  //
  // Regressão minha, do mesmo dia: troquei a fonte da LISTA e esqueci a fonte
  // do DESTINO. As duas têm de vir do mesmo lugar.
  const { catalogo } = useApp();
  const { adicionar, sugerir, modais } = useAcoesDePonto();
  const orixa = catalogo.orixas.find((o) => o.id === id);

  if (!orixa) {
    return (
      <div className="max-w-2xl px-4 pb-24 pt-5 sm:px-8">
        <p className="text-sm text-muted-foreground">
          Não achei essa entidade no acervo.
        </p>
        <Link href="/" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-2">
          Voltar ao início
        </Link>
      </div>
    );
  }

  return (
    <>
      <TelaOrixa
        orixa={orixa}
        onVoltar={() => navegar("/")}
        onAdicionar={adicionar}
        onSugerirAutor={sugerir}
      />
      {modais}
    </>
  );
}

function AppInner({ focarBusca = false }: { focarBusca?: boolean }) {
  const [, navegar] = useLocation();
  const { adicionar, sugerir, modais } = useAcoesDePonto();

  // A MESMA navegação para quem paga e para quem não paga. A diferença aparece
  // DENTRO do orixá, sozinha: com subcategoria vira seções da gira, sem ela
  // vira lista. Ver `TelaOrixa`.
  return (
    <>
      <AvisoTeste />
      <TelaInicio
        onAbrirOrixa={(o: Orixa) => navegar(`/orixa/${encodeURIComponent(o.id)}`)}
        onAdicionar={adicionar}
        onSugerirAutor={sugerir}
        focarBusca={focarBusca}
      />
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
        {/* Ao lado da faixa de instalar, e pelo mesmo motivo: dentro da
            moldura, ele fica fora do login, do cadastro e do redefinir senha —
            telas em que a pessoa está tentando fazer UMA coisa, e vender no
            meio disso é interromper justamente ela. */}
        <PopUpDoPlano />
      </main>
      <BarraInferior onTrocarPaleta={() => setPaleta(true)} />
      <EscolherPaleta aberto={paleta} onFechar={() => setPaleta(false)} />
    </div>
  );
}

/**
 * O DESTINO SOBREVIVE AO LOGIN.
 *
 * Antes daqui saía um `<Redirect to="/login" />` seco, e o endereço de origem
 * morria. Quem recebesse o link de uma gira do pai de santo caía no login,
 * criasse conta, e aterrissava na tela inicial — sem a gira que veio ver.
 *
 * É o jeito mais comum de matar um funil de convite: a pessoa faz tudo certo e
 * o app perde o motivo dela ter vindo. Com `?voltar=`, o login sabe para onde
 * devolver, e `entrarDepois()` é quem lê.
 */
function RotaProtegida({ children }: { children: ReactNode }) {
  const { autenticado, isPending } = useAuth();
  const [aqui] = useLocation();
  if (isPending) return null;
  if (!autenticado) {
    return <Redirect to={`/login?voltar=${encodeURIComponent(aqui)}`} />;
  }
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
            <Route path="/entrar/consentimento">
              <TelaConsentimentoGoogle />
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
                  {/* Pública: a letra é grátis (ADR 0002), e é pedindo ajuda
                      que se recebe ajuda. Indicar é que exige conta. */}
                  {/* O orixá ganhou endereço: ver ADR 0009 e `OrixaPorId`. */}
                  <Route path="/orixa/:id">
                    {(params) => <OrixaPorId id={decodeURIComponent(params.id)} />}
                  </Route>
                  <Route path="/sem-video">
                    <TelaSemVideo />
                  </Route>
                  <Route path="/novidades">
                    <TelaNovidades />
                  </Route>
                  {/* A VITRINE (`/giras-publicas`) abre sem conta: é por ela que
                      o app circula no boca a boca do terreiro, e a lista só tem
                      nome e tamanho das giras. ABRIR uma gira, não — desde
                      03/09 pede conta, que é onde há algo a ganhar em
                      atravessar a barreira. */}
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
                    <RotaProtegida>
                      <TelaGiraPublica />
                    </RotaProtegida>
                  </Route>
                  {/* O link que se compartilha. `RotaProtegida` de propósito:
                      *"acho que o link a pessoa precisa estar logada também"*.
                      A conta é grátis — a barreira é conta, nunca plano, senão
                      ninguém compartilha e o link morre na mão de quem recebeu. */}
                  <Route path="/g/:token">
                    <RotaProtegida>
                      <TelaGiraPublica />
                    </RotaProtegida>
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
                  {/* A fila que a de casamento não cobre: lá só cabe sim ou
                      não ao primeiro palpite, e ela nem enxerga os
                      `nao_encontrado`. */}
                  <Route path="/moderacao/palpites">
                    <RotaProtegida>
                      <TelaPalpites />
                    </RotaProtegida>
                  </Route>
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
