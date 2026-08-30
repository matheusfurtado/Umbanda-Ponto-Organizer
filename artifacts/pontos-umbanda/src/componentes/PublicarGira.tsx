import { useState } from "react";
import { Globe, Loader2, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/auth/AuthContext";
import { escolherApelido } from "@/api/conta";
import { definirVisibilidade, type Repertorio } from "@/api/repertorio";
import { mensagemDeErro } from "@/api/cliente";

/**
 * Tornar uma gira pública — ou voltar a fechá-la.
 *
 * ## O aviso não é formalidade
 *
 * Publicar uma gira publica uma lista de pontos de Umbanda ligada a uma
 * pessoa. Isso revela **convicção religiosa**, que é dado sensível (LGPD art.
 * 5º, II). A tela diz exatamente o que fica visível e o que não fica, ANTES de
 * a pessoa confirmar — consentimento que se dá sem saber do quê não é
 * consentimento.
 *
 * ## Por que o apelido é pedido aqui
 *
 * O servidor recusa publicar sem apelido. Podia-se mandar a pessoa para a tela
 * de conta e voltar, mas quem está publicando quer publicar — interromper para
 * um passo em outro lugar é onde a maioria desiste. Então o apelido é escolhido
 * aqui, no momento em que ele passa a fazer diferença.
 */
export function PublicarGira({
  gira,
  onFechar,
  onMudou,
}: {
  gira: Repertorio | null;
  onFechar: () => void;
  onMudou: (r: Repertorio) => void;
}) {
  const { user, recarregar } = useAuth();
  const [apelido, setApelido] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  /**
   * Fechar por QUALQUER caminho devolve o diálogo ao estado limpo.
   *
   * Este componente fica MONTADO com `gira={null}` — some da tela e guarda o
   * estado. Quem digitava um apelido, cancelava e reabria encontrava o campo
   * cheio e "Publicar" aceso.
   *
   * Aqui isso é pior que nos outros diálogos: o nome digitado nesta tela não
   * vale só para esta gira, vira o **nome público da pessoa em todo o app**.
   * Um toque, e um nome que ela descartou passa a aparecer embaixo de cada
   * ponto que ela enviar.
   *
   * Terceiro diálogo com a mesma falha (depois de `ApagarConta` e
   * `TrocarApelido`), e por isso agora existe cerca:
   * `dialogo-limpa-ao-fechar.test.ts`.
   */
  const fechar = () => {
    setApelido("");
    setErro(null);
    onFechar();
  };

  if (!gira) return null;

  const jaPublica = gira.publico === true;
  const precisaApelido = !jaPublica && !user?.apelido;

  const confirmar = async () => {
    setSalvando(true);
    setErro(null);
    try {
      if (precisaApelido) {
        await escolherApelido(apelido.trim());
        await recarregar();
      }
      onMudou(await definirVisibilidade(gira, !jaPublica));
      fechar();
    } catch (problema) {
      setErro(mensagemDeErro(problema, "Não consegui salvar."));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && fechar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {jaPublica
              ? <><Lock className="h-4 w-4" /> Fechar esta gira</>
              : <><Globe className="h-4 w-4" /> Tornar pública</>}
          </DialogTitle>
        </DialogHeader>

        <p className="-mt-1 truncate text-sm text-muted-foreground">{gira.nome}</p>

        {jaPublica ? (
          <p className="text-sm text-muted-foreground">
            Ela sai da vitrine e o link deixa de abrir. Quem já tiver copiado a
            sequência não perde o que copiou.
          </p>
        ) : (
          <div className="space-y-3 rounded-lg border border-dashed p-3">
            <p className="text-sm font-medium text-foreground">O que fica visível</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>· O nome da gira e a sequência de pontos</li>
              <li>· O seu <strong className="font-medium text-foreground">apelido</strong></li>
            </ul>
            <p className="text-sm font-medium text-foreground">O que nunca aparece</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>· Seu e-mail</li>
              <li>· Suas outras giras</li>
            </ul>
            {/* Dito sem rodeio: é o que a pessoa precisa pesar antes, não
                depois. Uma lista de pontos de Umbanda ligada a alguém revela
                a religião dessa pessoa para qualquer um que abra o link. */}
            <p className="text-xs leading-snug text-amber-400/90">
              Uma gira pública fica visível para qualquer pessoa, inclusive sem
              conta — e revela que você é de Umbanda. Publique só se estiver
              tudo bem para você.
            </p>
          </div>
        )}

        {precisaApelido && (
          <div>
            <label htmlFor="apelido" className="mb-1 block text-sm text-muted-foreground">
              Como você quer aparecer
            </label>
            <Input
              id="apelido"
              autoFocus
              value={apelido}
              onChange={(e) => setApelido(e.target.value)}
              placeholder="Terreiro de Ogum, Casa da Mata..."
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Não precisa ser seu nome. É só como as pessoas verão suas giras.
            </p>
          </div>
        )}

        {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}

        <div className="flex gap-2">
          <Button
            onClick={confirmar}
            disabled={salvando || (precisaApelido && apelido.trim().length < 2)}
            variant={jaPublica ? "outline" : "default"}
            className="flex-1"
          >
            {salvando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {jaPublica ? "Fechar gira" : "Publicar"}
          </Button>
          <Button variant="ghost" onClick={fechar}>Cancelar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
