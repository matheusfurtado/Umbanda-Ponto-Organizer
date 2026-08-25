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
import { Link } from "wouter";
import {
  ArrowLeft,
  GripVertical,
  Loader2,
  Music,
  Plus,
  Search,
  Trash2,
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
import { useApp } from "@/context";
import { destacar, semAcento } from "@/lib/destacar";
import {
  apagar,
  criar,
  definirItens,
  listar,
  type ItemRepertorio,
  type Repertorio,
} from "@/api/repertorio";

function ItemArrastavel({
  item,
  posicao,
  aoRemover,
}: {
  item: ItemRepertorio;
  posicao: number;
  aoRemover: () => void;
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
      <span className="flex-1 truncate text-sm text-foreground">
        {item.titulo ?? <em className="text-muted-foreground">ponto removido do acervo</em>}
      </span>
      {item.videoUrl && (
        <a
          href={item.videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Ouvir no YouTube"
          className={`min-h-11 shrink-0 px-2 ${
            // `revisar` é palpite. Sinalizar aqui também evita a pessoa montar a
            // gira confiando num casamento fraco e descobrir na hora de cantar.
            item.videoStatus === "revisar" ? "text-amber-400" : "text-red-400"
          }`}
          title={item.videoStatus === "revisar" ? "Vídeo provável — confira antes" : "Ouvir"}
        >
          <Youtube className="h-4 w-4" aria-hidden />
        </a>
      )}
      <button
        onClick={aoRemover}
        aria-label={`Tirar ${item.titulo ?? "ponto"} da gira`}
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
          aria-label="Buscar ponto para incluir na gira"
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

export function TelaRepertorios() {
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
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const r = await listar();
      setLista(r);
      setAberto((atual) => (atual ? (r.find((x) => x.id === atual.id) ?? null) : null));
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : "Falha ao carregar.");
      setLista([]);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const salvarSequencia = async (rep: Repertorio, pontos: string[]) => {
    // Otimista: a ordem muda na tela na hora, e o servidor confirma depois.
    // Arrastar e esperar resposta a cada movimento seria intolerável na gira.
    const antes = rep.itens;
    setAberto({
      ...rep,
      itens: pontos.map((pontoId, ordem) => {
        const existente = antes.find((i) => i.pontoId === pontoId);
        return {
          pontoId,
          ordem,
          titulo: existente?.titulo ?? null,
          videoUrl: existente?.videoUrl ?? null,
          videoStatus: existente?.videoStatus ?? null,
        };
      }),
    });
    setSalvando(true);
    try {
      setAberto(await definirItens(rep.id, pontos));
      setErro(null);
    } catch (problema) {
      // Devolve o que estava: manter na tela uma ordem que o servidor recusou
      // faria a pessoa ensaiar uma gira que não existe.
      setAberto({ ...rep, itens: antes });
      setErro(problema instanceof Error ? problema.message : "Falha ao salvar a ordem.");
    } finally {
      setSalvando(false);
    }
  };

  const aoSoltar = (e: DragEndEvent) => {
    if (!aberto || !e.over || e.active.id === e.over.id) return;
    const ids = aberto.itens.map((i, n) => `${n}:${i.pontoId}`);
    const de = ids.indexOf(String(e.active.id));
    const para = ids.indexOf(String(e.over.id));
    const pontos = aberto.itens.map((i) => i.pontoId);
    const [movido] = pontos.splice(de, 1);
    pontos.splice(para, 0, movido);
    void salvarSequencia(aberto, pontos);
  };

  // ------------------------------------------------------------------ detalhe
  if (aberto) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-lg px-4 pb-16 pt-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAberto(null)}
            className="-ml-2 mb-4 gap-1.5 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Meus repertórios
          </Button>

          <div className="mb-1 flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">{aberto.nome}</h1>
            {salvando && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            {aberto.itens.length} ponto{aberto.itens.length === 1 ? "" : "s"} · arraste para
            mudar a ordem
          </p>

          {erro && (
            <p role="alert" className="mb-3 text-sm text-destructive">
              {erro}
            </p>
          )}

          <div className="mb-4">
            <Adicionar
              aoEscolher={(pontoId) =>
                void salvarSequencia(aberto, [...aberto.itens.map((i) => i.pontoId), pontoId])
              }
            />
          </div>

          {aberto.itens.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <Music className="mx-auto mb-3 h-8 w-8" aria-hidden />
              <p className="font-medium">Gira vazia</p>
              <p className="mt-1 text-sm">Busque acima para incluir o primeiro ponto.</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={aoSoltar}>
              <SortableContext
                items={aberto.itens.map((i, n) => `${n}:${i.pontoId}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {aberto.itens.map((item, n) => (
                    <ItemArrastavel
                      key={`${n}:${item.pontoId}`}
                      item={item}
                      posicao={n}
                      aoRemover={() =>
                        void salvarSequencia(
                          aberto,
                          aberto.itens.filter((_, i) => i !== n).map((i) => i.pontoId),
                        )
                      }
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------- lista
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-lg px-4 pb-16 pt-8">
        <Link href="/">
          <Button variant="ghost" size="sm" className="-ml-2 mb-4 gap-1.5 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar ao app
          </Button>
        </Link>

        <h1 className="text-2xl font-bold text-foreground">Meus repertórios</h1>
        <p className="mb-6 mt-1 text-sm text-muted-foreground">
          A sequência de pontos da sua gira, na ordem em que serão cantados.
        </p>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!nome.trim()) return;
            try {
              const novo = await criar(nome.trim());
              setNome("");
              setErro(null);
              setLista((l) => [...(l ?? []), novo]);
              setAberto(novo);
            } catch (problema) {
              setErro(problema instanceof Error ? problema.message : "Falha ao criar.");
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
            <p className="mt-1 text-sm">Dê um nome acima e monte a primeira gira.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {lista.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-2 rounded-xl border border-border bg-card"
              >
                <button
                  onClick={() => setAberto(r)}
                  className="min-h-11 flex-1 px-4 py-3 text-left"
                >
                  <span className="block font-medium text-foreground">{r.nome}</span>
                  <span className="block text-xs text-muted-foreground">
                    {r.itens.length} ponto{r.itens.length === 1 ? "" : "s"}
                  </span>
                </button>
                <button
                  onClick={async () => {
                    await apagar(r.id);
                    void carregar();
                  }}
                  aria-label={`Apagar ${r.nome}`}
                  className="min-h-11 px-3 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
