import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Orixa } from "@/types";

const CORES = [
  "#dc2626", "#ea580c", "#d97706", "#ca8a04", "#16a34a",
  "#0891b2", "#2563eb", "#7c3aed", "#c026d3", "#be185d",
  "#64748b", "#78350f", "#94a3b8", "#1e293b",
];

const EMOJIS = ["🔥", "⚔️", "🏹", "⚡", "🌪️", "💛", "🌊", "☁️", "💀", "🪷", "🌙", "⭐", "🌺", "🎭", "🌿", "💎"];

interface Props {
  aberto: boolean;
  orixa?: Orixa | null;
  onSalvar: (nome: string, cor: string, emoji: string) => void;
  onFechar: () => void;
}

export function ModalOrixa({ aberto, orixa, onSalvar, onFechar }: Props) {
  const [nome, setNome] = useState("");
  const [cor, setCor] = useState(CORES[0]);
  const [emoji, setEmoji] = useState(EMOJIS[0]);

  useEffect(() => {
    if (orixa) {
      setNome(orixa.nome);
      setCor(orixa.cor);
      setEmoji(orixa.emoji);
    } else {
      setNome("");
      setCor(CORES[0]);
      setEmoji(EMOJIS[0]);
    }
  }, [orixa, aberto]);

  const salvar = () => {
    if (!nome.trim()) return;
    onSalvar(nome.trim(), cor, emoji);
    onFechar();
  };

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="bg-card border-border text-foreground max-w-sm mx-4">
        <DialogHeader>
          <DialogTitle>{orixa ? "Editar Orixá" : "Novo Orixá"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="nome-orixa" className="text-muted-foreground text-sm mb-1 block">Nome</Label>
            <Input
              id="nome-orixa"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Oxum, Iemanjá..."
              className="bg-background border-border"
              onKeyDown={(e) => e.key === "Enter" && salvar()}
              autoFocus
            />
          </div>

          <div>
            <Label className="text-muted-foreground text-sm mb-2 block">Emoji</Label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`text-xl w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    emoji === e ? "bg-primary/30 ring-2 ring-primary" : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-muted-foreground text-sm mb-2 block">Cor</Label>
            <div className="flex flex-wrap gap-2">
              {CORES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-8 h-8 rounded-full transition-all ${
                    cor === c ? "ring-2 ring-offset-2 ring-white scale-110" : "opacity-70 hover:opacity-100"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onFechar}>Cancelar</Button>
          <Button onClick={salvar} disabled={!nome.trim()} style={{ backgroundColor: cor }}>
            {emoji} {orixa ? "Salvar" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
