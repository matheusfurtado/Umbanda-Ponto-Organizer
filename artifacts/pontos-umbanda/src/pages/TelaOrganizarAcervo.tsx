import { useState } from "react";
import { TelaOrixas } from "@/pages/TelaOrixas";
import { TelaSubcategorias } from "@/pages/TelaSubcategorias";
import type { Orixa } from "@/types";

/**
 * O acervo em modo de EDIÇÃO — arrastar, renomear, criar, excluir.
 *
 * Isto era a tela principal de quem pagava. Deixou de ser: a maior parte do
 * tempo a pessoa está procurando um ponto para cantar, não reorganizando a
 * gira. Misturar as duas coisas deixava a navegação cheia de botões que só
 * servem uma vez por mês.
 *
 * Nada foi jogado fora — só saiu do caminho de quem quer achar um ponto.
 */
export function TelaOrganizarAcervo() {
  const [orixa, setOrixa] = useState<Orixa | null>(null);
  return orixa ? (
    <TelaSubcategorias orixa={orixa} onVoltar={() => setOrixa(null)} />
  ) : (
    <TelaOrixas onSelectOrixa={setOrixa} />
  );
}
