
/**
 * Meu acervo — a estante do que eu guardei.
 *
 * ## O que esta tela deixou de ser
 *
 * Ela era o EDITOR do acervo pessoal: arrastar, renomear, criar e excluir
 * orixá, seção e ponto sobre uma cópia do acervo inteiro. E era isso que
 * produzia o defeito que ele descreveu em 02/09: *"eu apaguei do organizar
 * acervo e no início não consigo acessar mais"*. A cópia não era uma seleção —
 * era a fonte de tudo que ele via.
 *
 * ADR 0009, decidido por ele: *"o organizar acervo tem que nascer vazio, e
 * assim que eu clicar seja em um orixá/playlist e em curtir, ele aparece em
 * organizar acervo, seria uma biblioteca de playlist, algo parecido como o meus
 * artistas, só que com playlist"*.
 *
 * ## Nada foi apagado
 *
 * O acervo pessoal de quem já organizou continua no banco, intocado, e há uma
 * exportação em `backups/`. O que mudou é que ele deixou de ser o que a pessoa
 * lê: a descoberta vem do catálogo (`GET /catalogo`), e esta tela mostra a
 * estante.
 *
 * O editor continua no repositório (`TelaOrixas`, `TelaSubcategorias`) sem
 * ninguém o alcançar. É dívida assumida e anotada: código de tela sem porta é o
 * defeito que o `/organizar` teve por meses, e não pode virar permanente.
 */

import { BookMarked } from "lucide-react";
import { Estante } from "@/componentes/Estante";

export function TelaOrganizarAcervo() {
  return (
    <div className="max-w-3xl px-4 pb-24 pt-5 sm:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
        <BookMarked className="h-6 w-6 text-primary" aria-hidden /> Meu acervo
      </h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        O que você guardou. Orixás e playlists que você salvar do início
        aparecem aqui — e nada entra sozinho.
      </p>
      <Estante />
    </div>
  );
}
