/**
 * "Quero o perfil do meu canal."
 *
 * ## A tela diz o passo seguinte antes de a pessoa pedir
 *
 * O código só serve se for colado no canal, e quem descobre isso DEPOIS de
 * enviar já fechou a aba. Por isso o passo a passo aparece antes do botão, e o
 * código fica guardado em "meus pedidos" — voltar e reencontrá-lo é parte do
 * fluxo, não recuperação de erro.
 *
 * ## Dois caminhos, um formulário
 *
 * Reivindicar um canal que já tem página, ou pedir página para um canal que
 * ainda não está no acervo. O segundo é o que abre a porta para quem tem poucos
 * pontos casados — o corte de 10+ deixa 88 canais de fora.
 */

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { BadgeCheck, Clock, Copy, Mic2, XCircle } from "lucide-react";
import { listarArtistas, type ArtistaResumo } from "@/api/artista";
import { mensagemDeErro } from "@/api/cliente";
import {
  meusPedidosDeArtista,
  pedirPerfilDeArtista,
  type PedidoDeArtista,
} from "@/api/pedidoArtista";

const CARA: Record<string, { icone: typeof Clock; texto: string; cor: string }> = {
  pendente: { icone: Clock, texto: "Esperando revisão", cor: "text-amber-400" },
  aprovado: { icone: BadgeCheck, texto: "Aprovado", cor: "text-emerald-400" },
  recusado: { icone: XCircle, texto: "Recusado", cor: "text-destructive" },
};

