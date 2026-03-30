import { useState, useCallback } from "react";
import { Plus, Edit2, Trash2, Download, Upload, Star, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/context";
import { ModalOrixa } from "@/components/ModalOrixa";
import { ModalConfirmar } from "@/components/ModalConfirmar";
import { Orixa } from "@/types";
import { exportarDados, importarDados } from "@/storage";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Props {
  onSelectOrixa: (orixa: Orixa) => void;
}

function SortableOrixaCard({
  orixa,
  nSubs,
  nPontos,
  onClick,
  onEdit,
  onDelete,
}: {
  orixa: Orixa;
  nSubs: number;
  nPontos: number;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: orixa.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-3 p-3.5 rounded-xl bg-card border transition-transform cursor-pointer ${
        isDragging ? "border-primary shadow-lg opacity-90" : "border-border active:scale-[0.98]"
      }`}
      onClick={onClick}
    >
      <button
        className="touch-none shrink-0 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing p-1"
        onClick={(e) => e.stopPropagation()}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-sm"
        style={{ backgroundColor: orixa.cor + "33", border: `2px solid ${orixa.cor}44` }}
      >
        {orixa.emoji}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground truncate" style={{ color: orixa.cor }}>
          {orixa.nome}
        </p>
        <p className="text-xs text-muted-foreground">
          {nSubs} {nSubs === 1 ? "subcategoria" : "subcategorias"} · {nPontos} {nPontos === 1 ? "ponto" : "pontos"}
        </p>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onEdit}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="text-muted-foreground opacity-50">›</div>
    </div>
  );
}

export function TelaOrixas({ onSelectOrixa }: Props) {
  const { dados, adicionarOrixa, editarOrixa, excluirOrixa, reordenarOrixas } = useApp();
  const [modalAberto, setModalAberto] = useState(false);
  const [orixaEditar, setOrixaEditar] = useState<Orixa | null>(null);
  const [confirmarExcluir, setConfirmarExcluir] = useState<Orixa | null>(null);
  const [importando, setImportando] = useState(false);

  const orixas = [...dados.orixas].sort((a, b) => a.ordem - b.ordem);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const ids = orixas.map((o) => o.id);
      const oldIndex = ids.indexOf(active.id as string);
      const newIndex = ids.indexOf(over.id as string);
      if (oldIndex !== -1 && newIndex !== -1) {
        reordenarOrixas(arrayMove(ids, oldIndex, newIndex));
      }
    },
    [orixas, reordenarOrixas]
  );

  const handleImportar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportando(true);
    try {
      await importarDados(file);
      window.location.reload();
    } catch (err) {
      alert("Erro ao importar: arquivo inválido");
    } finally {
      setImportando(false);
      e.target.value = "";
    }
  };

  const totalPontos = dados.pontos.length;
  const totalFavoritos = dados.pontos.filter((p) => p.favorito).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="px-4 pt-8 pb-4">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold text-foreground">Pontos de Umbanda</h1>
            <button
              onClick={() => { setOrixaEditar(null); setModalAberto(true); }}
              className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
              title="Novo Orixá"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <p className="text-muted-foreground text-sm">
            {orixas.length} orixás · {totalPontos} pontos · {totalFavoritos} favoritos
          </p>
        </div>

        {/* Lista de Orixás */}
        <div className="px-4 space-y-2 pb-4">
          {orixas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-4xl mb-3">🌟</p>
              <p className="font-medium">Nenhum Orixá ainda</p>
              <p className="text-sm mt-1">Toque em + para adicionar</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={orixas.map((o) => o.id)}
                strategy={verticalListSortingStrategy}
              >
                {orixas.map((orixa) => {
                  const nSubs = dados.subcategorias.filter((s) => s.orixaId === orixa.id).length;
                  const nPontos = dados.pontos.filter((p) =>
                    dados.subcategorias
                      .filter((s) => s.orixaId === orixa.id)
                      .map((s) => s.id)
                      .includes(p.subcategoriaId)
                  ).length;

                  return (
                    <SortableOrixaCard
                      key={orixa.id}
                      orixa={orixa}
                      nSubs={nSubs}
                      nPontos={nPontos}
                      onClick={() => onSelectOrixa(orixa)}
                      onEdit={() => { setOrixaEditar(orixa); setModalAberto(true); }}
                      onDelete={() => setConfirmarExcluir(orixa)}
                    />
                  );
                })}
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* Backup */}
        <div className="px-4 pb-32">
          <div className="border border-border rounded-xl p-4">
            <p className="text-sm font-medium text-foreground mb-3">Backup dos dados</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={exportarDados}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Exportar JSON
              </Button>
              <label className="flex-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  disabled={importando}
                  asChild
                >
                  <span>
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    {importando ? "Importando..." : "Importar JSON"}
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportar}
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      <ModalOrixa
        aberto={modalAberto}
        orixa={orixaEditar}
        onSalvar={(nome, cor, emoji) => {
          if (orixaEditar) editarOrixa(orixaEditar.id, nome, cor, emoji);
          else adicionarOrixa(nome, cor, emoji);
        }}
        onFechar={() => { setModalAberto(false); setOrixaEditar(null); }}
      />

      <ModalConfirmar
        aberto={!!confirmarExcluir}
        titulo={`Excluir ${confirmarExcluir?.nome}?`}
        descricao="Isso também excluirá todas as subcategorias e pontos deste Orixá. Esta ação não pode ser desfeita."
        onConfirmar={() => {
          if (confirmarExcluir) excluirOrixa(confirmarExcluir.id);
          setConfirmarExcluir(null);
        }}
        onCancelar={() => setConfirmarExcluir(null)}
      />
    </div>
  );
}
