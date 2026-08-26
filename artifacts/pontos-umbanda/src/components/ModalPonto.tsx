import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Ponto } from "@/types";

interface Props {
  aberto: boolean;
  ponto?: Ponto | null;
  onSalvar: (titulo: string, letra: string, autor: string) => void;
  onFechar: () => void;
}

export function ModalPonto({ aberto, ponto, onSalvar, onFechar }: Props) {
  const [titulo, setTitulo] = useState("");
  const [letra, setLetra] = useState("");
  const [autor, setAutor] = useState("");

  useEffect(() => {
    if (ponto) {
      setTitulo(ponto.titulo);
      setLetra(ponto.letra);
      setAutor(ponto.autor ?? "");
    } else {
      setTitulo("");
      setLetra("");
      setAutor("");
    }
  }, [ponto, aberto]);

  const salvar = () => {
    if (!titulo.trim()) return;
    onSalvar(titulo.trim(), letra.trim(), autor.trim());
    onFechar();
  };

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="bg-card border-border text-foreground max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{ponto ? "Editar Ponto" : "Novo Ponto"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-y-auto">
          <div>
            <Label htmlFor="titulo-ponto" className="text-muted-foreground text-sm mb-1 block">
              Início do ponto <span className="text-xs">(exibido na lista)</span>
            </Label>
            <Input
              id="titulo-ponto"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Laroyê Exu, Exu mojubá..."
              className="bg-background border-border"
              autoFocus
            />
          </div>

          <div>
            {/* Opcional de propósito, e o texto de apoio diz por quê: a maior
                parte do acervo é de tradição oral e não tem autoria conhecida.
                Um campo obrigatório aqui convidaria a preencher com palpite —
                atribuição falsa de obra religiosa. */}
            <Label htmlFor="autor-ponto" className="text-muted-foreground text-sm mb-1 block">
              Autor <span className="text-xs">(se você souber)</span>
            </Label>
            <Input
              id="autor-ponto"
              value={autor}
              onChange={(e) => setAutor(e.target.value)}
              placeholder="Deixe em branco se for de domínio popular"
              className="bg-background border-border"
            />
          </div>

          <div>
            <Label htmlFor="letra-ponto" className="text-muted-foreground text-sm mb-1 block">
              Letra completa
            </Label>
            <Textarea
              id="letra-ponto"
              value={letra}
              onChange={(e) => setLetra(e.target.value)}
              placeholder="Escreva a letra completa do ponto aqui..."
              className="bg-background border-border min-h-[200px] resize-none"
              rows={10}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-4 border-t border-border">
          <Button variant="ghost" onClick={onFechar}>Cancelar</Button>
          <Button onClick={salvar} disabled={!titulo.trim()}>
            {ponto ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
