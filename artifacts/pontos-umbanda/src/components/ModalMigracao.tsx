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

  /**
   * Nada para enviar — e isso muda o que o diálogo pode oferecer.
   *
   * O `PUT /acervo` recusa payload vazio com **422** ("Sync recusado: ele
   * apagaria o acervo inteiro"), cerca que existe porque um envio meio
   * hidratado já apagou o acervo de uma conta. Sem esta checagem, o diálogo
   * mostrava três zeros com o botão de enviar ATIVO, e a recusa do servidor
   * chegava à pessoa como se ela tivesse tentado apagar as próprias coisas.
   *
   * O `App` já não OFERECE a migração nesse caso, mas por dentro da conta o
   * diálogo é aberto à mão — e quem abre à mão merece a mesma verdade.
   */
  const vazio = !dados || dados.pontos.length === 0;

  /**
   * Fechar devolve o diálogo ao começo.
   *
   * Ele fica MONTADO com `aberto={false}`, então o estado sobrevive: reabrir
   * depois de uma migração mostrava de novo a tela de "pronto" com o resumo da
   * vez anterior — "12 pontos migrados" para uma migração que não aconteceu
   * agora —, ou o erro velho antes de qualquer tentativa nova.
   *
   * Ver `dialogo-limpa-ao-fechar.test.ts`: é o mesmo defeito de outros cinco
   * diálogos, e aqui o que sobrevive não é um campo digitado, é um RESULTADO.
   */
  const fechar = () => {
    setEstado("idle");
    setResumo(null);
    setErro(null);
    onFechar();
  };

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
    <Dialog open={aberto} onOpenChange={(v) => !v && fechar()}>
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

        {estado !== "ok" && vazio && (
          <p className="text-sm text-muted-foreground">
            Não há nada guardado neste aparelho para enviar. Seu acervo já está
            na conta, ou este aparelho ainda não recebeu nenhum ponto.
          </p>
        )}

        {estado !== "ok" && dados && !vazio && (
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
            <Button onClick={fechar}>Pronto</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={fechar}>
                {vazio ? "Fechar" : "Agora não"}
              </Button>
              {!vazio && (
                <Button onClick={enviar} disabled={estado === "enviando"}>
                  {estado === "enviando" ? "Enviando..." : "Enviar para minha conta"}
                </Button>
              )}
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
