/**
 * Repertórios de gira — montar a sequência que será cantada.
 *
 * O uso real é na gira: celular na mão, luz baixa, gente esperando. Por isso
 * alvos grandes, a ordem sempre visível, e nada que exija precisão de mira.
 *
 * A reordenação usa @dnd-kit, o mesmo do resto do app — arrastar já é o gesto
 * que a pessoa aprendeu nas outras telas.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { CapaGira } from "@/componentes/CapaGira";
import { PublicarGira } from "@/componentes/PublicarGira";
import type { ItemEnviado } from "@/api/repertorio";
import { Link } from "wouter";
import {
  ArrowLeft,
  CloudOff,
  GripVertical,
  Loader2,
  Users,
  Music,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  Tag,
  Globe,
  Lock,
  Youtube,
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { ModalConfirmar } from "@/components/ModalConfirmar";
import { useApp } from "@/context";
import { ehErroDeRede, mensagemDeErro } from "@/api/cliente";
import { destacar, semAcento } from "@/lib/destacar";
import { duracao } from "@/lib/duracao";
import { apagar, criar, type ItemRepertorio, type Repertorio } from "@/api/repertorio";
import { registrarCliqueNoPonto } from "@/api/metricas";
import {
  carregar as carregarRepertorios,
  definirSequencia,
  guardar,
  ligarRetomadaAutomatica,
  observarSincronia,
  sincronizarAgora,
  type EstadoSincronia,
  type FonteRepertorios,
  forcarEnvio,
  descartarPendente,
} from "@/dados/repertorios";

function ItemArrastavel({
  item,
  posicao,
  aoRemover,
  aoMudarSecao,
}: {
  item: ItemRepertorio;
  posicao: number;
  aoRemover: () => void;
  aoMudarSecao?: () => void;
}) {
  // A chave inclui a POSIÇÃO, não só o ponto: o mesmo ponto pode aparecer duas
  // vezes na gira (abrir e fechar com ele é comum), e chaves repetidas fariam
  // o dnd-kit embaralhar os dois.
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${posicao}:${item.pontoId}`,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-2 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        aria-label={`Mover ${item.titulo ?? "ponto"}`}
        className="min-h-11 cursor-grab touch-none px-1 text-muted-foreground"
      >
        <GripVertical className="h-4 w-4" aria-hidden />
      </button>
      <span className="w-6 shrink-0 text-center text-xs font-semibold text-muted-foreground">
        {posicao + 1}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-foreground">
          {item.titulo ?? <em className="text-muted-foreground">ponto removido do acervo</em>}
        </span>
        {(item.autor || item.videoCanal?.trim()) && (
          <span className="block truncate text-xs text-muted-foreground">
            {item.autor || item.videoCanal?.trim()}
          </span>
        )}
      </span>
      {duracao(item.videoDuracaoSeg) && (
        <span className="hidden w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground sm:block">
          {duracao(item.videoDuracaoSeg)}
        </span>
      )}
      {item.videoUrl && (
        <a
          href={item.videoUrl}
          onClick={() => registrarCliqueNoPonto(item.pontoId, "gira")}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Ouvir no YouTube"
          // `flex items-center`: sem isto o ícone encosta no topo da caixa de
          // 44px e fica desalinhado dos outros botões da linha — os <button>
          // centralizam sozinhos, o <a> não.
          className={`flex min-h-11 shrink-0 items-center px-2 ${
            // `revisar` é palpite. Sinalizar aqui também evita a pessoa montar a
            // gira confiando num casamento fraco e descobrir na hora de cantar.
            item.videoStatus === "revisar" ? "text-amber-400" : "text-red-400"
          }`}
          title={item.videoStatus === "revisar" ? "Vídeo provável — confira antes" : "Ouvir"}
        >
          <Youtube className="h-4 w-4" aria-hidden />
        </a>
      )}
      {aoMudarSecao && (
        <button
          onClick={aoMudarSecao}
          aria-label={`Mudar a parte da playlist de ${item.titulo ?? "ponto"}`}
          title="Parte da playlist"
          className="min-h-11 shrink-0 px-2 text-muted-foreground hover:text-foreground"
        >
          <Tag className="h-4 w-4" aria-hidden />
        </button>
      )}
      <button
        onClick={aoRemover}
        aria-label={`Tirar ${item.titulo ?? "ponto"} da playlist`}
        className="min-h-11 shrink-0 px-2 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

function Adicionar({ aoEscolher }: { aoEscolher: (pontoId: string) => void }) {
  const { dados } = useApp();
  const [busca, setBusca] = useState("");

  const achados = useMemo(() => {
    const termo = semAcento(busca.trim());
    if (!termo) return [];
    return dados.pontos
      .filter((p) => semAcento(p.titulo).includes(termo) || semAcento(p.letra).includes(termo))
      .slice(0, 12);
  }, [dados.pontos, busca]);

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar ponto para incluir..."
          aria-label="Buscar ponto para incluir na playlist"
          className="min-h-11 w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
        />
      </div>
      {busca.trim() !== "" && (
        <div className="mt-2 space-y-1">
          {achados.length === 0 ? (
            <p className="px-1 py-2 text-xs text-muted-foreground">
              Nenhum ponto com “{busca}”.
            </p>
          ) : (
            achados.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  aoEscolher(p.id);
                  setBusca("");
                }}
                className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-left text-sm text-foreground hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                <span className="flex-1 truncate">{destacar(p.titulo, busca)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Diz de onde vieram os repertórios e se há mudança por subir.
 *
 * Nunca bloqueia: na gira, um aviso entre a pessoa e a sequência é pior que
 * dado um pouco velho. A gira está no aparelho e continua.
 */
