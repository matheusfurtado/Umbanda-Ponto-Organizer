/**
 * A fila de denúncias.
 *
 * ## O que esta tela mostra, e o que ela esconde
 *
 * Mostra o que foi apontado — o apelido, o nome da gira, a foto quando é
 * denúncia de imagem — e **quantas denúncias o mesmo alvo tem**. É esse número
 * que separa caso isolado de ataque coordenado contra uma casa, e ele fica em
 * destaque quando passa de um.
 *
 * Não mostra quem denunciou. Os admins deste app são gente da mesma
 * comunidade, não funcionários neutros: entregar a eles o mapa de quem apontou
 * quem é entregar as desavenças do terreiro a alguém que vive nele.
 *
 * ## As ações são explícitas, e nenhuma é padrão
 *
 * Não há botão grande de "remover". Quem acolhe escolhe o que fazer, e a tela
 * diz o que cada escolha faz — inclusive que tirar a foto **não tem volta**.
 */

import { useCallback, useEffect, useState } from "react";
import { mensagemDeErro } from "@/api/cliente";
import { AlertCircle, Flag, Loader2, RefreshCw, ShieldCheck, Undo2 } from "lucide-react";
import {
  acolher,
  filaDeDenuncias,
  recusarDenuncia,
  type DenunciaNaFila,
} from "@/api/denuncia";
import { acoesDe } from "@/dominio/acoesDaDenuncia";

const MOTIVO: Record<string, string> = {
  ofensivo: "Ofensivo ou desrespeitoso",
  imagem_impropria: "Imagem imprópria",
  nao_e_ponto: "Não é ponto de Umbanda",
  engano: "Errado ou engana quem canta",
  outro: "Outro motivo",
};

const ALVO: Record<string, string> = {
  perfil: "Perfil",
  gira: "Gira pública",
  ponto: "Ponto",
  artista: "Página de artista",
};

export function TelaDenuncias() {
  const [fila, setFila] = useState<DenunciaNaFila[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [decidindo, setDecidindo] = useState<string | null>(null);

  const carregar = useCallback(() => {
    filaDeDenuncias()
      .then(setFila)
      .catch((p) => setErro(mensagemDeErro(p, "Não consegui carregar.")));
  }, []);

  useEffect(carregar, [carregar]);

  async function decidir(id: string, acao: () => Promise<void>) {
    setOcupado(id);
    setErro(null);
    try {
      await acao();
      setDecidindo(null);
      carregar();
    } catch (p) {
      setErro(mensagemDeErro(p, "Não consegui."));
    } finally {
      setOcupado(null);
    }
  }

  if (erro && !fila) {
    return (
      <div className="max-w-3xl px-4 pb-24 pt-16 sm:px-8">
        <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" aria-hidden />
          <p>{erro}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="max-w-3xl px-4 pb-24 pt-5 sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
              <Flag className="h-6 w-6 text-primary" aria-hidden />
              Denúncias
            </h1>
            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              Nada foi removido automaticamente. Você decide cada uma — e a fila
              não diz quem denunciou.
            </p>
          </div>
          <button
            type="button"
            onClick={carregar}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-medium"
          >
            <RefreshCw className="h-4 w-4" aria-hidden /> Atualizar
          </button>
        </div>

        {erro && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {erro}
          </p>
        )}

        {!fila && (
          <div aria-busy="true" className="mt-6 space-y-3">
            <div className="h-32 animate-pulse rounded-lg bg-muted/40" />
            <div className="h-32 animate-pulse rounded-lg bg-muted/30" />
          </div>
        )}

        {fila?.length === 0 && (
          <div className="mt-6 rounded-lg border border-dashed p-8 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground/50" aria-hidden />
            <p className="mt-2 text-sm text-muted-foreground">Nada esperando revisão.</p>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {fila?.map((d) => (
            <article key={d.id} className="rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {ALVO[d.alvoTipo] ?? d.alvoTipo}
                  </p>
                  <p className="mt-0.5 break-words text-lg font-bold text-foreground">
                    {d.alvoDescricao}
                  </p>
                </div>
                {d.denunciasNoAlvo > 1 && (
                  // Em destaque porque é o sinal que distingue caso isolado de
                  // ataque coordenado — e ele não decide nada sozinho.
                  <span className="rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600">
                    {d.denunciasNoAlvo} denúncias neste conteúdo
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm text-foreground">
                {MOTIVO[d.motivo] ?? d.motivo}
              </p>
              {d.detalhe && (
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                  {d.detalhe}
                </p>
              )}

              {d.alvoFoto && (
                <img
                  src={d.alvoFoto}
                  alt="A imagem denunciada"
                  className="mt-3 h-24 w-24 rounded-lg object-cover"
                />
              )}

              {decidindo === d.id ? (
                <div className="mt-3 flex flex-col gap-2 border-t pt-3">
                  <p className="text-xs text-muted-foreground">
                    A denúncia procede. O que fazer?
                  </p>
                  {acoesDe(d.alvoTipo).map((a) => (
                    <button
                      key={a.valor}
                      type="button"
                      disabled={ocupado === d.id}
                      onClick={() => void decidir(d.id, () => acolher(d.id, a.valor))}
                      className="inline-flex min-h-11 items-center gap-2 self-start rounded-md border px-3 text-sm font-medium disabled:opacity-60"
                    >
                      {ocupado === d.id && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                      {a.rotulo}
                      {a.aviso && (
                        <span className="text-xs font-normal text-muted-foreground">
                          — {a.aviso}
                        </span>
                      )}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setDecidindo(null)}
                    className="min-h-11 self-start px-1 text-sm text-muted-foreground"
                  >
                    Voltar
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                  <button
                    type="button"
                    onClick={() => setDecidindo(d.id)}
                    disabled={ocupado === d.id}
                    className="min-h-11 rounded-md border px-3 text-sm font-medium disabled:opacity-60"
                  >
                    Procede…
                  </button>
                  <button
                    type="button"
                    onClick={() => void decidir(d.id, () => recusarDenuncia(d.id))}
                    disabled={ocupado === d.id}
                    className="inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm font-medium text-muted-foreground disabled:opacity-60"
                  >
                    {ocupado === d.id && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                    <Undo2 className="h-4 w-4" aria-hidden />
                    Não procede
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
