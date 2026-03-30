import { useState } from "react";
import { ChevronDown, Edit2, Trash2, Star, FolderInput, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useApp } from "@/context";
import { ModalPonto } from "@/components/ModalPonto";
import { ModalConfirmar } from "@/components/ModalConfirmar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Ponto } from "@/types";

interface Props {
  ponto: Ponto;
  busca: string;
  sortable?: boolean;
}

function destacar(texto: string, busca: string): React.ReactNode {
  if (!busca.trim()) return texto;
  const partes = texto.split(new RegExp(`(${busca.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return partes.map((parte, i) =>
    parte.toLowerCase() === busca.toLowerCase() ? (
      <mark key={i} className="bg-yellow-400/30 text-yellow-200 rounded-sm px-0.5">
        {parte}
      </mark>
    ) : (
      parte
    )
  );
}

export function CardPonto({ ponto, busca, sortable = false }: Props) {
  const { dados, editarPonto, excluirPonto, toggleFavorito, moverPontoParaSubcategoria } = useApp();
  const [expandido, setExpandido] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [confirmarExcluir, setConfirmarExcluir] = useState(false);
  const [modalMover, setModalMover] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: ponto.id, disabled: !sortable });

  // Subcategorias do mesmo orixá (para mover entre elas)
  const subcategoriaAtual = dados.subcategorias.find((s) => s.id === ponto.subcategoriaId);
  const subcategoriasDoOrixa = subcategoriaAtual
    ? dados.subcategorias
        .filter((s) => s.orixaId === subcategoriaAtual.orixaId && s.id !== ponto.subcategoriaId)
        .sort((a, b) => a.ordem - b.ordem)
    : [];

  // Todas as subcategorias de outros orixás
  const subcategoriasOutrosOrixas = subcategoriaAtual
    ? dados.subcategorias
        .filter((s) => s.orixaId !== subcategoriaAtual.orixaId)
        .sort((a, b) => a.ordem - b.ordem)
    : [];



  return (
    <>
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          zIndex: isDragging ? 50 : undefined,
        }}
        className={`bg-card border rounded-xl overflow-hidden ${
          isDragging ? "border-primary shadow-lg opacity-90" : "border-border"
        }`}
      >
        <div className="flex items-start">
          {sortable && (
            <button
              className="touch-none shrink-0 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing px-2 py-4 self-stretch flex items-center"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="w-4 h-4" />
            </button>
          )}
          <button
            className="flex-1 flex items-start gap-3 p-3.5 text-left active:bg-muted/50 transition-colors min-w-0"
            onClick={() => setExpandido((v) => !v)}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground leading-snug">
                {destacar(ponto.titulo, busca)}
              </p>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground mt-0.5 shrink-0 transition-transform ${
                expandido ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {expandido && (
          <div className="border-t border-border">
            <div className="px-3.5 py-3 bg-muted/30">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                {destacar(ponto.letra, busca)}
              </pre>
            </div>
            <div className="flex items-center gap-1 px-3.5 py-2 border-t border-border">
              <button
                onClick={(e) => { e.stopPropagation(); toggleFavorito(ponto.id); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  ponto.favorito
                    ? "bg-yellow-400/20 text-yellow-400"
                    : "text-muted-foreground hover:text-yellow-400 hover:bg-yellow-400/10"
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${ponto.favorito ? "fill-current" : ""}`} />
                {ponto.favorito ? "Favorito" : "Favoritar"}
              </button>
              <div className="flex-1" />
              {(subcategoriasDoOrixa.length > 0 || subcategoriasOutrosOrixas.length > 0) && (
                <button
                  onClick={(e) => { e.stopPropagation(); setModalMover(true); }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Mover para outra subcategoria"
                >
                  <FolderInput className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setModalEditar(true); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmarExcluir(true); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ModalPonto
        aberto={modalEditar}
        ponto={ponto}
        onSalvar={(titulo, letra) => editarPonto(ponto.id, titulo, letra)}
        onFechar={() => setModalEditar(false)}
      />

      <ModalConfirmar
        aberto={confirmarExcluir}
        titulo="Excluir ponto?"
        descricao="Esta ação não pode ser desfeita."
        onConfirmar={() => { excluirPonto(ponto.id); setConfirmarExcluir(false); }}
        onCancelar={() => setConfirmarExcluir(false)}
      />

      <Dialog open={modalMover} onOpenChange={(v) => !v && setModalMover(false)}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm mx-4 max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Mover para...</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto space-y-3 py-2">
            {subcategoriasDoOrixa.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  {dados.orixas.find((o) => o.id === subcategoriaAtual?.orixaId)?.emoji}{" "}
                  {dados.orixas.find((o) => o.id === subcategoriaAtual?.orixaId)?.nome}
                </p>
                <div className="space-y-1">
                  {subcategoriasDoOrixa.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => { moverPontoParaSubcategoria(ponto.id, sub.id); setModalMover(false); }}
                      className="w-full text-left px-3 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors text-foreground"
                    >
                      {sub.nome}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {subcategoriasOutrosOrixas.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  Outros Orixás
                </p>
                <div className="space-y-1">
                  {subcategoriasOutrosOrixas.map((sub) => {
                    const orixa = dados.orixas.find((o) => o.id === sub.orixaId);
                    return (
                      <button
                        key={sub.id}
                        onClick={() => { moverPontoParaSubcategoria(ponto.id, sub.id); setModalMover(false); }}
                        className="w-full text-left px-3 py-2.5 rounded-lg text-sm hover:bg-muted transition-colors text-foreground"
                      >
                        <span style={{ color: orixa?.cor }}>{orixa?.emoji} {orixa?.nome}</span>
                        <span className="text-muted-foreground"> › {sub.nome}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
