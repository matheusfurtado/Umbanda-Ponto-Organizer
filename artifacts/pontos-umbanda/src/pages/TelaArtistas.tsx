/**
 * O diretório de artistas — quem canta os pontos do acervo.
 *
 * ## Por que deixou de ser uma lista de linhas
 *
 * Eram 16 retângulos iguais, com o nome à esquerda e "N pontos" embaixo. Não
 * dava para reconhecer ninguém sem ler, e não dava para ver quem pesa mais no
 * acervo sem comparar número por número — que é justamente o que uma lista
 * ordenada por quantidade deveria responder de relance.
 *
 * Três mudanças, cada uma com uma razão:
 *
 * 1. **Avatar** (`componentes/AvatarArtista.tsx`): a foto quando existe, e
 *    senão a inicial sobre a cor tirada do nome. É o que faz reconhecer antes
 *    de ler, e é a mesma cara que o canal tem na prateleira da tela inicial e
 *    na página dele.
 * 2. **Barra proporcional** no número de pontos. O acervo vai de 10 a 44
 *    pontos por canal; a barra transforma essa diferença em algo que se lê de
 *    relance, sem transformar em ranking de qualidade — não há posição, nem
 *    medalha, nem "top". A ordem já é por quantidade e a tela diz isso.
 * 3. **Grade**, e não coluna. Numa tela larga a coluna deixava dois terços
 *    vazios; a grade cabe mais sem apertar, e no celular volta a ser uma
 *    coluna sozinha.
 *
 * ## O que NÃO entrou, e por quê
 *
 * `curado` é verdadeiro nos 16 — um selo em toda linha não distingue nada, só
 * ocupa espaço. `seguidores` é zero em todos hoje, e por isso só aparece quando
 * existe. Campo de busca também não: com 16 canais, o filtro custaria mais
 * atenção do que a rolagem que ele evita.
 */

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Mic2, Users } from "lucide-react";
import { listarArtistas, type ArtistaResumo } from "@/api/artista";
import { mensagemDeErro } from "@/api/cliente";
import { AvatarArtista } from "@/componentes/AvatarArtista";
import { BotaoSeguirArtista } from "@/componentes/BotaoSeguirArtista";
import { SugerirArtista } from "@/componentes/SugerirArtista";

export function TelaArtistas() {
  const [artistas, setArtistas] = useState<ArtistaResumo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarArtistas()
      .then(setArtistas)
      .catch((e) => setErro(mensagemDeErro(e, "Falha ao carregar.")));
  }, []);

  // A referência da barra é o MAIOR do acervo, não um teto fixo: com teto fixo
  // as barras encolheriam todas juntas no dia em que o acervo crescer, e a
  // comparação — que é a única coisa que a barra existe para dar — sumiria.
  const maior = Math.max(1, ...(artistas ?? []).map((a) => a.pontos));

  return (
    <div className="max-w-4xl px-4 pb-24 pt-5 sm:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
        <Mic2 className="h-6 w-6 text-primary" aria-hidden /> Artistas
      </h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Quem canta os pontos do acervo. Os mais seguidos vêm primeiro — seguir é
        o que põe o artista na sua biblioteca, e o que traz ele para a frente
        desta lista.
      </p>

      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}

      {artistas === null ? (
        erro ? null : (
          <div aria-busy="true" className="grid gap-3 sm:grid-cols-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted/40" />
            ))}
          </div>
        )
      ) : artistas.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nenhum artista no acervo ainda.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {artistas.map((a) => (
            /* Link dentro de link, ou botão dentro de link, é HTML inválido:
               o navegador desfaz o aninhamento e o de dentro deixa de
               funcionar, SEM ERRO NENHUM. É a mesma armadilha do
               `CartaoGira`, e a saída é a mesma: o cartão é um contêiner
               posicionado, o link cobre tudo (`absolute inset-0`), e o botão
               de seguir fica ACIMA dessa camada (`relative z-10`). Nenhum dos
               dois está dentro do outro — eles se sobrepõem. */
            <li
              key={a.id}
              className="group relative flex items-center gap-4 rounded-2xl border bg-card/40 p-4 transition hover:border-primary/40 hover:bg-accent/40"
            >
              <Link
                href={`/artista/${encodeURIComponent(a.id)}`}
                aria-label={`Abrir a página de ${a.nome.trim()}`}
                className="absolute inset-0 z-0 rounded-2xl"
              />
              <span className="pointer-events-none">
                <AvatarArtista nome={a.nome} foto={a.foto} tamanho="md" />
              </span>
                <span className="pointer-events-none min-w-0 flex-1">
                  {/* Duas linhas, e não truncado numa: os nomes daqui são de
                      casa ("Tenda Espírita S. Jorge Pai Joaquim D'Angola") e
                      cortar no meio apaga justamente o que identifica o
                      terreiro. */}
                  <span className="block font-semibold leading-snug text-foreground group-hover:text-primary [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
                    {a.nome.trim()}
                  </span>
                  <span className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="tabular-nums">
                      {a.pontos} {a.pontos === 1 ? "ponto" : "pontos"}
                    </span>
                    {a.seguidores > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" aria-hidden />
                        {a.seguidores}
                      </span>
                    )}
                  </span>
                  {/* `aria-hidden`: a barra REPETE o número que está logo
                      acima. Anunciá-la faria o leitor de tela dizer duas vezes
                      a mesma coisa. */}
                  <span
                    aria-hidden
                    className="mt-2 block h-1 w-full overflow-hidden rounded-full bg-muted"
                  >
                    <span
                      className="block h-full rounded-full bg-primary/60 transition-[width]"
                      style={{ width: `${Math.round((a.pontos / maior) * 100)}%` }}
                    />
                  </span>
                </span>

              {/* ACIMA da camada do link (`relative z-10`), senão o clique no
                  botão abriria a página em vez de seguir. */}
              <span className="relative z-10 shrink-0">
                <BotaoSeguirArtista
                  artistaId={a.id}
                  seguindo={a.seguindo}
                  compacto
                  onMudou={(s) =>
                    setArtistas((lista) =>
                      lista === null
                        ? lista
                        : lista.map((x) =>
                            x.id === a.id
                              ? { ...x, seguindo: s, seguidores: x.seguidores + (s ? 1 : -1) }
                              : x,
                          ),
                    )
                  }
                />
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Depois da lista: é rolando até o fim que a pessoa conclui que o canal
          dela não está aqui. No vazio vale ainda mais — sem isto, "Nenhum
          artista no acervo ainda" é um beco. */}
      <SugerirArtista />
    </div>
  );
}
