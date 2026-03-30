import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Subcategoria } from "@/types";

interface Props {
  aberto: boolean;
  subcategoria?: Subcategoria | null;
  onSalvar: (nome: string) => void;
  onFechar: () => void;
}

export function ModalSubcategoria({ aberto, subcategoria, onSalvar, onFechar }: Props) {
  const [nome, setNome] = useState("");

  useEffect(() => {
    if (subcategoria) setNome(subcategoria.nome);
    else setNome("");
  }, [subcategoria, aberto]);

  const salvar = () => {
    if (!nome.trim()) return;
    onSalvar(nome.trim());
    onFechar();
  };

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="bg-card border-border text-foreground max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle>{subcategoria ? "Editar Subcategoria" : "Nova Subcategoria"}</DialogTitle>
        </DialogHeader>

        <div>
          <Label htmlFor="nome-sub" className="text-muted-foreground text-sm mb-1 block">Nome</Label>
          <Input
            id="nome-sub"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Chamada, Louvação, Descarrego..."
            className="bg-background border-border"
            onKeyDown={(e) => e.key === "Enter" && salvar()}
            autoFocus
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onFechar}>Cancelar</Button>
          <Button onClick={salvar} disabled={!nome.trim()}>
            {subcategoria ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
