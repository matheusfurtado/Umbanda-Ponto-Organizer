import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Mic2, Music2 } from "lucide-react";
import { listarArtistas, type ArtistaResumo } from "@/api/artista";
import { AvatarArtista } from "@/componentes/AvatarArtista";

/**
 * Quem canta os pontos — no ALTO da tela inicial.
 *
 * Artistas existia só como uma entrada na barra lateral. No celular a barra
 * lateral não existe, e a barra inferior não tem espaço para o item: quem abre
 * o app no telefone — que é como se usa isto no meio de uma gira — não tinha
 * caminho nenhum para a página de artista.
 *
 * ## Por que em cima, e não no rodapé
 *
 * Ficou embaixo na primeira versão, depois dos orixás, das linhas e dos
 * momentos. Numa tela de celular isso é longe o bastante para não existir.
 * Decisão do Matheus: sobe. O custo é real — empurra o índice de orixás, que é
 * o que a maioria vem buscar, para baixo —, e é por isso que esta é uma
 * PRATELEIRA de rolagem horizontal, e não um grid: ocupa uma faixa de altura
 * fixa, mostra dez em vez de seis, e devolve a tela ao acervo logo abaixo.
 *
 * ## Estados
 *
 * Carregando, erro e vazio são tratados de propósito (regra da fase 1). E o
 * erro aqui NÃO pode derrubar a tela inicial: o acervo é o que a pessoa veio
 * buscar, artista é acréscimo. Falhou, a prateleira some e o resto fica.
 */
const QUANTOS = 10;

export function ArtistasEmDestaque() {
  const [artistas, setArtistas] = useState<ArtistaResumo[] | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let vivo = true;
    listarArtistas()
      .then((l) => vivo && setArtistas(l))
      // Sem texto de erro: a mensagem completa mora em `/artistas`, que é a
      // tela DELES. Aqui, uma faixa vermelha acima do acervo custaria mais
      // atenção do que a informação vale.
      .catch(() => vivo && setErro(true));
    return () => {
      vivo = false;
    };
  }, []);

  if (erro) return null;
  if (artistas !== null && artistas.length === 0) return null;

  return (
    <section aria-label="Artistas" className="mb-10">
      <h2 className="mb-1 flex items-center gap-2 px-2 text-lg font-bold text-foreground">
        <Mic2 className="h-5 w-5 text-primary" aria-hidden />
        Artistas
        {/* "ver mais", e não "ver todos os 16": o número dava uma precisão
            que não ajuda ninguém a decidir se vale tocar — e envelhece, porque
            cada canal novo muda o rótulo de um botão que faz sempre a mesma
            coisa. */}
        {artistas !== null && artistas.length > QUANTOS && (
          <Link href="/artistas" className="ml-auto text-xs font-medium text-primary underline">
            ver mais
          </Link>
        )}
      </h2>
      <p className="mb-3 px-2 text-sm text-muted-foreground">
        Quem canta os pontos do acervo.
      </p>

      {/* Rolagem HORIZONTAL, contida: a página nunca rola de lado por causa
          desta faixa — a barra fica dentro dela. `-mx-2 px-2` deixa o primeiro
          e o último cartão encostarem na margem da tela em vez de flutuarem. */}
      <div className="-mx-2 flex gap-4 overflow-x-auto px-2 pb-2">
        {artistas === null
          ? Array.from({ length: 6 }, (_, i) => (
              <div key={i} aria-busy="true" className="w-24 shrink-0">
                <div className="h-16 w-16 animate-pulse rounded-full bg-muted/40" />
                <div className="mt-2 h-3 w-20 animate-pulse rounded bg-muted/40" />
              </div>
            ))
          : artistas.slice(0, QUANTOS).map((a) => (
              <Link
                key={a.id}
                href={`/artista/${encodeURIComponent(a.id)}`}
                className="group w-24 shrink-0 text-center"
              >
                <span className="flex justify-center">
                <AvatarArtista nome={a.nome} foto={a.foto} tamanho="md" />
                </span>
                <span className="mt-2 block truncate text-sm font-semibold text-foreground group-hover:text-primary">
                  {a.nome}
                </span>
                <span className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Music2 className="h-3 w-3 shrink-0" aria-hidden />
                  {a.pontos} {a.pontos === 1 ? "ponto" : "pontos"}
                </span>
              </Link>
            ))}
      </div>
    </section>
  );
}
