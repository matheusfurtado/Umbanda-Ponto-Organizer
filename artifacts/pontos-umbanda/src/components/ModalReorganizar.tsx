import { useState, useMemo } from "react";
import { GripVertical } from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Ponto } from "@/types";

interface Props {
  aberto: boolean;
  pontos: Ponto[];
  tituloSubcategoria: string;
  onSalvar: (ids: string[]) => void;
  onFechar: () => void;
}

function ItemSortable({ ponto, posicao }: { ponto: Ponto; posicao: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ponto.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-colors ${
        isDragging
          ? "bg-primary/10 border-primary shadow-lg"
          : "bg-card border-border"
      }`}
    >
      <button
        className="touch-none shrink-0 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing p-1"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="text-xs text-muted-foreground font-mono w-6 text-right shrink-0">
        {posicao}
      </span>
      <span className="text-sm text-foreground truncate flex-1">{ponto.titulo}</span>
    </div>
  );
}

export function ModalReorganizar({ aberto, pontos, tituloSubcategoria, onSalvar, onFechar }: Props) {
  const [ordem, setOrdem] = useState<string[]>([]);

  // Inicializa a ordem quando o modal abre
  const pontosOrdenados = useMemo(() => {
    const sorted = [...pontos].sort((a, b) => a.ordem - b.ordem);
    return sorted;
  }, [pontos]);

  // Seta a ordem inicial quando abre
  useMemo(() => {
    if (aberto) {
      setOrdem(pontosOrdenados.map((p) => p.id));
    }
  }, [aberto, pontosOrdenados]);

  const pontosMap = useMemo(() => {
    const map = new Map<string, Ponto>();
    pontos.forEach((p) => map.set(p.id, p));
    return map;
  }, [pontos]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOrdem((prev) => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const salvar = () => {
    onSalvar(ordem);
    onFechar();
  };

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="bg-card border-border text-foreground max-w-md mx-4 max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base">Reorganizar — {tituloSubcategoria}</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Arraste os pontos para reordenar
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-1.5 py-2 min-h-0">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={ordem} strategy={verticalListSortingStrategy}>
              {ordem.map((id, i) => {
                const ponto = pontosMap.get(id);
                if (!ponto) return null;
                return <ItemSortable key={id} ponto={ponto} posicao={i + 1} />;
              })}
            </SortableContext>
          </DndContext>
        </div>

        <div className="flex gap-2 pt-2 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={onFechar}>
            Cancelar
          </Button>
          <Button className="flex-1" onClick={salvar}>
            Salvar ordem
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