function FaixaSincronia({
  fonte,
  motivo,
  sincronia,
  nomeDe,
  aoResolver,
}: {
  fonte: FonteRepertorios;
  motivo?: string;
  sincronia: EstadoSincronia;
  nomeDe: (id: string) => string;
  aoResolver: () => void;
}) {
  // As duas saídas do conflito falam com a rede: uma relê a versão do servidor
  // antes de gravar, a outra busca a gira de lá para repor a tela. Sem estado
  // de andamento os botões ficam idênticos a antes do clique numa rede lenta, e
  // sem tratamento de erro a falha some — bem no momento em que a pessoa decide
  // qual sequência da gira dela sobrevive.
  const [resolvendo, setResolvendo] = useState(false);
  const [erroDecisao, setErroDecisao] = useState<string | null>(null);

  async function decidir(acao: () => Promise<void>) {
    setResolvendo(true);
    setErroDecisao(null);
    try {
      await acao();
      aoResolver();
    } catch (problema) {
      setErroDecisao(
        ehErroDeRede(problema)
          ? "Sem conexão agora. Sua playlist continua guardada neste aparelho — tente de novo quando a rede voltar."
          : "Não consegui falar com o servidor. Sua playlist continua guardada neste aparelho.",
      );
    } finally {
      setResolvendo(false);
    }
  }
  // O conflito vem ANTES de tudo: é o único estado desta faixa que pede uma
  // decisão em vez de informar. Enquanto ele estiver aberto, o envio automático
  // não insiste — a gira fica parada esperando a pessoa, e ela precisa saber.
  if (sincronia.conflitos.length > 0) {
    const id = sincronia.conflitos[0];
    return (
      <div
        role="alert"
        className="mb-3 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs"
      >
        <div className="flex items-start gap-2">
          <CloudOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
          <p className="flex-1">
            <strong className="font-medium">{nomeDe(id)}</strong> mudou em outro
            aparelho depois que você mexeu nela aqui. Nada foi perdido: as duas
            versões existem, e você escolhe qual fica.
            {sincronia.conflitos.length > 1 &&
              ` (+${sincronia.conflitos.length - 1} outra${
                sincronia.conflitos.length > 2 ? "s" : ""
              } esperando)`}
          </p>
        </div>
        {erroDecisao && (
          <p role="alert" className="mt-2 leading-snug text-destructive">
            {erroDecisao}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void decidir(() => forcarEnvio(id))}
            disabled={resolvendo}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border px-3 font-medium disabled:opacity-60"
          >
            {resolvendo && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {resolvendo ? "Enviando…" : "Mandar a deste aparelho"}
          </button>
          <button
            type="button"
            onClick={() => void decidir(() => descartarPendente(id))}
            disabled={resolvendo}
            className="min-h-11 rounded-md border px-3 font-medium disabled:opacity-60"
          >
            Ficar com a do outro
          </button>
        </div>
      </div>
    );
  }

  if (sincronia.pendentes > 0) {
    return (
      <div
        role="status"
        className="mb-3 flex items-center gap-2 rounded-lg border bg-muted/60 px-3 py-2 text-xs text-muted-foreground"
      >
        <UploadCloud className="h-4 w-4 shrink-0" aria-hidden />
        <span className="flex-1">
          {sincronia.enviando
            ? "Salvando sua playlist…"
            : sincronia.ultimoErro
              ? `Sua playlist está salva neste aparelho, mas ainda não subiu — ${sincronia.ultimoErro}.`
              : "Sua playlist está salva neste aparelho e vai subir em instantes."}
        </span>
        {!sincronia.enviando && (
          <button
            type="button"
            onClick={sincronizarAgora}
            className="min-h-11 shrink-0 px-2 font-medium underline underline-offset-2"
          >
            Enviar agora
          </button>
        )}
      </div>
    );
  }

  if (fonte === "cache") {
    return (
      <div
        role="status"
        className="mb-3 flex items-center gap-2 rounded-lg border bg-muted/60 px-3 py-2 text-xs text-muted-foreground"
      >
        <CloudOff className="h-4 w-4 shrink-0" aria-hidden />
        <span className="flex-1">
          Mostrando a playlist guardada neste aparelho — {motivo}.
        </span>
      </div>
    );
  }

  return null;
}

/**
 * Completa o item com o que o acervo local sabe.
 *
 * Ponto incluído SEM REDE volta do cache sem título — o servidor é quem o
 * devolve, e ele não respondeu. Mas o acervo inteiro já está no aparelho, então
 * o título sai dali. Sem isto, incluir um ponto na gira offline mostraria uma
 * linha em branco, que é pior que não deixar incluir.
 */
function completar(item: ItemRepertorio, acervo: { id: string; titulo: string }[]): ItemRepertorio {
  if (item.titulo) return item;
  const doAcervo = acervo.find((p) => p.id === item.pontoId);
  return doAcervo ? { ...item, titulo: doAcervo.titulo } : item;
}

export function TelaRepertorios() {
  // O acervo local completa o título de ponto incluído sem rede.
  const { dados } = useApp();
  // Os MESMOS sensores das outras telas. Sem configurá-los, o arraste
  // simplesmente não engata: o padrão do dnd-kit não tem distância de
  // ativação, e no toque o gesto vira rolagem da página antes de virar arraste
  // — que é justo o que acontece com o celular na mão, na gira.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );
  const [lista, setLista] = useState<Repertorio[] | null>(null);
  const [aberto, setAberto] = useState<Repertorio | null>(null);
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [fonte, setFonte] = useState<FonteRepertorios>("servidor");
  const [motivoFonte, setMotivoFonte] = useState<string | undefined>();
  const [sincronia, setSincronia] = useState<EstadoSincronia>({ enviando: false, pendentes: 0, conflitos: [] });
  const [editandoSecao, setEditandoSecao] = useState<number | null>(null);
  const [publicando, setPublicando] = useState<Repertorio | null>(null);
  /**
   * A gira que a pessoa mandou apagar, esperando confirmação.
   *
   * Apagar era DIRETO: um toque na lixeira e o `DELETE` saía, sem pergunta e
   * sem volta — o servidor apaga a linha de verdade, não marca. E a lixeira
   * fica a 16px do canto do cartão, colada no alvo principal, VISÍVEL no
   * toque (`[@media(hover:hover)]:opacity-0` só a esconde onde há mouse).
   *
   * O uso real desta tela, segundo o docstring dela mesma, é "celular na mão,
   * luz baixa, gente esperando". Era a única exclusão do app sem confirmação:
   * apagar um PONTO pergunta, apagar uma subcategoria pergunta, apagar um
   * orixá pergunta. A gira inteira — que é a funcionalidade paga, e que a
   * pessoa monta ao longo de semanas — não perguntava nada.
   */
  const [paraApagar, setParaApagar] = useState<Repertorio | null>(null);
  const [textoSecao, setTextoSecao] = useState("");

  const carregar = useCallback(async () => {
    const r = await carregarRepertorios();
    setLista(r.repertorios);
    setFonte(r.fonte);
    setMotivoFonte(r.motivo);
    setAberto((atual) =>
      atual ? (r.repertorios.find((x) => x.id === atual.id) ?? atual) : null,
    );
  }, []);

  useEffect(() => {
    void carregar();
    return ligarRetomadaAutomatica();
  }, [carregar]);

  useEffect(() => observarSincronia(setSincronia), []);

  /**
   * Grava a sequência. **Não espera o servidor.** O cache é atualizado de forma
   * síncrona, então a tela fica certa mesmo sem rede — que é o caso da gira. O
   * envio vai por fila e retoma sozinho quando a conexão volta.
   */
  const salvarSequencia = (rep: Repertorio, itens: ItemEnviado[]) => {
    const atualizados = definirSequencia(rep.id, itens);
    setLista(atualizados);
    setAberto(atualizados.find((r) => r.id === rep.id) ?? rep);
  };

  const aoSoltar = (e: DragEndEvent) => {
    if (!aberto || !e.over || e.active.id === e.over.id) return;
    const ids = aberto.itens.map((i, n) => `${n}:${i.pontoId}`);
    const de = ids.indexOf(String(e.active.id));
    const para = ids.indexOf(String(e.over.id));
    // Move o ITEM inteiro, com a seção junto: mover só o id faria o ponto
    // trocar de parte da gira ao ser arrastado, o que ninguém pediu.
    const itens = aberto.itens.map((i) => ({ pontoId: i.pontoId, secao: i.secao ?? null }));
    const [movido] = itens.splice(de, 1);
    itens.splice(para, 0, movido);
    salvarSequencia(aberto, itens);
  };

  // ------------------------------------------------------------------ detalhe
  if (aberto) {
    return (
      <div className="min-h-full">
        <div className="max-w-4xl px-4 pb-24 pt-5 sm:px-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAberto(null)}
            className="-ml-2 mb-4 gap-1.5 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Meus repertórios
          </Button>

          <div className="mb-6 flex flex-col gap-5 sm:flex-row sm:items-end">
            <div className="h-32 w-32 shrink-0 sm:h-40 sm:w-40">
              <CapaGira nome={aberto.nome} />
            </div>
            <div className="min-w-0 pb-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Playlist
              </p>
              <div className="mt-1 flex items-center gap-2">
                <h1 className="break-words text-3xl font-black leading-tight text-foreground sm:text-4xl">
                  {aberto.nome}
                </h1>
                {sincronia.enviando && (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
                )}
              </div>
              {/* O estado atual é o próprio botão: ver "Só minha" e poder
                  clicar ali é mais direto que um interruptor separado com um
                  rótulo explicando o que ele faz. */}
              <button
                onClick={() => setPublicando(aberto)}
                className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  aberto.publico
                    ? "bg-primary/15 text-primary hover:bg-primary/25"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {aberto.publico
                  ? <><Globe className="h-3.5 w-3.5" /> Pública</>
                  : <><Lock className="h-3.5 w-3.5" /> Só minha</>}
              </button>
            </div>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            {aberto.itens.length} ponto{aberto.itens.length === 1 ? "" : "s"}
            {/* Duração total: quem monta a gira precisa saber se ela cabe no
                tempo da sessão. Soma só o que tem duração conhecida. */}
            {(() => {
              const seg = aberto.itens.reduce((t, i) => t + (i.videoDuracaoSeg ?? 0), 0);
              return seg > 0 ? ` · cerca de ${Math.round(seg / 60)} min` : "";
            })()}
            {" · arraste para mudar a ordem"}
          </p>

          <PublicarGira
            gira={publicando}
            onFechar={() => setPublicando(null)}
            onMudou={(r) => {
              const atualizada = (lista ?? []).map((x) =>
                x.id === r.id ? { ...x, publico: r.publico } : x);
              setLista(atualizada);
              guardar(atualizada);
              setAberto({ ...aberto, publico: r.publico });
            }}
          />

          <FaixaSincronia
            fonte={fonte}
            motivo={motivoFonte}
            sincronia={sincronia}
            nomeDe={(id) => lista?.find((r) => r.id === id)?.nome ?? "Sua playlist"}
            aoResolver={() => void carregar()}
          />

          {erro && (
            <p role="alert" className="mb-3 text-sm text-destructive">
              {erro}
            </p>
          )}

          <div className="mb-4">
            <Adicionar
              aoEscolher={(pontoId) =>
                salvarSequencia(aberto, [
                  ...aberto.itens.map((i) => ({ pontoId: i.pontoId, secao: i.secao ?? null })),
                  // Entra solto: quem adiciona daqui está montando a lista, e
                  // escolher a parte da gira é outro gesto.
                  { pontoId, secao: null },
                ])
              }
            />
          </div>

          {aberto.itens.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <Music className="mx-auto mb-3 h-8 w-8" aria-hidden />
              <p className="font-medium">Playlist vazia</p>
              <p className="mt-1 text-sm">Busque acima para incluir o primeiro ponto.</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={aoSoltar}>
              <SortableContext
                items={aberto.itens.map((i, n) => `${n}:${i.pontoId}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {aberto.itens.map((item, n) => {
                    // Cabeçalho quando a parte da gira MUDA. A lista continua
                    // sendo uma só, arrastável de ponta a ponta: quebrar em
                    // várias listas impediria mover um ponto de "Chegada" para
                    // "Louvação" arrastando, que é o gesto óbvio.
                    const anterior = n > 0 ? (aberto.itens[n - 1].secao ?? null) : undefined;
                    const atual = item.secao ?? null;
                    const abreSecao = n === 0 ? atual !== null : atual !== anterior;

                    return (
                      <div key={`${n}:${item.pontoId}`}>
                        {abreSecao && (
                          <h3 className="mb-1 mt-4 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground first:mt-0">
                            {atual ?? "Sem parte"}
                          </h3>
                        )}
                        {editandoSecao === n ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              salvarSequencia(
                                aberto,
                                aberto.itens.map((i, idx) => ({
                                  pontoId: i.pontoId,
                                  secao: idx === n ? textoSecao.trim() || null : (i.secao ?? null),
                                })),
                              );
                              setEditandoSecao(null);
                            }}
                            className="mb-2 flex gap-2"
                          >
                            <input
                              autoFocus
                              value={textoSecao}
                              onChange={(e) => setTextoSecao(e.target.value)}
                              placeholder="Chegada, Louvação... (vazio = sem parte)"
                              aria-label="Parte da playlist"
                              list="secoes-da-gira"
                              className="min-h-11 flex-1 rounded-lg border border-border bg-card px-3 text-sm text-foreground"
                            />
                            <Button type="submit" size="sm" className="min-h-11">Salvar</Button>
                            <Button type="button" variant="ghost" size="sm"
                                    className="min-h-11"
                                    onClick={() => setEditandoSecao(null)}>
                              Cancelar
                            </Button>
                          </form>
                        ) : (
                          <ItemArrastavel
                            item={completar(item, dados.pontos)}
                            posicao={n}
                            aoMudarSecao={() => {
                              setTextoSecao(item.secao ?? "");
                              setEditandoSecao(n);
                            }}
                            aoRemover={() =>
                              salvarSequencia(
                                aberto,
                                aberto.itens
                                  .filter((_, i) => i !== n)
                                  .map((i) => ({ pontoId: i.pontoId, secao: i.secao ?? null })),
                              )
                            }
                          />
                        )}
                      </div>
                    );
                  })}
                  {/* Sugere as partes que ESTA gira já usa — quem repete um
                      nome não o digita de novo, e quem tem outro vocabulário
                      não é corrigido. As partes variam de casa para casa. */}
                  <datalist id="secoes-da-gira">
                    {[...new Set(aberto.itens.map((i) => i.secao).filter(Boolean))].map((n) => (
                      <option key={n as string} value={n as string} />
                    ))}
                  </datalist>
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------- lista
  // Sem "voltar ao app" e sem coluna estreita: a navegação agora é a barra
  // lateral, e o espaço horizontal é para as giras.
  return (
    <div className="min-h-full">
      <div className="max-w-5xl px-4 pb-24 pt-5 sm:px-8">
        <h1 className="text-2xl font-black text-foreground sm:text-3xl">Minhas playlists</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A sequência de pontos da sua gira, na ordem em que serão cantados.
        </p>
        {/* O caminho da vitrine no CELULAR.
            Ela só existia na barra lateral, que aparece de `lg:` para cima —
            então a camada da comunidade inteira era exclusiva de desktop, no
            aparelho que ninguém leva para a gira. Entra aqui, e não como sexta
            aba da barra de baixo, porque qual dos cinco lugares sai é decisão
            de produto, e esta não é. Ver ADR 0006. */}
        <Link
          href="/giras-publicas"
          className="mb-6 mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-primary underline underline-offset-2 lg:hidden"
        >
          <Users className="h-4 w-4" aria-hidden />
          Ver as playlists da comunidade
        </Link>

        <FaixaSincronia
            fonte={fonte}
            motivo={motivoFonte}
            sincronia={sincronia}
            nomeDe={(id) => lista?.find((r) => r.id === id)?.nome ?? "Sua playlist"}
            aoResolver={() => void carregar()}
          />

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!nome.trim()) return;
            try {
              const novo = await criar(nome.trim());
              setNome("");
              setErro(null);
              const atualizada = [...(lista ?? []), novo];
              setLista(atualizada);
              guardar(atualizada);
              setAberto(novo);
            } catch (problema) {
              // Criar precisa de id do servidor. Inventar id local traria
              // reconciliação para resolver um caso raro — ninguém batiza uma
              // gira nova no meio dela. A mensagem diz o que dá para fazer.
              setErro(
                mensagemDeErro(problema, "Falha ao criar.", "Sem conexão. Para criar um repertório novo é preciso estar online — as playlists que você já tem continuam funcionando."),
              );
            }
          }}
          className="mb-4 flex gap-2"
        >
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Gira de sexta, Festa de Exu..."
            aria-label="Nome do novo repertório"
            className="min-h-11 flex-1 rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground"
          />
          <Button type="submit" disabled={!nome.trim()} className="min-h-11">
            Criar
          </Button>
        </form>

        {erro && (
          <p role="alert" className="mb-3 text-sm text-destructive">
            {erro}
          </p>
        )}

        {lista === null ? (
          <div aria-busy="true" className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-muted/40" />
            ))}
          </div>
        ) : lista.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            <Music className="mx-auto mb-3 h-8 w-8" aria-hidden />
            <p className="font-medium">Nenhum repertório ainda</p>
            <p className="mt-1 text-sm">Dê um nome acima e monte a primeira playlist.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {lista.map((r) => (
              <div
                key={r.id}
                className="group relative rounded-xl bg-card/60 p-3 transition hover:bg-accent/50"
              >
                <button onClick={() => setAberto(r)} className="w-full text-left">
                  <span className="mb-3 block aspect-square w-full">
                    <CapaGira nome={r.nome} />
                  </span>
                  <span className="block truncate font-semibold text-foreground">{r.nome}</span>
                  <span className="block text-xs text-muted-foreground">
                    {r.itens.length} ponto{r.itens.length === 1 ? "" : "s"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setParaApagar(r)}
                  aria-label={`Apagar ${r.nome}`}
                  className="absolute right-4 top-4 rounded-md bg-background/80 p-2 text-muted-foreground [@media(hover:hover)]:opacity-0 transition hover:text-destructive focus:opacity-100 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ModalConfirmar
        aberto={paraApagar !== null}
        titulo={paraApagar ? `Apagar “${paraApagar.nome}”?` : ""}
        descricao={
          paraApagar
            ? `A playlist tem ${paraApagar.itens.length} ponto${
                paraApagar.itens.length === 1 ? "" : "s"
              }. Isto não pode ser desfeito — os pontos continuam no acervo, a sequência é que se perde.`
            : ""
        }
        onConfirmar={() => {
          const alvo = paraApagar;
          setParaApagar(null);
          if (!alvo) return;
          void (async () => {
            try {
              await apagar(alvo.id);
              const restantes = (lista ?? []).filter((x) => x.id !== alvo.id);
              setLista(restantes);
              guardar(restantes);
              setErro(null);
            } catch (problema) {
              setErro(
                mensagemDeErro(problema, "Falha ao apagar.", "Sem conexão. Apagar um repertório precisa de internet."),
              );
            }
          })();
        }}
        onCancelar={() => setParaApagar(null)}
      />
    </div>
  );
}
