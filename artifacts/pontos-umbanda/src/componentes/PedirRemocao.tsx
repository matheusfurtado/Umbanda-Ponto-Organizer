/**
 * "Este canal é meu e eu não quero aparecer aqui."
 *
 * ## Por que existe
 *
 * As páginas de artista publicam canais reais como artistas de Umbanda, com
 * nome e endereço, **sem que ninguém tenha pedido**. É pessoa identificável
 * associada a uma religião, e até 29/08 não havia saída nenhuma.
 *
 * ## Discreto, e ainda assim achável
 *
 * Fica no fim, junto do denunciar — mas com texto próprio. "Denunciar esta
 * página" não é o que a pessoa procura quando o problema é ela mesma estar
 * ali; ela procura alguma coisa que diga "tire isto". Se o único caminho fosse
 * a denúncia, a saída existiria e ninguém acharia.
 *
 * ## Sem campo obrigatório
 *
 * Contato e explicação são opcionais no servidor, e a tela não pode ser mais
 * exigente que ele: quem quer sair pode não querer deixar nem contato nem
 * motivo, e um formulário a ser vencido é uma saída que não sai.
 */

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { pedirRemocaoDoArtista } from "@/api/artista";
import { ehErroDeApi, ehErroDeRede } from "@/api/cliente";

type Fase = "fechado" | "escrevendo" | "enviado";

export function PedirRemocao({ artistaId }: { artistaId: string }) {
  const [fase, setFase] = useState<Fase>("fechado");
  const [contato, setContato] = useState("");
  const [relato, setRelato] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [recado, setRecado] = useState("");

  async function enviar() {
    setEnviando(true);
    setErro(null);
    try {
      const r = await pedirRemocaoDoArtista(artistaId, {
        contato: contato.trim() || undefined,
        relato: relato.trim() || undefined,
      });
      setRecado(r?.mensagem ?? "Pronto — a página saiu do ar agora.");
      setFase("enviado");
    } catch (problema) {
      setErro(
        ehErroDeRede(problema)
          ? "Sem conexão. Verifique a internet e tente de novo."
          : ehErroDeApi(problema)
            ? problema.detalhe
            : "Não consegui enviar agora.",
      );
    } finally {
      setEnviando(false);
    }
  }

  if (fase === "enviado") {
    return <p className="text-xs text-muted-foreground">{recado}</p>;
  }

  if (fase === "fechado") {
    return (
      <button
        type="button"
        onClick={() => setFase("escrevendo")}
        className="inline-flex min-h-11 items-center text-xs text-muted-foreground underline underline-offset-2"
      >
        Este canal é meu e eu não quero aparecer aqui
      </button>
    );
  }

  return (
    <div className="max-w-md rounded-lg border bg-card p-3">
      <p className="text-sm font-medium text-foreground">Tirar esta página do ar</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        A página sai do ar assim que você enviar. Depois uma pessoa revisa — e
        responde, se você deixar um contato. Os dois campos são opcionais.
      </p>

      <input
        value={contato}
        onChange={(e) => setContato(e.target.value)}
        maxLength={200}
        placeholder="Contato para resposta (opcional)"
        aria-label="Contato para resposta"
        className="mt-3 w-full rounded-md border bg-background p-2 text-sm outline-none focus:border-primary/60"
      />
      <textarea
        value={relato}
        onChange={(e) => setRelato(e.target.value)}
        maxLength={2000}
        rows={3}
        placeholder="Quer explicar? (opcional)"
        aria-label="Explicação"
        className="mt-2 w-full rounded-md border bg-background p-2 text-sm outline-none focus:border-primary/60"
      />

      {erro && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {erro}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void enviar()}
          disabled={enviando}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm font-medium disabled:opacity-60"
        >
          {enviando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Tirar do ar
        </button>
        <button
          type="button"
          onClick={() => setFase("fechado")}
          disabled={enviando}
          className="min-h-11 px-3 text-sm text-muted-foreground disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
