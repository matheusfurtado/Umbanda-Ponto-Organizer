import { Link, useLocation } from "wouter";
import { BadgeCheck, BarChart3, EyeOff, Flag, Globe, Home, Library, ListMusic, Mic2, Palette, Plus, Search, Send, ShieldCheck, Sparkles, Star } from "lucide-react";
import { useApp } from "@/context";
import { Avatar } from "@/componentes/Avatar";
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
      <Link href="/" className={item(local === "/")}>
        <Home className="h-4 w-4" aria-hidden /> Início
      </Link>
      <Link href="/buscar" className={item(local === "/buscar")}>
        <Search className="h-4 w-4" aria-hidden /> Buscar
      </Link>

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
          <Star className="h-4 w-4" aria-hidden /> Favoritos
          {favoritos > 0 && (
            <span className="ml-auto text-xs tabular-nums text-muted-foreground">{favoritos}</span>
          )}
        </Link>
      )}

      <Link href="/novidades" className={item(local === "/novidades")}>
        <Sparkles className="h-4 w-4" aria-hidden /> Novos do mês
      </Link>
      <Link href="/giras-publicas" className={item(local.startsWith("/giras-publicas"))}>
        <Globe className="h-4 w-4" aria-hidden /> Playlists da comunidade
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
          <Library className="h-4 w-4" aria-hidden /> Biblioteca
        </Link>
      )}
      {/* Só para quem escolheu apelido: sem ele não existe perfil, e um link
          para uma página que responde 404 é pior que link nenhum. */}
      {autenticado && user?.apelido && (
        <Link
          href={`/perfil/${encodeURIComponent(user.apelido)}`}
          className={item(local === `/perfil/${encodeURIComponent(user.apelido)}`)}
        >
          <Avatar apelido={user.apelido} foto={user.foto} tamanho="sm" /> Meu perfil
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
              rota, que responde 404 a quem não for. */}
          {user?.admin && (
            <>
              <Link href="/moderacao" className={item(local === "/moderacao")}>
                <ShieldCheck className="h-4 w-4" aria-hidden /> Moderação
              </Link>
              <Link
                href="/moderacao/artistas"
                className={item(local === "/moderacao/artistas")}
              >
                <BadgeCheck className="h-4 w-4" aria-hidden /> Perfis de artista
              </Link>
              {/* Fila SEPARADA da de cima, e não a mesma com um filtro. As duas
                  respondem perguntas diferentes: "esta pessoa é quem diz ser?"
                  (tem código de prova) e "este canal merece uma página?" (não
                  tem o que provar — quem sugeriu não controla o canal). */}
              <Link
                href="/moderacao/sugestoes"
                className={item(local === "/moderacao/sugestoes")}
              >
                <Mic2 className="h-4 w-4" aria-hidden /> Sugestões de artista
              </Link>
              {/* Separado de "Denúncias" de propósito: denúncia é alguém
                  apontando conteúdo de terceiro; isto é a pessoa da página
                  pedindo para sair dela. Misturar os dois faria o segundo
                  esperar na fila do primeiro. */}
              <Link
                href="/moderacao/remocoes"
                className={item(local === "/moderacao/remocoes")}
              >
                <EyeOff className="h-4 w-4" aria-hidden /> Pedidos para sair
              </Link>
              <Link href="/denuncias" className={item(local === "/denuncias")}>
                <Flag className="h-4 w-4" aria-hidden /> Denúncias
              </Link>
              <Link href="/painel" className={item(local === "/painel")}>
                <BarChart3 className="h-4 w-4" aria-hidden /> Painel
              </Link>
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
