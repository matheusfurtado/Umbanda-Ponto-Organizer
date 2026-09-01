/**
 * Fora do app — o que saiu do acervo e o que chegou do YouTube esperando olhar.
 *
 * ## Duas pilhas, e o cabeçalho mentia sobre as duas
 *
 * A tela dizia "Pontos sem nenhuma gravação de artista" para a lista inteira.
 * Era falso para 809 das 1.031 linhas: as trazidas do YouTube TÊM letra, vídeo
 * e artista — é exatamente por isso que estão aqui, esperando conferência. As
 * outras 222 são acervo de verdade sem gravação nenhuma. São problemas opostos
 * e a tela os apresentava como um só.
 *
 * ## Por que ela não escalava
 *
 * Mandava as 1.031 numa resposta só, um clique por item, sem filtro e sem
 * descarte — a 20 s cada, quatro horas de rolagem. E o extrator acerta 89%, ou
 * seja, cerca de um em nove é crédito ou recado no lugar do verso: sem
 * descarte, esse item ficava na lista para sempre.
 *
 * Agora: pedaços de 50, filtro por origem, por artista e por texto, marcação
 * múltipla com teto, e a letra inteira em vez dos 240 caracteres que faziam 71%
 * das aprovações serem às cegas.
 *
 * ## Trabalhar um artista por vez
 *
 * É como alguém confere de verdade: o ouvido calibra no estilo do canal, e os
 * erros do extrator se repetem dentro do mesmo canal. Sem o filtro, as letras
 * de dezesseis artistas chegam embaralhadas pela ordem litúrgica.
 *
 * ## O que continua sem botão
 *
 * O ponto que SAIU do acervo não tem "Pôr no app" nem "Descartar". O caminho de
 * volta dele é ganhar uma gravação de artista — devolvê-lo mudo seria repor no
 * app exatamente o que o tirou de lá —, e descartá-lo seria usar esta tela para
 * apagar acervo litúrgico, que é o oposto do que ela existe para fazer.
 */

import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import {
  ArchiveX, BadgeCheck, ExternalLink, Loader2, ScanSearch, Trash2, Youtube,
} from "lucide-react";
import { mensagemDeErro } from "@/api/cliente";
import {
  acaoEmLote, descartarPonto, pontosDesativados, POR_VEZ, quantosForaDoApp,
  reativarPonto, type FiltroForaDoApp, type PontoDesativado,
  type QuantosForaDoApp,
} from "@/api/desativados";

/** Preserva a ordem que o servidor mandou — que é a ordem litúrgica. */
function porOrixa(lista: PontoDesativado[]) {
  const grupos = new Map<string, PontoDesativado[]>();
  for (const p of lista) {
    const atual = grupos.get(p.orixa);
    if (atual) atual.push(p);
    else grupos.set(p.orixa, [p]);
  }
  return [...grupos.entries()];
}

