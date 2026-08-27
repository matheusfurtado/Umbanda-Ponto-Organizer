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

import { useEffect, useState } from "react";
import {
  AlertCircle, CloudOff, GitCompare, Loader2, RefreshCw, UploadCloud,
} from "lucide-react";
import { ehErroDeApi, ehErroDeRede } from "../api/cliente";
import { contarSoDoServidor, descartarPendente, forcarEnvio } from "../dados/repositorio";
import { useApp } from "../context";

export function AvisoAcervo() {
  const { estado, fonte, motivoFalha, envio, sincronizarAgora, recarregar } = useApp();
  const [soDoServidor, setSoDoServidor] = useState(0);
  /**
   * A decisão do conflito é a única ação desta faixa que fala com a rede — e
   * era a única sem estado nenhum.
   *
   * "Manter o deste aparelho" relê a versão do servidor antes de gravar. Numa
   * rede ruim isso demora, e o botão ficava idêntico a antes do clique: a
   * pessoa clicava de novo, ou concluía que não funcionou. Se a rede caísse,
   * a promessa era descartada em silêncio (`void`) e NADA aparecia — no exato
   * momento em que ela está decidindo qual cópia da gira dela sobrevive.
   */
  const [resolvendo, setResolvendo] = useState(false);
  const [erroDecisao, setErroDecisao] = useState<string | null>(null);

  async function manterODaqui() {
    setResolvendo(true);
    setErroDecisao(null);
    try {
      await forcarEnvio();
    } catch (problema) {
      setErroDecisao(
        ehErroDeRede(problema)
          ? "Sem conexão para enviar agora. Seus pontos continuam guardados aqui — tente de novo quando a rede voltar."
          : ehErroDeApi(problema)
            ? `O servidor respondeu ${problema.status}. Seus pontos continuam guardados aqui.`
            : "Não consegui enviar. Seus pontos continuam guardados aqui.",
      );
    } finally {
      setResolvendo(false);
    }
  }

  // Só conta quando há conflito de verdade: fora dele a consulta seria uma ida
  // ao servidor a cada render, para uma informação que ninguém vai ler.
  useEffect(() => {
    if (!envio.conflito) {
      setSoDoServidor(0);
      return;
    }
    let vivo = true;
    contarSoDoServidor()
      .then((n) => vivo && setSoDoServidor(n))
      // Falha aqui não pode atrapalhar: o aviso principal continua de pé, e
      // sem o número ele ainda diz o essencial.
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, [envio.conflito]);

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

  // Conflito: os dois lados têm mudança e ninguém pode ser descartado em
  // silêncio. A pessoa decide — por isso isto vem ANTES do aviso de pendência,
  // e traz as duas saídas explícitas.
  if (envio.conflito) {
    return (
      <div
        role="alert"
        className="mx-3 my-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs"
      >
        <p className="flex items-center gap-2 font-medium text-amber-200">
          <GitCompare className="h-4 w-4 shrink-0" aria-hidden />
          Seus pontos mudaram em outro aparelho
        </p>
        <p className="mt-1 leading-snug text-muted-foreground">
          O que você fez aqui ainda não subiu, e o que veio do outro aparelho
          está guardado. Nada foi perdido — escolha o que fica.
        </p>
        {/* Quantos pontos existem lá e não aqui.
            O servidor acrescenta sozinho os que a comunidade aprovou desde a
            última leitura, então "manter o deste aparelho" pode descartar ponto
            que a pessoa NUNCA VIU. Descartar o que se escolheu apagar é uma
            decisão; descartar o que nunca apareceu na tela é uma surpresa — e a
            diferença precisa aparecer antes do clique. */}
        {soDoServidor > 0 && (
          <p className="mt-1 leading-snug text-amber-200/90">
            Atenção: {soDoServidor}{" "}
            {soDoServidor === 1 ? "ponto está" : "pontos estão"} só no servidor —
            pode ser novidade da comunidade que ainda não chegou aqui. Manter o
            deste aparelho{" "}
            {soDoServidor === 1 ? "o descarta" : "os descarta"}.
          </p>
        )}
        {erroDecisao && (
          <p role="alert" className="mt-2 leading-snug text-destructive">
            {erroDecisao}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void manterODaqui()}
            disabled={resolvendo}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-amber-500/40 px-3 font-medium text-amber-200 disabled:opacity-60"
          >
            {resolvendo && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {resolvendo ? "Enviando…" : "Manter o deste aparelho"}
          </button>
          <button
            type="button"
            onClick={() => {
              descartarPendente();
              recarregar();
            }}
            disabled={resolvendo}
            className="min-h-11 rounded-md border px-3 font-medium text-muted-foreground disabled:opacity-60"
          >
            Ficar com o do outro
          </button>
        </div>
      </div>
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
