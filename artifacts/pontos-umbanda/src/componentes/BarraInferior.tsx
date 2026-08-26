import { Link, useLocation } from "wouter";
import { Home, Search, ListMusic, Palette } from "lucide-react";
import { useEntitlements } from "@/billing/EntitlementsContext";

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

  const item = (ativo: boolean) =>
    `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition ${
      ativo ? "text-primary" : "text-muted-foreground"
    }`;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-card/95 backdrop-blur lg:hidden">
      <Link href="/" className={item(local === "/")}>
        <Home className="h-5 w-5" aria-hidden /> Início
      </Link>
      <Link href="/buscar" className={item(local === "/buscar")}>
        <Search className="h-5 w-5" aria-hidden /> Buscar
      </Link>
      <Link
        href={ent.repertorios ? "/repertorios" : "/planos"}
        className={item(local.startsWith("/repertorios"))}
      >
        <ListMusic className="h-5 w-5" aria-hidden /> Giras
      </Link>
      <button onClick={onTrocarPaleta} className={item(false)}>
        <Palette className="h-5 w-5" aria-hidden /> Cores
      </button>
    </nav>
  );
}
