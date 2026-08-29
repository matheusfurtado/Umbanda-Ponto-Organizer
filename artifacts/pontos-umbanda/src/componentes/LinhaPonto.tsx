import { useState } from "react";
import { ChevronDown, Star, Youtube, AlertTriangle, VideoOff, Plus, UserPen, Clock } from "lucide-react";
import { Link } from "wouter";
import { useApp } from "@/context";
import { destacar } from "@/lib/destacar";
import type { Ponto } from "@/types";
import { registrarCliqueNoPonto } from "@/api/metricas";
import { CreditoDoArtista } from "@/componentes/CreditoDoArtista";

/**
 * Um ponto como LINHA de lista — no formato de faixa.
 *
 * ## O que mudou e por quê
 *
 * Antes o ponto era um cartão que só mostrava o título; letra e vídeo só
 * apareciam depois de expandir. O dono do produto abriu o app e perguntou onde
 * estava o link do YouTube — ele existia, escondido atrás de um clique que
 * ninguém adivinha.
 *
 * Agora a linha carrega o que se usa: título, autor, canal, duração e o botão
 * do vídeo **visível**. Expandir passou a ser só para ler a letra inteira.
 *
 * ## A honestidade do casamento continua
 *
 * Dos 510 pontos com vídeo, 157 são palpite (`revisar`). Palpite com a mesma
 * cara de acerto é o tipo de mentira que aparece na pior hora: a pessoa aperta
 * play no meio da gira e toca outra música. Por isso o ícone e a cor mudam.
 */
/**
 * Quanto tempo um ponto continua sendo "novo".
 *
 * Trinta dias, decidido no CLIENTE de propósito: o que conta como recente é
 * apresentação, e mudar isso não deveria exigir mexer no servidor nem uma
 * migration.
 */
const DIAS_DE_NOVIDADE = 30;

function eNovo(aprovadoEm?: number | null): boolean {
  if (!aprovadoEm) return false;
  return Date.now() - aprovadoEm < DIAS_DE_NOVIDADE * 24 * 60 * 60 * 1000;
}

/**
 * Segundos no formato de faixa: `2:05`, e `1:19:21` quando passa da hora.
 *
 * Sem o ramo da hora, um vídeo de 1h19 saía como **"79:21"**. Ninguém lê
 * duração assim — quem procura um ponto curto para ensaiar teria de fazer a
 * conta. Hoje é 1 vídeo em 360 no acervo, e vai crescer: os canais que o
 * casamento encontra publicam gira inteira, e gira inteira passa da hora.
 *
 * Devolve `null` para nulo e para zero: "0:00" não é informação, é ruído numa
 * coluna que existe para ser lida de relance.
 */
