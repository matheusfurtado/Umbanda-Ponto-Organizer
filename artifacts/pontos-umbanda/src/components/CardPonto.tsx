import { useState } from "react";
import { ChevronDown, Edit2, Trash2, Star, FolderInput, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useApp } from "@/context";
import { ModalPonto } from "@/components/ModalPonto";
import { ModalConfirmar } from "@/components/ModalConfirmar";
import { CreditoDoArtista } from "@/componentes/CreditoDoArtista";
import { LinkVideo } from "@/components/LinkVideo";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Ponto } from "@/types";
import { destacar } from "@/lib/destacar";

/**
 * O ponto como CARTÃO, na tela de organizar — a que arrasta e move.
 *
 * ## Os `stopPropagation` daqui eram inertes, e saíram
 *
 * Quatro botões da barra de ações chamavam `e.stopPropagation()` como se
 * estivessem dentro do botão que abre a letra. Não estão: a barra vive no
 * bloco `expandido &&`, que é IRMÃO do cabeçalho clicável. O clique nunca
 * chegaria lá.
 *
 * É o mesmo achado #12 do `PontoDoArtista`, no segundo arquivo — e o mesmo
 * risco, que nunca foi o código morto: é o próximo a mexer aqui acreditar que
 * a estrutura é aninhada e desenhar em cima disso.
 */
interface Props {
  ponto: Ponto;
  busca: string;
  sortable?: boolean;
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

  // Todas as subcategorias de outros orixás, NA ORDEM DA GIRA.
  //
  // Ordenava só por `s.ordem`, e `ordem` é POR ORIXÁ: no acervo há 12 orixás
  // com `ordem = 0`, 11 com `ordem = 1`, e assim por diante. A lista saía
  // embaralhada — Ogum, Oxum, Xangô, Iemanjá, e então Ogum de novo — com o
  // mesmo orixá aparecendo três ou quatro vezes espalhado por 43 entradas.
  //
  // Quem move um ponto está procurando um ORIXÁ primeiro e a subcategoria
  // depois. E ordem litúrgica não é estética neste app: é requisito.
  const ordemDoOrixa = new Map(dados.orixas.map((o) => [o.id, o.ordem]));
  const subcategoriasOutrosOrixas = subcategoriaAtual
    ? dados.subcategorias
        .filter((s) => s.orixaId !== subcategoriaAtual.orixaId)
        .sort(
          (a, b) =>
            (ordemDoOrixa.get(a.orixaId) ?? Infinity) -
              (ordemDoOrixa.get(b.orixaId) ?? Infinity) || a.ordem - b.ordem,
        )
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
              type="button"
              className="touch-none shrink-0 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing px-2 py-4 self-stretch flex items-center"
              {...attributes}
              {...listeners}
              // DEPOIS do spread, de propósito: o nome é nosso, não do dnd-kit.
              // Sem ele o leitor de tela anuncia só "botão" — e é o controle
              // que REORDENA o acervo, onde a ordem é requisito funcional.
              aria-label={`Reordenar ${ponto.titulo}`}
            >
              <GripVertical className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            className="flex-1 flex items-start gap-3 p-3.5 text-left active:bg-muted/50 transition-colors min-w-0"
            onClick={() => setExpandido((v) => !v)}
            // Nenhum controle contava o estado: quem usa leitor de tela abria
            // a letra e não ouvia nada mudar. É o único jeito de saber que
            // este cartão abre alguma coisa.
            aria-expanded={expandido}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground leading-snug">
                {destacar(ponto.titulo, busca)}
              </p>
              {/* Só aparece quando alguém sabe. Um "Autor: desconhecido" fixo
                  em 520 pontos é ruído em toda linha da lista — e sugere
                  lacuna a preencher onde não há lacuna: a tradição é oral. */}
              {ponto.autor && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {ponto.autor}
                </p>
              )}
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
            {/* Antes do link do vídeo: quem gravou é crédito, e crédito
                vem antes da ação. E aparece mesmo sem plano, quando o
                link não vem. */}
            <CreditoDoArtista ponto={ponto} className="px-3.5 pb-2" />
            <LinkVideo ponto={ponto} />
            <div className="flex items-center gap-1 px-3.5 py-2 border-t border-border">
              <button
                type="button"
                onClick={() => toggleFavorito(ponto.id)}
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
                  type="button"
                  onClick={() => setModalMover(true)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Mover para outra subcategoria"
                >
                  <FolderInput className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setModalEditar(true)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setConfirmarExcluir(true)}
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
        onSalvar={(titulo, letra, autor) => editarPonto(ponto.id, titulo, letra, autor)}
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
                      type="button"
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
                        type="button"
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
