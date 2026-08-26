import { useState, type ReactNode } from "react";
import { AdicionarAGira } from "@/componentes/AdicionarAGira";
import { SugerirAutor } from "@/componentes/SugerirAutor";
import { useAuth } from "@/auth/AuthContext";
import { useEntitlements } from "@/billing/EntitlementsContext";
import type { Ponto } from "@/types";

/**
 * As duas ações que qualquer linha de ponto oferece: pôr numa gira e sugerir
 * o autor — com os modais que elas abrem.
 *
 * Mora num lugar só porque vale em várias telas. Enquanto estava escrita
 * dentro do `AppInner`, "Novos do mês" ficava sem as duas: a rota é irmã e não
 * filha, então não herdava nada. A pessoa via o ponto novo e não conseguia
 * levá-lo para a gira — que é justamente o que ela quer fazer com um ponto que
 * acabou de descobrir.
 *
 * É a mesma lição de `servicos/video_do_ponto.py` no servidor: regra que vale
 * em mais de uma rota, reimplementada em cada uma, diverge.
 */
export function useAcoesDePonto(): {
  adicionar: ((p: Ponto) => void) | undefined;
  sugerir: ((p: Ponto) => void) | undefined;
  modais: ReactNode;
} {
  const [paraAdicionar, setParaAdicionar] = useState<Ponto | null>(null);
  const [paraAutoria, setParaAutoria] = useState<Ponto | null>(null);
  const { ent } = useEntitlements();
  const { autenticado } = useAuth();

  return {
    // O botão de adicionar só existe para quem tem repertório. Mostrá-lo a
    // quem não tem e abrir uma tela de "assine" seria vender empurrando: a
    // pessoa clica achando que vai fazer uma coisa e recebe outra.
    adicionar: ent.repertorios ? setParaAdicionar : undefined,
    // Sugerir autor não depende de plano — depende de ter conta, porque a
    // sugestão precisa de um responsável.
    sugerir: autenticado ? setParaAutoria : undefined,
    modais: (
      <>
        <AdicionarAGira ponto={paraAdicionar} onFechar={() => setParaAdicionar(null)} />
        <SugerirAutor ponto={paraAutoria} onFechar={() => setParaAutoria(null)} />
      </>
    ),
  };
}
