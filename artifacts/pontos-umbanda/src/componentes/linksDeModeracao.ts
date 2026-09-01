/**
 * Os lugares de quem modera — uma lista só, para os dois lugares que a mostram.
 *
 * ## Por que isto virou módulo
 *
 * A barra lateral e o recuo do celular (`TelaConta`) mantinham a lista à mão,
 * cada um a sua. A lateral tinha oito links; o celular tinha três — faltavam
 * casamentos, "Fora do app", sugestões de artista, perfis de artista e pedidos
 * para sair.
 *
 * **As duas maiores em volume eram justamente as que faltavam**: 395 casamentos
 * e 1.031 pontos fora do app. E a barra lateral é `lg:` para cima, num app cujo
 * próprio código anota que "quem modera este app é uma pessoa só, e o aparelho
 * dela é o celular".
 *
 * Lista mantida à mão em dois lugares é lista que diverge — foi o que
 * aconteceu, sem que nada acusasse. Aqui ela é uma só, e o teste confere que os
 * dois lugares mostram todos.
 *
 * O link só APARECE para admin, por conveniência. A defesa é a rota, que
 * responde 404 a quem não for.
 */

import {
  ArchiveX, BadgeCheck, BarChart3, EyeOff, Flag, Mic2, ScanSearch, ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export interface LinkDeModeracao {
  href: string;
  /** O rótulo curto — o mesmo nos dois lugares, para não virar dois produtos. */
  rotulo: string;
  icone: LucideIcon;
  /** Uma linha sobre o que a fila decide, mostrada só no celular. */
  oQueDecide?: string;
}

export const LINKS_DE_MODERACAO: LinkDeModeracao[] = [
  {
    href: "/moderacao",
    rotulo: "Moderação",
    icone: ShieldCheck,
    oQueDecide: "pontos enviados pela comunidade",
  },
  {
    href: "/moderacao/artistas",
    rotulo: "Perfis de artista",
    icone: BadgeCheck,
    oQueDecide: "esta pessoa é quem diz ser?",
  },
  // Fila SEPARADA da de cima, e não a mesma com um filtro: as duas respondem
  // perguntas diferentes — "esta pessoa é quem diz ser?" (tem código de prova) e
  // "este canal merece uma página?" (não tem o que provar).
  {
    href: "/moderacao/sugestoes",
    rotulo: "Sugestões de artista",
    icone: Mic2,
    oQueDecide: "este canal merece uma página?",
  },
  // A fila mais pesada em número, e cada "sim" devolve um link ao acervo.
  {
    href: "/moderacao/casamentos",
    rotulo: "Verificar casamento",
    icone: ScanSearch,
    oQueDecide: "o vídeo é mesmo deste ponto?",
  },
  // Logo abaixo da de casamento porque as duas contam a mesma história pelas
  // duas pontas: aqui o acervo que saiu do app, lá o palpite que o traria.
  {
    href: "/moderacao/desativados",
    rotulo: "Fora do app",
    icone: ArchiveX,
    oQueDecide: "letras trazidas do YouTube, esperando conferência",
  },
  // Separado de "Denúncias" de propósito: denúncia é alguém apontando conteúdo
  // de terceiro; isto é a pessoa da página pedindo para sair dela.
  {
    href: "/moderacao/remocoes",
    rotulo: "Pedidos para sair",
    icone: EyeOff,
    oQueDecide: "o artista pediu para sair da página dele",
  },
  {
    href: "/denuncias",
    rotulo: "Denúncias",
    icone: Flag,
    oQueDecide: "conteúdo apontado por alguém",
  },
  { href: "/painel", rotulo: "Painel", icone: BarChart3 },
];