function duracao(segundos?: number | null): string | null {
  if (!segundos || segundos < 0) return null;
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = segundos % 60;
  const dois = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${dois(m)}:${dois(s)}` : `${m}:${dois(s)}`;
}

export function LinhaPonto({
  ponto,
  indice,
  busca = "",
  onAdicionar,
  onSugerirAutor,
}: {
  ponto: Ponto;
  indice: number;
  busca?: string;
  onAdicionar?: (p: Ponto) => void;
  onSugerirAutor?: (p: Ponto) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const { toggleFavorito } = useApp();

  const incerto = ponto.videoStatus === "revisar";
  const tempo = duracao(ponto.videoDuracaoSeg);

  return (
    <div className="group rounded-lg transition hover:bg-accent/40">
      <div className="flex items-center gap-3 px-2 py-2 sm:px-3">
        <span className="w-6 shrink-0 text-right text-sm tabular-nums text-muted-foreground">
          {indice}
        </span>

        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          className="min-w-0 flex-1 text-left"
          aria-expanded={aberto}
        >
          <span className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
            {ponto.emAprovacao && (
              // Sem a marca, quem enviou acha que já está no acervo de todos e
              // estranha quando ninguém mais encontra.
              <Clock className="h-3.5 w-3.5 shrink-0 text-amber-400" aria-label="Em aprovação" />
            )}
            <span className="truncate">{destacar(ponto.titulo, busca)}</span>
            {eNovo(ponto.aprovadoEm) && (
              // Fica DENTRO do orixá, junto do ponto — a lista "Novos do mês"
              // sozinha não resolve: quem procura ponto de Ogum está em Ogum, e
              // é ali que precisa notar que apareceu coisa nova.
              <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                novo
              </span>
            )}
          </span>
          {/* Só quando há o que dizer. Um "—" em 520 linhas é ruído em toda
              a lista, e sugere lacuna a preencher onde não há: no plano
              grátis o canal simplesmente não vem, e a maior parte do acervo
              não tem autoria conhecida. */}
          {(ponto.autor || ponto.videoCanal?.trim() || ponto.artistaNome
            || ponto.enviadoPor) && (
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">
              {/* Sem link AQUI: a linha inteira é um `<button>`, e âncora
                  dentro de botão é HTML inválido — o clique some. O link
                  para o artista vive no card expandido. */}
              {ponto.autor || ponto.videoCanal?.trim() || ponto.artistaNome}
              {/* Quem mandou vem DEPOIS do autor e mais apagado, porque são
                  coisas diferentes: autor é quem compôs o ponto, e este é quem
                  o trouxe para cá. Trocar um pelo outro atribuiria obra
                  religiosa a quem não a fez. */}
              {ponto.enviadoPor && (
                <span className="text-muted-foreground/70">
                  {(ponto.autor || ponto.videoCanal?.trim() || ponto.artistaNome)
                    ? " · "
                    : ""}
                  enviado por {ponto.enviadoPor}
                </span>
              )}
            </span>
          )}
        </button>

        {tempo && (
          <span className="hidden w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground sm:block">
            {tempo}
          </span>
        )}

        {/* Favoritar, adicionar à gira e sugerir autor ficavam INVISÍVEIS no
            celular.
            
            Eram `opacity-0` revelados por `group-hover`, e em tela de toque não
            existe hover — os três sumiam. Pior que sumir: o botão continuava
            ocupando espaço e respondendo ao toque, então dava para acertar um
            que não se vê.
            
            `[@media(hover:hover)]:opacity-0` esconde só onde há mouse. No
            celular, que é onde este app é usado de verdade, eles aparecem. */}
        <div className="flex shrink-0 items-center gap-1">
          {onAdicionar && (
            <button
              type="button"
              onClick={() => onAdicionar(ponto)}
              title="Adicionar a um repertório"
              aria-label={`Adicionar ${ponto.titulo} a um repertório`}
              className="rounded-md p-2 text-muted-foreground [@media(hover:hover)]:opacity-0 transition hover:bg-accent hover:text-foreground focus:opacity-100 group-hover:opacity-100"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}

          {onSugerirAutor && !ponto.emAprovacao && (
            <button
              type="button"
              onClick={() => onSugerirAutor(ponto)}
              title={ponto.autor ? "Corrigir o autor" : "Sugerir o autor"}
              aria-label={`Sugerir o autor de ${ponto.titulo}`}
              className="rounded-md p-2 text-muted-foreground [@media(hover:hover)]:opacity-0 transition hover:bg-accent hover:text-foreground focus:opacity-100 group-hover:opacity-100"
            >
              <UserPen className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => toggleFavorito(ponto.id)}
            title={ponto.favorito ? "Desfavoritar" : "Favoritar"}
            aria-label={ponto.favorito ? "Desfavoritar" : "Favoritar"}
            className={`rounded-md p-2 transition hover:bg-accent ${
              ponto.favorito
                ? "text-amber-400"
                : "text-muted-foreground [@media(hover:hover)]:opacity-0 focus:opacity-100 group-hover:opacity-100"
            }`}
          >
            <Star className={`h-4 w-4 ${ponto.favorito ? "fill-current" : ""}`} />
          </button>

          {ponto.videoUrl ? (
            <a
              href={ponto.videoUrl}
              onClick={() => registrarCliqueNoPonto(ponto.id, "acervo")}
              target="_blank"
              rel="noopener noreferrer"
              title={incerto ? "Vídeo provável — confira antes de usar" : "Ouvir no YouTube"}
              aria-label={`Ouvir ${ponto.titulo} no YouTube`}
              className={`rounded-md p-2 transition ${
                incerto
                  ? "text-amber-400 hover:bg-amber-400/15"
                  : "text-red-400 hover:bg-red-500/15"
              }`}
            >
              {incerto ? <AlertTriangle className="h-4 w-4" /> : <Youtube className="h-4 w-4" />}
            </a>
          ) : (
            // Sem vídeo é uma informação, não um vazio.
            //
            // Antes isto era um espaço em branco, só para as linhas não
            // desalinharem — e "não tem gravação" ficava indistinguível de "o
            // ícone não carregou". Quem procura um ponto para ensaiar quer ver
            // de longe onde tem áudio.
            //
            // NÃO é o triângulo: aquele já significa "achei um vídeo, mas posso
            // ter errado", e são 157 pontos assim. Dois sentidos no mesmo
            // desenho tornariam os dois inúteis.
            <span
              title="Sem vídeo ainda"
              aria-label={`${ponto.titulo}: sem vídeo ainda`}
              className="block rounded-md p-2 text-muted-foreground/35"
            >
              <VideoOff className="h-4 w-4" />
            </span>
          )}

          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            // O MESMO `aria-expanded` do botão do título.
            //
            // São dois controles para a mesma abertura, e só um contava o
            // estado: quem usa leitor de tela apertava a seta e não ouvia
            // nada mudar. Pior que silêncio — a seta é o afordance, é por ela
            // que a pessoa tenta primeiro.
            aria-expanded={aberto}
            aria-label={aberto ? "Fechar letra" : "Abrir letra"}
            className="rounded-md p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${aberto ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {aberto && (
        <div className="px-3 pb-3 pl-11">
          {ponto.letra?.trim() ? (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
              {destacar(ponto.letra, busca)}
            </pre>
          ) : (
            /* 47 dos 520 pontos do acervo chegaram sem letra, e a linha abria
               num vazio — indistinguível de erro de carregamento ou de app
               quebrado. Dizer que falta é honesto e transforma o buraco em
               convite: quem sabe a letra pode mandar. */
            <p className="text-sm italic text-muted-foreground">
              A letra deste ponto ainda não está no acervo.{" "}
              <Link
                href="/enviar-ponto"
                className="not-italic underline underline-offset-2 hover:text-foreground"
              >
                Você sabe? Mande para a gente.
              </Link>
            </p>
          )}
          {/* O link para quem gravou mora AQUI, e não na linha fechada: lá o
              nome vive dentro de um `<button>`, e âncora dentro de botão é
              HTML inválido — o clique some. Aberto, a letra já está fora do
              botão, e o link funciona. */}
          <CreditoDoArtista ponto={ponto} className="mt-2" />
          {incerto && (
            <p className="mt-2 text-[11px] leading-snug text-amber-400/80">
              Achamos este vídeo pela letra, mas a correspondência ficou fraca
              {typeof ponto.videoConfianca === "number" &&
                ` (${Math.round(ponto.videoConfianca * 100)}%)`}
              . Pode não ser este ponto.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
