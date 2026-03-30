import { useState } from "react";
import { ChevronDown, Edit2, Trash2, Star } from "lucide-react";
import { useApp } from "@/context";
import { ModalPonto } from "@/components/ModalPonto";
import { ModalConfirmar } from "@/components/ModalConfirmar";
import { Ponto } from "@/types";

interface Props {
  ponto: Ponto;
  busca: string;
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

export function CardPonto({ ponto, busca }: Props) {
  const { editarPonto, excluirPonto, toggleFavorito } = useApp();
  const [expandido, setExpandido] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [confirmarExcluir, setConfirmarExcluir] = useState(false);

  return (
    <>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <button
          className="w-full flex items-start gap-3 p-3.5 text-left active:bg-muted/50 transition-colors"
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
    </>
  );
}
