import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CloudUpload, Check } from "lucide-react";
import { carregarDados } from "@/storage";
import { importarLocalDataNaConta, type ResumoImport } from "@/lib/apiConta";
import { mensagemDeErro } from "@/api/cliente";

interface Props {
  aberto: boolean;
  onFechar: () => void;
}

export function ModalMigracao({ aberto, onFechar }: Props) {
  const dados = useMemo(() => (aberto ? carregarDados() : null), [aberto]);
  const [estado, setEstado] = useState<"idle" | "enviando" | "ok" | "erro">("idle");
  const [resumo, setResumo] = useState<ResumoImport | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const totalFavoritos = dados?.pontos.filter((p) => p.favorito).length ?? 0;

  const enviar = async () => {
    if (!dados) return;
    setEstado("enviando");
    setErro(null);
    try {
      const r = await importarLocalDataNaConta(dados);
      setResumo(r);
      setEstado("ok");
    } catch (e) {
      setErro(mensagemDeErro(e, "Não consegui migrar agora."));
      setEstado("erro");
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="bg-card border-border text-foreground max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CloudUpload className="w-5 h-5 text-primary" /> Enviar seus pontos para a conta
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Seus dados continuam <b>salvos neste aparelho</b> — isto cria uma cópia na sua conta para
            você acessar de outro lugar. Nada é apagado.
          </DialogDescription>
        </DialogHeader>

        {estado !== "ok" && dados && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <Contador n={dados.orixas.length} rotulo="Orixás" />
              <Contador n={dados.subcategorias.length} rotulo="Grupos" />
              <Contador n={dados.pontos.length} rotulo="Pontos" />
            </div>
            {totalFavoritos > 0 && (
              <p className="text-sm text-muted-foreground text-center">
                Incluindo {totalFavoritos} favorito{totalFavoritos > 1 ? "s" : ""}.
              </p>
            )}
            {erro && <p className="text-sm text-destructive text-center">{erro}</p>}
          </div>
        )}

        {estado === "ok" && resumo && (
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2 text-green-500">
              <Check className="w-4 h-4" /> Tudo enviado com sucesso!
            </p>
            <ul className="text-muted-foreground list-disc pl-5 space-y-1">
              <li>
                {resumo.pontosCanonicos + resumo.pontosCriados} pontos na conta ({resumo.pontosCriados} seus,{" "}
                {resumo.pontosCanonicos} do acervo).
              </li>
              <li>{resumo.favoritos} favoritos preservados.</li>
            </ul>
          </div>
        )}

        <DialogFooter className="gap-2">
          {estado === "ok" ? (
            <Button onClick={onFechar}>Pronto</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={onFechar}>
                Agora não
              </Button>
              <Button onClick={enviar} disabled={estado === "enviando" || !dados}>
                {estado === "enviando" ? "Enviando..." : "Enviar para minha conta"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Contador({ n, rotulo }: { n: number; rotulo: string }) {
  return (
    <div className="bg-muted/50 rounded-lg py-3">
      <div className="text-2xl font-semibold text-foreground">{n}</div>
      <div className="text-xs text-muted-foreground">{rotulo}</div>
    </div>
  );
}
