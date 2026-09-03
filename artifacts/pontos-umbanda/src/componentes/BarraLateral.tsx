import { Link, useLocation } from "wouter";
import { ConviteParaEntrar } from "@/componentes/ConviteParaEntrar";
import { LINKS_DE_MODERACAO } from "@/componentes/linksDeModeracao";
import { Heart, ArchiveX, BadgeCheck, SlidersHorizontal, VideoOff, BarChart3, EyeOff, Flag, Globe, Home, Library, ListMusic, Mic2, Palette, Plus, ScanSearch, Send, ShieldCheck, Sparkles, Star, UserCog } from "lucide-react";
import { useApp } from "@/context";
import { useEntitlements } from "@/billing/EntitlementsContext";
import { useAuth } from "@/auth/AuthContext";

/**
 * A navegação fixa — sempre visível no desktop.
 *
 * Antes tudo era uma coluna estreita no meio da tela: para trocar de orixá,
 * voltar; para ver repertório, voltar de novo. Toda ação custava um passo de
 * ida e volta, e a tela larga ficava vazia dos dois lados.
 *
 * Com a lateral fixa, mudar de seção é UM clique de onde você estiver, e o
 * espaço horizontal passa a ser usado para conteúdo.
 *
 * No celular ela some: lá o certo é a barra inferior (`BarraInferior`), porque
 * o polegar não alcança o topo da tela.
 */