export function TelaPedirArtista() {
  const [artistas, setArtistas] = useState<ArtistaResumo[]>([]);
  const [meus, setMeus] = useState<PedidoDeArtista[] | null>(null);

  const [modo, setModo] = useState<"existente" | "novo">("existente");
  const [artistaId, setArtistaId] = useState("");
  const [nomeDoCanal, setNomeDoCanal] = useState("");
  const [canalUrl, setCanalUrl] = useState("");
  const [recado, setRecado] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function recarregar() {
    meusPedidosDeArtista()
      .then(setMeus)
      .catch((e) => setErro(mensagemDeErro(e, "Falha ao carregar.")));
  }

  useEffect(() => {
    listarArtistas()
      .then((lista) => setArtistas(lista.filter((a) => a.pontos > 0)))
      .catch(() => setArtistas([]));
    recarregar();
  }, []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      await pedirPerfilDeArtista({
        ...(modo === "existente"
          ? { artistaId }
          : { nomeDoCanal: nomeDoCanal.trim() }),
        canalUrl: canalUrl.trim(),
        recado: recado.trim() || undefined,
      });
      setNomeDoCanal("");
      setCanalUrl("");
      setRecado("");
      setArtistaId("");
      recarregar();
    } catch (problema) {
      setErro(
        mensagemDeErro(problema, "Não consegui enviar agora."),
      );
    } finally {
      setEnviando(false);
    }
  }

  const podeEnviar =
    canalUrl.trim().length > 0 &&
    (modo === "existente" ? artistaId.length > 0 : nomeDoCanal.trim().length > 0);

  return (
    <div className="max-w-2xl px-4 pb-24 pt-5 sm:px-8">
      <h1 className="flex items-center gap-2 text-2xl font-black text-foreground sm:text-3xl">
        <Mic2 className="h-6 w-6 text-primary" aria-hidden /> O perfil do seu canal
      </h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        Se você tem um canal de pontos, pode ter a página dele aqui — e passar a
        editar o que aparece nela.
      </p>

      <ol className="mb-8 space-y-2 rounded-xl border bg-card/40 p-4 text-sm text-muted-foreground">
        <li>
          <strong className="text-foreground">1.</strong> Mande o pedido abaixo.
        </li>
        <li>
          <strong className="text-foreground">2.</strong> Nós damos um código.
          Cole ele na descrição do seu canal, ou de um vídeo.
        </li>
        <li>
          <strong className="text-foreground">3.</strong> Uma pessoa abre o seu
          canal e confere. É assim que sabemos que o canal é seu — e é o que
          impede outra pessoa de reivindicá-lo.
        </li>
      </ol>

      <form onSubmit={(e) => void enviar(e)} className="space-y-4">
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium text-foreground">
            O seu canal já tem página aqui?
          </legend>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="radio"
              name="modo"
              checked={modo === "existente"}
              onChange={() => setModo("existente")}
            />
            Sim, é um destes
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="radio"
              name="modo"
              checked={modo === "novo"}
              onChange={() => setModo("novo")}
            />
            Ainda não tem
          </label>
        </fieldset>

        {modo === "existente" ? (
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-foreground">Qual deles</span>
            <select
              value={artistaId}
              onChange={(e) => setArtistaId(e.target.value)}
              className="min-h-11 w-full rounded-md border bg-background p-2 text-sm"
            >
              <option value="">Escolha o canal</option>
              {artistas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome} ({a.pontos} pontos)
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-foreground">
              Nome do canal
            </span>
            <input
              value={nomeDoCanal}
              onChange={(e) => setNomeDoCanal(e.target.value)}
              maxLength={120}
              placeholder="Como o canal se chama no YouTube"
              className="min-h-11 w-full rounded-md border bg-background p-2 text-sm"
            />
          </label>
        )}

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-foreground">
            Endereço do canal
          </span>
          <input
            value={canalUrl}
            onChange={(e) => setCanalUrl(e.target.value)}
            maxLength={500}
            placeholder="https://www.youtube.com/@seucanal"
            className="min-h-11 w-full rounded-md border bg-background p-2 text-sm"
          />
          <span className="mt-1 block text-xs text-muted-foreground">
            Com <code>https://</code> — é este link que a pessoa vai abrir.
          </span>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-foreground">
            Quer dizer alguma coisa? (opcional)
          </span>
          <textarea
            value={recado}
            onChange={(e) => setRecado(e.target.value)}
            maxLength={1000}
            rows={3}
            className="w-full rounded-md border bg-background p-2 text-sm"
          />
        </label>

        {erro && (
          <p role="alert" className="text-sm text-destructive">
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando || !podeEnviar}
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {enviando ? "Enviando..." : "Enviar pedido"}
        </button>
      </form>

      <h2 className="mb-3 mt-10 text-lg font-bold text-foreground">Seus pedidos</h2>
      {meus === null ? (
        <div aria-busy="true" className="h-20 animate-pulse rounded-xl bg-muted/40" />
      ) : meus.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Você ainda não pediu nenhum perfil.
        </p>
      ) : (
        <ul className="space-y-3">
          {meus.map((p) => {
            const cara = CARA[p.status] ?? CARA.pendente;
            const Icone = cara.icone;
            return (
              <li key={p.id} className="rounded-xl border bg-card/40 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  {p.nomeDoCanal}
                </p>
                <p className={`mt-1 flex items-center gap-1.5 text-xs ${cara.cor}`}>
                  <Icone className="h-3.5 w-3.5" aria-hidden /> {cara.texto}
                </p>

                {p.status === "pendente" && (
                  <div className="mt-3 rounded-lg bg-muted/40 p-3">
                    <p className="text-xs text-muted-foreground">
                      Cole este código na descrição do canal (ou de um vídeo):
                    </p>
                    <p className="mt-1 flex items-center gap-2">
                      <code className="select-all rounded bg-background px-2 py-1 text-sm font-semibold tracking-wide text-foreground">
                        {p.codigo}
                      </code>
                      <button
                        type="button"
                        onClick={() => void navigator.clipboard?.writeText(p.codigo)}
                        className="inline-flex min-h-11 items-center gap-1 text-xs text-primary underline"
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden /> copiar
                      </button>
                    </p>
                  </div>
                )}

                {p.status === "recusado" && p.motivo && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Motivo: {p.motivo}
                  </p>
                )}
                {p.status === "aprovado" && p.artistaId && (
                  <Link
                    href={`/artista/${encodeURIComponent(p.artistaId)}`}
                    className="mt-2 inline-block text-xs text-primary underline"
                  >
                    Ver a sua página
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
