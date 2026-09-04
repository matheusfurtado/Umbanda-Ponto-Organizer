import { Link, useLocation } from "wouter";
import { ConviteParaEntrar } from "@/componentes/ConviteParaEntrar";
import { Heart, Home, ListMusic, Palette, Star, UserCog } from "lucide-react";
import { useEntitlements } from "@/billing/EntitlementsContext";
import { pedirPlano } from "@/billing/convite";
import { useAuth } from "@/auth/AuthContext";

/**
 * A navegação do CELULAR — fixa embaixo, onde o polegar alcança.
 *
 * A barra lateral não serve aqui: numa tela de telefone ela come metade da
 * largura, e o topo é justamente onde a mão não chega segurando o aparelho com
 * uma mão só — que é como se usa um app no meio de uma gira.
 */
export function BarraInferior({ onTrocarPaleta }: { onTrocarPaleta: () => void }) {
  const [local] = useLocation();
  const { ent } = useEntitlements();
  const { autenticado } = useAuth();

  const item = (ativo: boolean) =>
    `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition ${
      ativo ? "text-primary" : "text-muted-foreground"
    }`;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
      {/* No celular o convite é uma FAIXA acima da barra, e não um item dela:
          a barra tem cinco itens e um sexto encolheria todos. A faixa some
          quando a pessoa entra. */}
      {!autenticado && <ConviteParaEntrar compacto />}
      <nav className="flex border-t bg-card/95 backdrop-blur">
      <Link href="/" className={item(local === "/")}>
        <Home className="h-5 w-5" aria-hidden /> Início
      </Link>
      {/* "Buscar" saiu da navegação: `/buscar` renderiza o MESMO componente
          que `/`, só com o campo focado — palavras dele, *"buscar e iniciar
          são a mesma página"*. E o campo já fica visível no topo do Início.

          A ROTA continua existindo: link salvo e atalho de teclado seguem
          funcionando, e quem chega por ela cai no acervo com a busca pronta.
          O que sumiu foi a segunda porta para a mesma tela. */}
      {/* No celular a estrela é ainda mais importante: é o atalho de quem está
          no meio da gira e precisa do ponto que já separou.

          Só para quem entrou: sem conta a lista é sempre vazia, e no celular
          um item de barra que não leva a nada custa um quinto da navegação. */}
      {autenticado && (
        <Link href="/favoritos" className={item(local === "/favoritos")}>
          <Heart className="h-5 w-5" aria-hidden /> Curtidas
        </Link>
      )}
      {/* Sem o direito, o toque abre o CONVITE em vez de trocar a pessoa de
          tela. Ir parar numa tabela de preços por ter tocado em "Playlists" é
          troca de contexto no lugar de resposta — e quem fecha o convite
          continua exatamente onde estava. */}
      {ent.repertorios ? (
        <Link href="/repertorios" className={item(local.startsWith("/repertorios"))}>
          <ListMusic className="h-5 w-5" aria-hidden /> Playlists
        </Link>
      ) : (
        <button
          type="button"
          onClick={() => pedirPlano("montar-playlist")}
          className={item(false)}
        >
          <ListMusic className="h-5 w-5" aria-hidden /> Playlists
        </button>
      )}
      {/* MINHA CONTA, e no celular ela é mais necessária que no desktop.
          
          A lateral é `hidden ... lg:flex`: no telefone ela não existe. Sem este
          item, não havia caminho NENHUM para sair da conta nem para apagá-la —
          e apagar os próprios dados não é conveniência, é direito. A página
          existia e ninguém conseguia chegar nela.
          
          Só para quem entrou: para visitante o item levaria a uma tela sobre
          uma conta que não há, e custaria um sexto da navegação. */}
      {autenticado && (
        <Link href="/conta" className={item(local === "/conta")}>
          <UserCog className="h-5 w-5" aria-hidden /> Conta
        </Link>
      )}
      <button onClick={onTrocarPaleta} className={item(false)}>
        <Palette className="h-5 w-5" aria-hidden /> Cores
      </button>
      </nav>
    </div>
  );
}
