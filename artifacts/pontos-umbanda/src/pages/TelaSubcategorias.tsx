import { useState, useMemo, useCallback } from "react";
import { Plus, Edit2, Trash2, ChevronLeft, Search, X, Star, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/context";
import { ModalSubcategoria } from "@/components/ModalSubcategoria";
import { ModalConfirmar } from "@/components/ModalConfirmar";
import { ModalPonto } from "@/components/ModalPonto";
import { Subcategoria, Ponto, Orixa } from "@/types";
import { CardPonto } from "@/components/CardPonto";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const SUB_PREFIX = "sub:";

function SortableSubHeader({
  sub,
  onEdit,
  onDelete,
  onAddPonto,
}: {
  sub: Subcategoria;
  onEdit: () => void;
  onDelete: () => void;
  onAddPonto: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: SUB_PREFIX + sub.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-2 mb-2 ${isDragging ? "opacity-50" : ""}`}>
      <button
        className="touch-none shrink-0 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing p-1"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>
      <div className="flex-1 flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
          {sub.nome}
        </h2>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onEdit}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Edit2 className="w-3 h-3" />
        </button>
        <button
          onClick={onDelete}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
        </button>
        <button
          onClick={onAddPonto}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-primary hover:bg-primary/10 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

interface Props {
  orixa: Orixa;
  onVoltar: () => void;
}

export function TelaSubcategorias({ orixa, onVoltar }: Props) {
  const { dados, adicionarSubcategoria, editarSubcategoria, excluirSubcategoria, adicionarPonto, reordenarPontos, reordenarSubcategorias, moverPontoParaSubcategoria } = useApp();
  const [busca, setBusca] = useState("");
  const [modalSubAberto, setModalSubAberto] = useState(false);
  const [subEditar, setSubEditar] = useState<Subcategoria | null>(null);
  const [confirmarExcluirSub, setConfirmarExcluirSub] = useState<Subcategoria | null>(null);
  const [modalPontoAberto, setModalPontoAberto] = useState(false);
  const [subParaNovoPonto, setSubParaNovoPonto] = useState<string | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Drag subcategoria
      if (activeId.startsWith(SUB_PREFIX) && overId.startsWith(SUB_PREFIX)) {
        const subIds = dados.subcategorias
          .filter((s) => s.orixaId === orixa.id)
          .sort((a, b) => a.ordem - b.ordem)
          .map((s) => s.id);
        const oldIndex = subIds.indexOf(activeId.slice(SUB_PREFIX.length));
        const newIndex = subIds.indexOf(overId.slice(SUB_PREFIX.length));
        if (oldIndex !== -1 && newIndex !== -1) {
          reordenarSubcategorias(orixa.id, arrayMove(subIds, oldIndex, newIndex));
        }
        return;
      }

      // Drag ponto
      if (!activeId.startsWith(SUB_PREFIX)) {
        const pontoAtivo = dados.pontos.find((p) => p.id === activeId);
        if (!pontoAtivo) return;

        // Over é um ponto
        const pontoOver = dados.pontos.find((p) => p.id === overId);
        if (pontoOver) {
          if (pontoAtivo.subcategoriaId === pontoOver.subcategoriaId) {
            // Mesmo container: reordenar
            const subId = pontoAtivo.subcategoriaId;
            const ids = dados.pontos
              .filter((p) => p.subcategoriaId === subId)
              .sort((a, b) => a.ordem - b.ordem)
              .map((p) => p.id);
            const oldIndex = ids.indexOf(activeId);
            const newIndex = ids.indexOf(overId);
            if (oldIndex !== -1 && newIndex !== -1) {
              reordenarPontos(subId, arrayMove(ids, oldIndex, newIndex));
            }
          } else {
            // Container diferente: mover para a subcategoria do ponto de destino
            const destSubId = pontoOver.subcategoriaId;
            const destPontos = dados.pontos
              .filter((p) => p.subcategoriaId === destSubId)
              .sort((a, b) => a.ordem - b.ordem);
            const overIndex = destPontos.findIndex((p) => p.id === overId);
            moverPontoParaSubcategoria(activeId, destSubId, overIndex >= 0 ? overIndex : undefined);
          }
          return;
        }

        // Over é uma subcategoria (soltar na área vazia)
        if (overId.startsWith(SUB_PREFIX)) {
          const destSubId = overId.slice(SUB_PREFIX.length);
          if (pontoAtivo.subcategoriaId !== destSubId) {
            moverPontoParaSubcategoria(activeId, destSubId);
          }
        }
      }
    },
    [dados.pontos, dados.subcategorias, orixa.id, reordenarPontos, reordenarSubcategorias, moverPontoParaSubcategoria]
  );

  const subcategorias = useMemo(
    () => dados.subcategorias
      .filter((s) => s.orixaId === orixa.id)
      .sort((a, b) => a.ordem - b.ordem),
    [dados.subcategorias, orixa.id]
  );

  const pontosPorSub = useMemo(() => {
    const mapa: Record<string, Ponto[]> = {};
    subcategorias.forEach((sub) => {
      mapa[sub.id] = dados.pontos
        .filter((p) => p.subcategoriaId === sub.id)
        .sort((a, b) => a.ordem - b.ordem);
    });
    return mapa;
  }, [dados.pontos, subcategorias]);

  const buscaAtiva = busca.trim().length > 0;

  const resultadosBusca = useMemo(() => {
    if (!buscaAtiva) return [];
    const q = busca.toLowerCase();
    const pontosDoOrixa = dados.pontos.filter((p) =>
      subcategorias.some((s) => s.id === p.subcategoriaId)
    );
    return pontosDoOrixa.filter(
      (p) => p.titulo.toLowerCase().includes(q) || p.letra.toLowerCase().includes(q)
    );
  }, [busca, buscaAtiva, dados.pontos, subcategorias]);

  const nomeSub = (id: string) => subcategorias.find((s) => s.id === id)?.nome ?? "";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="px-4 pt-6 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={onVoltar}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-foreground active:scale-95 transition-transform"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: orixa.cor + "33", border: `2px solid ${orixa.cor}55` }}
            >
              {orixa.emoji}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold" style={{ color: orixa.cor }}>{orixa.nome}</h1>
              <p className="text-xs text-muted-foreground">
                {subcategorias.length} subcategorias · {Object.values(pontosPorSub).flat().length} pontos
              </p>
            </div>
            <button
              onClick={() => { setSubEditar(null); setModalSubAberto(true); }}
              className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar pontos..."
              className="pl-9 pr-9 bg-card border-border"
            />
            {busca && (
              <button
                onClick={() => setBusca("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Resultados de busca */}
        {buscaAtiva ? (
          <div className="px-4 pb-32">
            <p className="text-xs text-muted-foreground mb-3">
              {resultadosBusca.length} {resultadosBusca.length === 1 ? "resultado" : "resultados"} para "{busca}"
            </p>
            {resultadosBusca.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-sm">Nenhum ponto encontrado</p>
              </div>
            ) : (
              <div className="space-y-2">
                {resultadosBusca.map((ponto) => (
                  <div key={ponto.id}>
                    <p className="text-xs text-muted-foreground mb-1 px-1">{nomeSub(ponto.subcategoriaId)}</p>
                    <CardPonto ponto={ponto} busca={busca} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Subcategorias normais */
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
          <div className="px-4 pb-32 space-y-4">
            {subcategorias.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-4xl mb-3">📂</p>
                <p className="font-medium">Nenhuma subcategoria ainda</p>
                <p className="text-sm mt-1">Toque em + para adicionar uma subcategoria</p>
                <p className="text-xs mt-1 opacity-70">Ex: Chamada, Louvação, Descarrego</p>
              </div>
            ) : (
              <SortableContext
                items={subcategorias.map((s) => SUB_PREFIX + s.id)}
                strategy={verticalListSortingStrategy}
              >
              {subcategorias.map((sub) => (
                <div key={sub.id}>
                  <SortableSubHeader
                    sub={sub}
                    onEdit={() => { setSubEditar(sub); setModalSubAberto(true); }}
                    onDelete={() => setConfirmarExcluirSub(sub)}
                    onAddPonto={() => { setSubParaNovoPonto(sub.id); setModalPontoAberto(true); }}
                  />

                  {/* Pontos desta subcategoria */}
                  {pontosPorSub[sub.id]?.length === 0 ? (
                    <button
                      onClick={() => { setSubParaNovoPonto(sub.id); setModalPontoAberto(true); }}
                      className="w-full py-4 border border-dashed border-border rounded-xl text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                    >
                      + Adicionar ponto
                    </button>
                  ) : (
                    <SortableContext
                      items={pontosPorSub[sub.id].map((p) => p.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-2">
                        {pontosPorSub[sub.id].map((ponto) => (
                          <CardPonto key={ponto.id} ponto={ponto} busca="" sortable />
                        ))}
                      </div>
                    </SortableContext>
                  )}
                </div>
              ))}
              </SortableContext>
            )}
          </div>
          </DndContext>
        )}
      </div>

      <ModalSubcategoria
        aberto={modalSubAberto}
        subcategoria={subEditar}
        onSalvar={(nome) => {
          if (subEditar) editarSubcategoria(subEditar.id, nome);
          else adicionarSubcategoria(orixa.id, nome);
        }}
        onFechar={() => { setModalSubAberto(false); setSubEditar(null); }}
      />

      <ModalConfirmar
        aberto={!!confirmarExcluirSub}
        titulo={`Excluir "${confirmarExcluirSub?.nome}"?`}
        descricao="Isso também excluirá todos os pontos desta subcategoria. Esta ação não pode ser desfeita."
        onConfirmar={() => {
          if (confirmarExcluirSub) excluirSubcategoria(confirmarExcluirSub.id);
          setConfirmarExcluirSub(null);
        }}
        onCancelar={() => setConfirmarExcluirSub(null)}
      />

      <ModalPonto
        aberto={modalPontoAberto}
        onSalvar={(titulo, letra) => {
          if (subParaNovoPonto) adicionarPonto(subParaNovoPonto, titulo, letra);
        }}
        onFechar={() => { setModalPontoAberto(false); setSubParaNovoPonto(null); }}
      />
    </div>
  );
}