export function BarraLateral({ onTrocarPaleta }: { onTrocarPaleta: () => void }) {
  const [local] = useLocation();
  const { dados } = useApp();
  const favoritos = dados.pontos.filter((p) => p.favorito).length;
  // Só os orixás MESMO. Isto era `tipo !== "momento"`, o que bastava enquanto
  // havia dois tipos — e passou a contar Preto Velho, Boiadeiro e as outras
  // linhas como orixás no instante em que o terceiro nasceu.
  //
  // `tipo` ausente conta como orixá: é o cache de quem abriu o app antes desta
  // versão, e some-lo da conta seria pior que contá-lo junto.
  const orixas = dados.orixas.filter(
    (o) => o.tipo === "orixa" || o.tipo === undefined,
  ).length;
  const linhas = dados.orixas.filter((o) => o.tipo === "linha").length;
  const { ent } = useEntitlements();
  const { autenticado, user } = useAuth();

  const item = (ativo: boolean) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
      ativo
        ? "bg-accent text-accent-foreground"
        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
    }`;

  return (
    <aside className="hidden w-60 shrink-0 flex-col gap-2 border-r bg-card/40 p-3 lg:flex">
      {/* O convite fica no TOPO para quem não entrou: é o primeiro item da
          navegação, e some inteiro quando ela entra. */}
      {!autenticado && <ConviteParaEntrar />}
      <Link href="/" className={item(local === "/")}>
        <Home className="h-4 w-4" aria-hidden /> Início
      </Link>
      {/* "Buscar" saiu da navegação: `/buscar` renderiza o MESMO componente
          que `/`, só com o campo focado — palavras dele, *"buscar e iniciar
          são a mesma página"*. E o campo já fica visível no topo do Início.

          A ROTA continua existindo: link salvo e atalho de teclado seguem
          funcionando, e quem chega por ela cai no acervo com a busca pronta.
          O que sumiu foi a segunda porta para a mesma tela. */}

      {/* A estrela precisava levar a algum lugar. Ela aparecia em toda linha de
          ponto e o único lugar que mostrava o resultado era uma seção do
          Início, com no máximo oito e escondida quando vazia — então quem
          favoritava de dentro de um orixá não via nada acontecer.

          E favoritar passou a ser de quem tem conta: sem sessão, o favorito
          vive só neste aparelho e some na primeira troca de celular, sem nada
          avisar. A estrela continua na lista e leva ao login (ver
          `componentes/BotaoFavorito.tsx`); o item de menu, não — menu que abre
          uma lista sempre vazia é promessa quebrada em toda abertura. */}
      {autenticado && (
        <Link href="/favoritos" className={item(local === "/favoritos")}>
          <Heart className="h-4 w-4" aria-hidden /> Curtidas
          {favoritos > 0 && (
            <span className="ml-auto text-xs tabular-nums text-muted-foreground">{favoritos}</span>
          )}
        </Link>
      )}

      {/* A ferramenta pela qual se COBRA, e não havia um único link para ela.
          `/organizar` existia como rota desde sempre — arrastar, renomear,
          criar e excluir orixá, seção e ponto — e só chegava lá quem digitasse
          a URL. O produto pago era, na prática, invisível.

          Aparece para quem tem conta, não para quem tem plano: a própria tela
          explica que sem plano não há o que organizar (ADR 0002 achata o
          acervo do grátis), e esconder o link faria a pessoa não descobrir o
          que está comprando. */}
      {autenticado && (
        <Link href="/organizar" className={item(local === "/organizar")}>
          <SlidersHorizontal className="h-4 w-4" aria-hidden /> Organizar acervo
        </Link>
      )}

      <Link href="/novidades" className={item(local === "/novidades")}>
        <Sparkles className="h-4 w-4" aria-hidden /> Novos do mês
      </Link>
      <Link href="/giras-publicas" className={item(local.startsWith("/giras-publicas"))}>
        <Globe className="h-4 w-4" aria-hidden /> Playlists da comunidade
      </Link>
      {/* Aberta como Artistas, e pelo mesmo motivo somado a outro: é um pedido
          de ajuda, e pedido escondido não é pedido. Quem só quiser ver o que
          falta não precisa de conta; indicar precisa. */}
      <Link href="/sem-video" className={item(local === "/sem-video")}>
        <VideoOff className="h-4 w-4" aria-hidden /> Pontos sem vídeo
      </Link>
      {/* Artistas é aberto: quem ainda não tem conta descobre por aqui, e é
          isso que faz alguém querer uma. */}
      <Link href="/artistas" className={item(local.startsWith("/artista"))}>
        <Mic2 className="h-4 w-4" aria-hidden /> Artistas
      </Link>
      {autenticado && (
        <Link href="/quero-meu-perfil" className={item(local === "/quero-meu-perfil")}>
          <BadgeCheck className="h-4 w-4" aria-hidden /> Tenho um canal
        </Link>
      )}
      {autenticado && (
        <Link href="/seguindo" className={item(local === "/seguindo")}>
          <Library className="h-4 w-4" aria-hidden /> Meus artistas
        </Link>
      )}
      {/* "Meu perfil" saiu daqui e virou link DENTRO de "Minha conta".
          
          Palavras dele: *"minha conta e meu perfil é a mesma coisa, então
          unifica"*. Por dentro não são — conta é o que só a pessoa mexe, perfil
          é o que os outros veem —, mas como PORTA DE ENTRADA são: as duas
          significam "eu", e duas entradas para "eu" fazem parar e escolher sem
          motivo.
          
          O perfil continua existindo e continua tendo URL própria: é ela que se
          compartilha. O que sumiu foi a segunda porta, não a página. */}

      {/* MINHA CONTA — a página existia e não tinha link nenhum.
          
          Só se chegava nela digitando a URL, ou por um link solto dentro da
          Política de Privacidade. É onde moram "Sair da conta" e "Apagar
          conta": a saída da própria conta estava inalcançável pela interface,
          e o direito de apagar os dados também.
          
          Vem DEPOIS de "Meu perfil" de propósito: as duas são "sobre mim", e a
          pública primeiro — perfil é o que os outros veem, conta é o que só a
          pessoa mexe. */}
      {autenticado && (
        <Link href="/conta" className={item(local === "/conta")}>
          <UserCog className="h-4 w-4" aria-hidden /> Minha conta
        </Link>
      )}

      {/* Contribuir exige CONTA, não plano: o acervo cresce por quem canta, e
          cobrar para contribuir afastaria quem tem ponto para dar. */}
      {autenticado && (
        <div className="mt-4 border-t pt-4">
          <span className="mb-2 block px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Comunidade
          </span>
          <Link href="/enviar-ponto" className={item(local === "/enviar-ponto")}>
            <Send className="h-4 w-4" aria-hidden /> Enviar um ponto
          </Link>
          <Link href="/meus-envios" className={item(local === "/meus-envios")}>
            <ListMusic className="h-4 w-4" aria-hidden /> Meus envios
          </Link>
          {/* O link só aparece para admin por conveniência. A defesa está na
              rota, que responde 404 a quem não for.

              A lista vive em `linksDeModeracao.ts` e é a MESMA que a TelaConta
              mostra no celular. Mantida à mão nos dois lugares, ela divergiu:
              aqui eram oito e lá três, e as duas filas maiores em volume
              (casamentos e "Fora do app") estavam justamente entre as que
              faltavam no aparelho de quem modera. */}
          {user?.admin && (
            <>
              {LINKS_DE_MODERACAO.map(({ href, rotulo, icone: Icone }) => (
                <Link key={href} href={href} className={item(local === href)}>
                  <Icone className="h-4 w-4" aria-hidden /> {rotulo}
                </Link>
              ))}
            </>
          )}
        </div>
      )}

      <div className="mt-4 border-t pt-4">
        <div className="mb-2 flex items-center justify-between px-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Repertórios
          </span>
          {ent.repertorios && (
            <Link href="/repertorios" aria-label="Novo repertório">
              <Plus className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </Link>
          )}
        </div>

        {ent.repertorios ? (
          <Link href="/repertorios" className={item(local.startsWith("/repertorios"))}>
            <ListMusic className="h-4 w-4" aria-hidden /> Minhas playlists
          </Link>
        ) : (
          // O convite fica no lugar onde o recurso VIVERIA. Explicar o que se
          // ganha vale mais que um botão "assine" solto no topo.
          <Link
            href="/planos"
            className="mx-1 block rounded-lg border border-dashed p-3 text-xs leading-snug text-muted-foreground hover:border-primary/40 hover:text-foreground"
          >
            Monte a sequência da sua gira e leve no celular, inclusive offline.
            <span className="mt-1 block font-medium text-primary">Ver planos</span>
          </Link>
        )}
      </div>

      <div className="mt-auto space-y-2 border-t pt-3">
        <button onClick={onTrocarPaleta} className={`${item(false)} w-full`}>
          <Palette className="h-4 w-4" aria-hidden /> Aparência
        </button>
        <p className="px-3 text-[11px] text-muted-foreground">
          {dados.pontos.length} pontos · {orixas} orixás{linhas > 0 ? ` · ${linhas} linhas` : ""}
        </p>
        {/* O caminho de dentro do app para os textos legais. Quem já tem conta
            não passa mais pela tela de cadastro, e precisa poder reler o que
            aceitou — a LGPD dá o direito de saber, e direito sem caminho é
            promessa. */}
        <p className="px-3 pt-1 text-[11px] text-muted-foreground/70">
          <Link href="/privacidade" className="hover:text-foreground hover:underline">
            Privacidade
          </Link>
          {" · "}
          <Link href="/termos" className="hover:text-foreground hover:underline">
            Termos
          </Link>
        </p>
      </div>
    </aside>
  );
}
