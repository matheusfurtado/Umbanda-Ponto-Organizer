import { useEffect, useState } from "react";
import { Check, Copy, Globe, Link2, Loader2, Lock, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  criarLink, revogarLink, trocarLink, type LinkDaGira, type Repertorio,
} from "@/api/repertorio";
import { mensagemDeErro } from "@/api/cliente";

/**
 * O link de uma gira — "compartilhe só com quem você quer".
 *
 * ## Por que existe um terceiro estado
 *
 * Antes a gira era pública (na vitrine, achável por qualquer um) ou privada
 * (só de quem montou). O que as pessoas fazem de fato é o meio: mandar a gira
 * para o terreiro **sem pendurá-la numa vitrine**. Sem esse estado, quem
 * quisesse compartilhar com cinco pessoas tinha de publicar para o mundo.
 *
 * ## Desfazer é o que faz a promessa ser verdade
 *
 * Um link que não se desfaz não é "só com quem eu quero" — é "com quem eu quis
 * uma vez". Por isso os dois botões ao lado do endereço não são enfeite:
 * **trocar** mata o endereço antigo na hora, **desfazer** fecha a gira.
 *
 * ## Quem abre precisa de conta
 *
 * É dito na tela, e não escondido: quem recebe o link vai ter de entrar. A
 * conta é grátis. Deixar isso implícito faria a pessoa mandar o link achando
 * que abre para qualquer um, e descobrir pelo amigo que não abriu.
 */
export function LinkDaPlaylist({
  gira,
  onMudou,
}: {
  gira: Repertorio;
  onMudou: (mudanca: Partial<Repertorio>) => void;
}) {
  const [link, setLink] = useState<LinkDaGira | null>(
    gira.token ? { token: gira.token, url: null } : null,
  );
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  // Trocar de gira dentro do mesmo diálogo tem de trocar o link mostrado. Sem
  // isto, o endereço da gira anterior ficava na tela da seguinte — que é o pior
  // erro possível aqui, porque a pessoa copiaria o link errado.
  useEffect(() => {
    setLink(gira.token ? { token: gira.token, url: null } : null);
    setErro(null);
    setCopiado(false);
  }, [gira.id, gira.token]);

  /**
   * O endereço mostrado.
   *
   * O servidor manda a URL pronta (ele é quem sabe o endereço do app), mas ao
   * reabrir o diálogo só temos o token guardado na gira — então a URL é
   * remontada aqui a partir da origem do navegador. As duas dão no mesmo lugar.
   */
  const endereco = link?.url ?? (link?.token
    ? `${window.location.origin}/g/${link.token}`
    : null);

  const agir = async (
    o_que: () => Promise<LinkDaGira>,
  ) => {
    setOcupado(true);
    setErro(null);
    setCopiado(false);
    try {
      const novo = await o_que();
      setLink(novo.token ? novo : null);
      onMudou({ token: novo.token });
    } catch (problema) {
      setErro(mensagemDeErro(problema, "Não consegui mexer no link."));
    } finally {
      setOcupado(false);
    }
  };

  const copiar = async () => {
    if (!endereco) return;
    try {
      await navigator.clipboard.writeText(endereco);
      setCopiado(true);
    } catch {
      // Navegador que recusa a área de transferência (fora de HTTPS, aba
      // restrita): o endereço já está na tela, selecionável. Um botão que não
      // faz nada e não diz nada é o que se evita aqui.
      setErro("Não consegui copiar. Selecione o endereço acima e copie à mão.");
    }
  };

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium text-foreground">Compartilhar por link</p>
      </div>

      {endereco === null ? (
        <>
          <p className="text-sm text-muted-foreground">
            Um endereço só seu, para mandar no grupo do terreiro. A playlist não
            entra em vitrine nenhuma e não aparece em buscas — abre só para quem
            você mandar.
          </p>
          <Button
            size="sm"
            disabled={ocupado}
            onClick={() => agir(() => criarLink(gira.id))}
          >
            {ocupado && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
            Criar link
          </Button>
        </>
      ) : (
        <>
          <p
            className="break-all rounded bg-muted px-2 py-1.5 font-mono text-xs text-foreground"
            data-teste="endereco-da-gira"
          >
            {endereco}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={copiar} disabled={ocupado}>
              {copiado
                ? <><Check className="mr-2 h-4 w-4" aria-hidden /> Copiado</>
                : <><Copy className="mr-2 h-4 w-4" aria-hidden /> Copiar</>}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={ocupado}
              onClick={() => agir(() => trocarLink(gira.id))}
              title="Sorteia outro endereço. O antigo para de abrir na hora."
            >
              <RefreshCw className="mr-2 h-4 w-4" aria-hidden /> Trocar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={ocupado}
              onClick={() => agir(() => revogarLink(gira.id))}
            >
              <X className="mr-2 h-4 w-4" aria-hidden /> Desfazer
            </Button>
          </div>
          <p className="text-xs leading-snug text-muted-foreground">
            Quem abrir precisa entrar — a conta é grátis. <strong className="font-medium text-foreground">Desfazer</strong>{" "}
            fecha o endereço para todo mundo, inclusive para quem já o tem.
          </p>
        </>
      )}

      {erro && <p role="alert" className="text-sm text-destructive">{erro}</p>}
    </div>
  );
}

/** Os ícones dos três estados, para quem lê a lista de giras de relance. */
export function SeloDeVisibilidade({ gira }: { gira: Repertorio }) {
  if (gira.publico) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Globe className="h-3 w-3" aria-hidden /> Na vitrine
      </span>
    );
  }
  if (gira.token) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link2 className="h-3 w-3" aria-hidden /> Por link
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Lock className="h-3 w-3" aria-hidden /> Só sua
    </span>
  );
}
