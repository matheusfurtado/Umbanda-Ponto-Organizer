import { useState } from "react";
import { Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PALETAS, aplicarPaleta, paletaAtual, type PaletaId } from "@/lib/paleta";

/**
 * Escolher a aparência olhando, não imaginando.
 *
 * A troca é imediata e sem recarregar: cada opção só reescreve os tokens de
 * cor em `<html data-paleta>`. Ver o app inteiro mudar na hora é o que permite
 * decidir — descrever cor em palavra não decide nada.
 *
 * As amostras são desenhadas com as cores REAIS de cada paleta, e não com uma
 * aproximação escrita à mão aqui: amostra que mente sobre o resultado é pior
 * que amostra nenhuma.
 */
export function EscolherPaleta({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const [atual, setAtual] = useState<PaletaId>(paletaAtual);

  const escolher = (id: PaletaId) => {
    setAtual(id);
    aplicarPaleta(id);
  };

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Aparência</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          {PALETAS.map((p) => (
            <button
              key={p.id}
              onClick={() => escolher(p.id)}
              data-paleta={p.id}
              className={`rounded-xl border p-3 text-left transition ${
                atual === p.id ? "ring-2 ring-primary" : "hover:border-primary/40"
              }`}
              style={{ background: "hsl(var(--background))" }}
            >
              <span className="mb-2 flex gap-1.5">
                {["--primary", "--card", "--muted", "--foreground"].map((t) => (
                  <span
                    key={t}
                    className="h-6 w-6 rounded-full border border-black/10"
                    style={{ background: `hsl(var(${t}))` }}
                  />
                ))}
              </span>
              <span
                className="flex items-center gap-1.5 text-sm font-semibold"
                style={{ color: "hsl(var(--foreground))" }}
              >
                {p.nome}
                {atual === p.id && <Check className="h-3.5 w-3.5" />}
              </span>
              <span
                className="mt-0.5 block text-xs leading-snug"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                {p.sobre}
              </span>
            </button>
          ))}
        </div>

        <p className="pt-1 text-xs text-muted-foreground">
          A escolha fica guardada neste aparelho.
        </p>
      </DialogContent>
    </Dialog>
  );
}
