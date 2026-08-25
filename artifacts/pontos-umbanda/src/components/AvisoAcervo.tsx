/**
 * A faixa que diz ao usuário de onde vieram os pontos que ele está lendo.
 *
 * Desenho deliberado: **isto nunca bloqueia a tela.** Na gira, um modal de erro
 * entre a pessoa e a letra do ponto é pior que dado um pouco velho. O acervo
 * inteiro está no aparelho; a faixa informa, o app continua.
 *
 * A única exceção é a primeira abertura sem rede e sem cache — aí não há o que
 * mostrar, e aí sim a tela precisa dizer isso.
 */

import { AlertCircle, CloudOff, RefreshCw, UploadCloud } from "lucide-react";
import { useApp } from "../context";

export function AvisoAcervo() {
  const { estado, fonte, motivoFalha, envio, sincronizarAgora, recarregar } = useApp();

  if (estado === "erro") {
    return (
      <div className="mx-3 my-2 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden />
          <div className="flex-1">
            <p className="font-medium">Não consegui carregar os pontos</p>
            <p className="mt-1 text-muted-foreground">
              {motivoFalha}. Este aparelho ainda não tem uma cópia guardada — conecte-se
              uma vez e o acervo fica disponível offline depois.
            </p>
            <button
              type="button"
              onClick={recarregar}
              className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md border px-4 text-sm font-medium"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Tentar de novo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Lendo do aparelho porque a rede falhou. Informa sem estorvar.
  if (fonte === "cache") {
    return (
      <Faixa
        icone={<CloudOff className="h-4 w-4" aria-hidden />}
        acao={{ rotulo: "Atualizar", aoClicar: recarregar }}
      >
        Mostrando os pontos guardados neste aparelho — {motivoFalha}.
      </Faixa>
    );
  }

  // Há mudança local que o servidor ainda não recebeu.
  if (envio.pendente) {
    return (
      <Faixa
        icone={<UploadCloud className="h-4 w-4" aria-hidden />}
        acao={envio.enviando ? undefined : { rotulo: "Enviar agora", aoClicar: sincronizarAgora }}
      >
        {envio.enviando
          ? "Salvando suas mudanças…"
          : envio.ultimoErro
            ? `Suas mudanças estão salvas neste aparelho, mas ainda não subiram — ${envio.ultimoErro}.`
            : "Suas mudanças estão salvas neste aparelho e vão subir em instantes."}
      </Faixa>
    );
  }

  return null;
}

function Faixa({
  icone,
  children,
  acao,
}: {
  icone: React.ReactNode;
  children: React.ReactNode;
  acao?: { rotulo: string; aoClicar: () => void };
}) {
  return (
    <div
      role="status"
      className="mx-3 my-2 flex items-center gap-2 rounded-lg border bg-muted/60 px-3 py-2 text-xs text-muted-foreground"
    >
      <span className="shrink-0">{icone}</span>
      <span className="flex-1">{children}</span>
      {acao && (
        <button
          type="button"
          onClick={acao.aoClicar}
          className="min-h-11 shrink-0 px-2 font-medium underline underline-offset-2"
        >
          {acao.rotulo}
        </button>
      )}
    </div>
  );
}
