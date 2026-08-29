/**
 * O dono editando a própria página.
 *
 * ## Só aparece para quem pode, e quem decide isso é o servidor
 *
 * `possoEditar` vem da API. Decidir no cliente daria botão que aparece e não
 * funciona — e a API responde 403 de qualquer jeito, então esconder aqui é
 * conveniência, nunca a defesa.
 *
 * ## O nome não está aqui
 *
 * Ele casa com o canal do vídeo para ligar os pontos ao artista. Mudá-lo
 * desfaria esse elo na próxima importação: a página ficaria com o nome novo e
 * sem ponto nenhum. Trocar o nome é conversa com quem modera.
 *
 * ## Manda só o que mudou
 *
 * O `PATCH` trata campo ausente como "não mexi" e campo vazio como "apaga".
 * Mandar os dois sempre faria uma edição de bio zerar o canal de quem deixou o
 * campo em branco por não ter mexido nele.
 */

import { useRef, useState } from "react";
import { ImageOff, Loader2, Pencil, Upload } from "lucide-react";
import { mensagemDeErro } from "@/api/cliente";
import {
  editarArtista,
  tirarFotoDoArtista,
  trocarFotoDoArtista,
  type Artista,
} from "@/api/artista";

export function EditarArtista({
  artista,
  onMudou,
}: {
  artista: Artista;
  onMudou: (a: Artista) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [bio, setBio] = useState(artista.bio ?? "");
  const [canalUrl, setCanalUrl] = useState(artista.canalUrl ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      const corpo: { bio?: string; canalUrl?: string } = {};
      if (bio !== (artista.bio ?? "")) corpo.bio = bio;
      if (canalUrl !== (artista.canalUrl ?? "")) corpo.canalUrl = canalUrl;
      if (Object.keys(corpo).length === 0) {
        setAberto(false);
        return;
      }
      onMudou(await editarArtista(artista.id, corpo));
      setAberto(false);
    } catch (problema) {
      setErro(mensagemDeErro(problema, "Não consegui salvar."));
    } finally {
      setSalvando(false);
    }
  }

  async function comFoto(arquivo: File | undefined) {
    if (!arquivo) return;
    setSalvando(true);
    setErro(null);
    try {
      const { foto } = await trocarFotoDoArtista(artista.id, arquivo);
      onMudou({ ...artista, foto });
    } catch (problema) {
      setErro(mensagemDeErro(problema, "Não consegui enviar."));
    } finally {
      setSalvando(false);
      // Sem isto, escolher o MESMO arquivo de novo não dispara `change` — e
      // quem tentou corrigir um upload que falhou acha que o botão quebrou.
      if (entrada.current) entrada.current.value = "";
    }
  }

  async function semFoto() {
    setSalvando(true);
    setErro(null);
    try {
      await tirarFotoDoArtista(artista.id);
      onMudou({ ...artista, foto: null });
    } catch (problema) {
      setErro(mensagemDeErro(problema, "Não consegui tirar."));
    } finally {
      setSalvando(false);
    }
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-2"
      >
        <Pencil className="h-4 w-4" aria-hidden /> Editar a página
      </button>
    );
  }

  return (
    <form onSubmit={(e) => void salvar(e)} className="mt-4 space-y-3 border-t pt-4">
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-foreground">Sobre você</span>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={2000}
          rows={4}
          placeholder="Quem canta, de onde vem, o que grava."
          className="w-full rounded-md border bg-background p-2 text-sm"
        />
      </label>

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
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={entrada}
          type="file"
          accept="image/*"
          onChange={(e) => void comFoto(e.target.files?.[0])}
          className="hidden"
          id={`foto-${artista.id}`}
        />
        <label
          htmlFor={`foto-${artista.id}`}
          className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-sm font-medium"
        >
          <Upload className="h-4 w-4" aria-hidden /> Trocar a foto
        </label>
        {artista.foto && (
          <button
            type="button"
            onClick={() => void semFoto()}
            disabled={salvando}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md border px-3 text-sm text-muted-foreground disabled:opacity-60"
          >
            <ImageOff className="h-4 w-4" aria-hidden /> Tirar a foto
          </button>
        )}
      </div>

      {erro && (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={salvando}
          className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {salvando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Salvar
        </button>
        <button
          type="button"
          onClick={() => {
            setBio(artista.bio ?? "");
            setCanalUrl(artista.canalUrl ?? "");
            setErro(null);
            setAberto(false);
          }}
          disabled={salvando}
          className="min-h-11 px-3 text-sm text-muted-foreground disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