export function TelaDesativados() {
  const [lista, setLista] = useState<PontoDesativado[] | null>(null);
  const [contas, setContas] = useState<QuantosForaDoApp | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [temMais, setTemMais] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [marcados, setMarcados] = useState<Set<string>>(new Set());

  const [origem, setOrigem] = useState<FiltroForaDoApp["origem"]>(undefined);
  const [artista, setArtista] = useState<string>("");
  const [busca, setBusca] = useState<string>("");

  /**
   * Traz mais um pedaço, a partir de quantos já estão na tela.
   *
   * `desde = atual.length` e não número de página: cada decisão tira a linha da
   * lista, então ela encolhe enquanto se trabalha nela, e quem aprovasse 10 e
   * pedisse a "página 1" pularia 10 que nunca viu.
   */
  const trazer = useCallback(
    async (atual: PontoDesativado[], filtro: FiltroForaDoApp) => {
      setBuscando(true);
      try {
        const novos = await pontosDesativados({ ...filtro, desde: atual.length });
        setTemMais(novos.length === POR_VEZ);
        const vistos = new Set(atual.map((p) => p.id));
        setLista([...atual, ...novos.filter((p) => !vistos.has(p.id))]);
      } catch (problema) {
        setErro(mensagemDeErro(problema, "Falha ao carregar."));
        setLista((l) => l ?? []);
      } finally {
        setBuscando(false);
      }
    },
    [],
  );

  // Trocar de filtro RECOMEÇA a lista, e limpa o que estava marcado: manter a
  // marcação através de um filtro faria alguém aprovar em lote o que não está
  // mais vendo.
  useEffect(() => {
    setMarcados(new Set());
    setLista(null);
    void trazer([], { origem, artista: artista || undefined, busca });
  }, [origem, artista, busca, trazer]);

  useEffect(() => {
    quantosForaDoApp().then(setContas).catch(() => undefined);
  }, []);

  const filtroAtual: FiltroForaDoApp = {
    origem, artista: artista || undefined, busca,
  };

  function tirarDaLista(ids: string[]) {
    const foram = new Set(ids);
    setLista((l) => (l === null ? l : l.filter((p) => !foram.has(p.id))));
    setMarcados((m) => new Set([...m].filter((id) => !foram.has(id))));
    setContas((c) => (c === null ? c : { ...c, total: c.total - ids.length }));
  }

  async function decidir(id: string, acao: "reativar" | "descartar") {
    setOcupado(id);
    setErro(null);
    try {
      if (acao === "reativar") await reativarPonto(id);
      else await descartarPonto(id);
      tirarDaLista([id]);
    } catch (problema) {
      setErro(mensagemDeErro(problema, "Não consegui agora."));
    } finally {
      setOcupado(null);
    }
  }

  async function decidirMarcados(acao: "reativar" | "descartar") {
    const ids = [...marcados];
    if (!ids.length) return;
    setOcupado("lote");
    setErro(null);
    try {
      const r = await acaoEmLote(ids, acao);
      tirarDaLista(ids);
      if (r.feitos < r.pedidos) {
        // Diferença é normal — id que já saiu da fila por outra aba — e tem de
        // ser dita: silêncio aqui vira "cliquei e não aconteceu nada".
        setErro(
          `${r.feitos} de ${r.pedidos} foram. Os outros já tinham saído da fila.`,
        );
      }
    } catch (problema) {
      setErro(mensagemDeErro(problema, "Não consegui agora."));
    } finally {
      setOcupado(null);
    }
  }

  function alternar(id: string) {
    setMarcados((m) => {
      const novo = new Set(m);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  const daParaDecidir = (p: PontoDesativado) => p.doYoutube;
  const aba = (ligada: boolean) =>
    `min-h-11 rounded-md px-3 text-sm font-medium ${
      ligada ? "bg-primary text-primary-foreground" : "border"
    }`;

  return (
    <div className="max-w-3xl px-4 pb-24 pt-5 sm:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
        <ArchiveX className="h-6 w-6 text-primary" aria-hidden /> Fora do app
      </h1>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">
        Nada aqui foi apagado. São duas pilhas com problemas opostos: letras
        trazidas do YouTube <strong className="text-foreground">esperando
        conferência</strong>, e pontos do acervo{" "}
        <strong className="text-foreground">sem gravação de artista</strong>.
      </p>

      {contas && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => setOrigem(undefined)}
                  className={aba(origem === undefined)}>
            Tudo ({contas.total})
          </button>
          <button type="button" onClick={() => setOrigem("youtube")}
                  className={aba(origem === "youtube")}>
            Trazidos do YouTube ({contas.youtube})
          </button>
          <button type="button" onClick={() => setOrigem("acervo")}
                  className={aba(origem === "acervo")}>
            Do acervo, sem artista ({contas.acervo})
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <label className="flex-1">
          <span className="sr-only">Procurar por título ou letra</span>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Procurar no título ou na letra"
            className="min-h-11 w-full rounded-md border bg-background px-3 text-sm"
          />
        </label>
        {contas && contas.artistas.length > 0 && (
          <label>
            <span className="sr-only">Filtrar por artista</span>
            <select
              value={artista}
              onChange={(e) => setArtista(e.target.value)}
              className="min-h-11 rounded-md border bg-background px-3 text-sm"
            >
              <option value="">Todos os artistas</option>
              {contas.artistas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome.trim()} ({a.quantos})
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {marcados.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-3">
          <span className="text-sm">
            <strong className="text-foreground">{marcados.size}</strong> marcados
          </span>
          <button
            type="button"
            onClick={() => void decidirMarcados("reativar")}
            disabled={ocupado === "lote"}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {ocupado === "lote" ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <BadgeCheck className="h-4 w-4" aria-hidden />
            )}
            Pôr no app
          </button>
          <button
            type="button"
            onClick={() => void decidirMarcados("descartar")}
            disabled={ocupado === "lote"}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm font-medium disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" aria-hidden /> Descartar
          </button>
        </div>
      )}

      {erro && <p role="alert" className="mb-4 text-sm text-destructive">{erro}</p>}

      {lista === null ? (
        erro ? null : (
          <div aria-busy="true" className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/40" />
            ))}
          </div>
        )
      ) : lista.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          Nada aqui com esse filtro.
        </p>
      ) : (
        <div className="space-y-6">
          {porOrixa(lista).map(([orixa, pontos]) => (
            <section key={orixa}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
                {orixa} · {pontos.length}
              </h2>
              <ul className="space-y-2">
                {pontos.map((p) => (
                  <li key={p.id} className="rounded-xl border bg-card/40 p-3">
                    <div className="flex items-start gap-2">
                      {daParaDecidir(p) && (
                        <input
                          type="checkbox"
                          checked={marcados.has(p.id)}
                          onChange={() => alternar(p.id)}
                          aria-label={`Marcar ${p.titulo}`}
                          className="mt-1 h-4 w-4 shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground">{p.titulo}</p>
                        <p className="text-xs text-muted-foreground">{p.subcategoria}</p>
                      </div>
                    </div>

                    {p.letra.trim() && (
                      // A letra INTEIRA, rolando aqui dentro. Vinha cortada em
                      // 240 caracteres e 71% das aprovações eram feitas vendo um
                      // pedaço — sendo que o entulho do extrator costuma estar
                      // justamente no fim do bloco.
                      <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-2 font-sans text-xs text-muted-foreground">
                        {p.letra}
                      </pre>
                    )}

                    {p.doYoutube && (
                      <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2">
                        <p className="text-xs text-muted-foreground">
                          Letra trazida da descrição deste vídeo
                          {p.artistaNome && <> · {p.artistaNome}</>}
                        </p>
                        {p.videoUrl && (
                          <a
                            href={p.videoUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-2"
                          >
                            <ExternalLink className="h-4 w-4" aria-hidden /> Abrir o vídeo
                          </a>
                        )}
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void decidir(p.id, "reativar")}
                            disabled={ocupado === p.id}
                            className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                          >
                            {ocupado === p.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                            ) : (
                              <BadgeCheck className="h-4 w-4" aria-hidden />
                            )}
                            Pôr no app
                          </button>
                          <button
                            type="button"
                            onClick={() => void decidir(p.id, "descartar")}
                            disabled={ocupado === p.id}
                            className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm font-medium disabled:opacity-60"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden /> Descartar
                          </button>
                        </div>
                      </div>
                    )}

                    <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {p.candidatas > 0 ? (
                        <span className="inline-flex items-center gap-1.5">
                          <ScanSearch className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          {p.candidatas} palpite{p.candidatas > 1 ? "s" : ""} de vídeo
                        </span>
                      ) : (
                        <span>nenhum palpite de vídeo ainda</span>
                      )}
                      {p.temVideo && !p.doYoutube && (
                        <span className="inline-flex items-center gap-1.5">
                          <Youtube className="h-3.5 w-3.5 shrink-0" aria-hidden />
                          tem vídeo, de canal não curado
                        </span>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {lista !== null && lista.length > 0 && temMais && (
        <button
          type="button"
          onClick={() => void trazer(lista, filtroAtual)}
          disabled={buscando}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm font-medium disabled:opacity-60"
        >
          {buscando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Ver mais
        </button>
      )}

      {contas && contas.acervo > 0 && (
        <p className="mt-6 rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
          Os <strong className="text-foreground">{contas.acervo}</strong> pontos do
          acervo voltam sozinhos quando ganharem gravação de artista — o caminho
          é a{" "}
          <Link
            href="/moderacao/casamentos"
            className="font-medium text-primary underline underline-offset-2"
          >
            fila de casamento
          </Link>
          , não um botão aqui.
        </p>
      )}
    </div>
  );
}
