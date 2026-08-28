import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useRoute } from "wouter";
import {
  Camera, Check, Eye, EyeOff, ListMusic, Loader2, Star, Trash2, UserPen, UserPlus,
} from "lucide-react";
import { Avatar } from "@/componentes/Avatar";
import { Compartilhar } from "@/componentes/Compartilhar";
import { Denunciar } from "@/componentes/Denunciar";
import { TrocarApelido } from "@/componentes/TrocarApelido";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthContext";
import {
  definirFavoritosPublicos,
  deixarDeSeguir,
  enviarFoto,
  seguir,
  tirarFoto,
  verPerfil,
  type Perfil,
} from "@/api/perfil";

/**
 * A foto do perfil, do lado de quem é dono dela.
 *
 * O botão fica SOBRE a imagem, e não numa tela de configuração escondida: a
 * pessoa está olhando o próprio perfil quando pensa "quero trocar isso".
 *
 * A recusa do servidor vem pronta para ler — "essa imagem é grande demais",
 * "use JPEG, PNG ou WebP" — então é ela que aparece, sem tradução no meio.
 */
function TrocarFoto({
  perfil,
  aoTrocar,
}: {
  perfil: Perfil;
  aoTrocar: () => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function escolher(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    // Limpa o input mesmo se a pessoa desistir: sem isto, escolher o MESMO
    // arquivo de novo não dispara evento nenhum e parece que travou.
    evento.target.value = "";
    if (!arquivo) return;
    setEnviando(true);
    setErro(null);
    try {
      await enviarFoto(arquivo);
      aoTrocar();
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : "Não consegui enviar a imagem.");
    } finally {
      setEnviando(false);
    }
  }

  async function remover() {
    setEnviando(true);
    setErro(null);
    try {
      await tirarFoto();
      aoTrocar();
    } catch (problema) {
      setErro(problema instanceof Error ? problema.message : "Não consegui tirar a foto.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-fit">
        <Avatar apelido={perfil.apelido} foto={perfil.foto} tamanho="lg" />
        <label
          className="absolute bottom-1 right-1 inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border border-border bg-background/90 shadow-sm"
          title={perfil.foto ? "Trocar a foto" : "Pôr uma foto"}
        >
          {enviando ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
          ) : (
            <Camera className="h-5 w-5" aria-hidden />
          )}
          <span className="sr-only">
            {perfil.foto ? "Trocar a foto do perfil" : "Pôr uma foto no perfil"}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={enviando}
            onChange={(e) => void escolher(e)}
          />
        </label>
      </div>
      {perfil.foto && !enviando && (
        <button
          type="button"
          onClick={() => void remover()}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline underline-offset-2"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Tirar a foto
        </button>
      )}
      {erro && (
        <p role="alert" className="max-w-40 text-xs leading-snug text-destructive">
          {erro}
        </p>
      )}
    </div>
  );
}

/**
 * O perfil de alguém — o formato do Spotify, com o peso deste domínio.
 *
 * Cabeçalho grande com a marca, o nome e as contagens; abaixo, o que a pessoa
 * escolheu mostrar: as giras públicas e, se ela abriu, os favoritos.
 *
 * **O que não está aqui é a parte importante.** Não há lista de seguidores nem
 * de quem a pessoa segue — só o número. Num app de Umbanda, essa lista é um
 * mapa da rede religiosa de alguém, e o servidor nem devolve os nomes.
 *
 * Abre sem conta, de propósito: é por um link de perfil que o app circula no
 * grupo do terreiro, e pedir cadastro para ver mata o canal que não custa nada.
 */
export function TelaPerfil() {
  const [, params] = useRoute("/perfil/:apelido");
  const apelido = params?.apelido ? decodeURIComponent(params.apelido) : "";
  const { autenticado } = useAuth();
  const [, navegar] = useLocation();
  const [trocando, setTrocando] = useState(false);

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const carregar = useCallback(() => {
    if (!apelido) return;
    setErro(null);
    verPerfil(apelido)
      .then(setPerfil)
      .catch((e) => setErro(e instanceof Error ? e.message : "Não achei esse perfil."));
  }, [apelido]);

  useEffect(carregar, [carregar]);

  const alternarSeguir = async () => {
    if (!perfil || ocupado) return;
    setOcupado(true);
    // Otimista: o botão responde na hora e o número acompanha. Se falhar, o
    // `carregar()` do fim devolve a verdade do servidor.
    const seguindoAgora = perfil.euSigo;
    setPerfil({
      ...perfil,
      euSigo: !seguindoAgora,
      seguidores: perfil.seguidores + (seguindoAgora ? -1 : 1),
    });
    try {
      await (seguindoAgora ? deixarDeSeguir(perfil.apelido) : seguir(perfil.apelido));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui.");
    } finally {
      setOcupado(false);
      carregar();
    }
  };

  const alternarFavoritos = async () => {
    if (!perfil || ocupado) return;
    setOcupado(true);
    try {
      await definirFavoritosPublicos(perfil.favoritos === null);
      carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui.");
    } finally {
      setOcupado(false);
    }
  };

  if (erro && !perfil) {
    return (
      <div className="max-w-3xl px-4 pb-24 pt-16 text-center sm:px-8">
        <p className="text-sm text-muted-foreground">{erro}</p>
        <Link href="/giras-publicas" className="mt-4 inline-block text-sm text-primary underline">
          Ver as giras da comunidade
        </Link>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div aria-busy="true" className="max-w-4xl px-4 pb-24 pt-8 sm:px-8">
        <div className="flex items-end gap-5">
          <div className="h-32 w-32 animate-pulse rounded-full bg-muted/50 sm:h-40 sm:w-40" />
          <div className="flex-1 space-y-3 pb-2">
            <div className="h-10 w-2/3 animate-pulse rounded bg-muted/50" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted/40" />
          </div>
        </div>
      </div>
    );
  }

  const n = (q: number, um: string, muitos: string) =>
    `${q} ${q === 1 ? um : muitos}`;

  return (
    <div className="min-h-full">
      <div className="bg-gradient-to-b from-primary/15 to-transparent px-4 pb-8 pt-8 sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
          {perfil.souEu ? (
            <TrocarFoto perfil={perfil} aoTrocar={carregar} />
          ) : (
            <Avatar apelido={perfil.apelido} foto={perfil.foto} tamanho="lg" />
          )}
          <div className="min-w-0 pb-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Perfil
            </p>
            <h1 className="mt-1 break-words text-4xl font-black leading-tight text-foreground sm:text-5xl">
              {perfil.apelido}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {n(perfil.giras.length, "gira pública", "giras públicas")}
              {" · "}
              {n(perfil.seguidores, "seguidor", "seguidores")}
              {" · "}
              seguindo {perfil.seguindo}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {perfil.souEu ? (
                <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTrocando(true)}
                  className="gap-1.5"
                >
                  <UserPen className="h-4 w-4" /> Editar perfil
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={alternarFavoritos}
                  disabled={ocupado}
                  className="gap-1.5"
                >
                  {ocupado ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : perfil.favoritos === null ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                  {perfil.favoritos === null ? "Mostrar meus favoritos" : "Esconder meus favoritos"}
                </Button>
                </>
              ) : autenticado ? (
                <Button
                  size="sm"
                  variant={perfil.euSigo ? "outline" : "default"}
                  onClick={alternarSeguir}
                  disabled={ocupado}
                  className="gap-1.5"
                >
                  {perfil.euSigo ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {perfil.euSigo ? "Seguindo" : "Seguir"}
                </Button>
              ) : (
                <Link href="/login">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <UserPlus className="h-4 w-4" /> Entrar para seguir
                  </Button>
                </Link>
              )}
              {/* Aparece para os dois lados: para o dono, é como o perfil dele
                  circula; para quem visita, é como ele mostra a alguém a gira
                  de quem admira. É o mecanismo de descoberta que este app tem
                  de verdade (ADR 0006). */}
              <Compartilhar
                titulo={`${perfil.apelido} — Pontos de Umbanda`}
                caminho={`/perfil/${encodeURIComponent(perfil.apelido)}`}
                rotulo={perfil.souEu ? "Compartilhar meu perfil" : "Compartilhar"}
              />
            </div>
            {/* Discreto, longe do "seguir", e só para quem NÃO é dono: um
                botão de denúncia em destaque convida denúncia por desavença, e
                num app onde as pessoas se conhecem do terreiro a desavença é o
                motivo mais provável. Exige conta — denúncia anônima não tem
                como ser contida. */}
            {!perfil.souEu && autenticado && (
              <div className="mt-3">
                <Denunciar alvoTipo="perfil" alvoId={perfil.apelido} oQueE="este perfil" />
              </div>
            )}
            {perfil.souEu && (
              // O aviso fica colado no botão, e não numa tela de ajuda: é aqui
              // que a decisão é tomada. Ver o que se revela DEPOIS de revelar
              // não serve para nada.
              <p className="mt-2 max-w-md text-xs text-muted-foreground">
                {perfil.favoritos === null
                  ? "Seus favoritos estão fechados. Abrir mostra a qualquer pessoa quais pontos você mais canta — o que diz muito sobre a sua linha e a sua casa."
                  : "Seus favoritos estão abertos: qualquer pessoa com o link vê esta lista."}
              </p>
            )}
            {erro && <p role="alert" className="mt-2 text-xs text-destructive">{erro}</p>}
          </div>
        </div>
      </div>

      <div className="max-w-4xl px-4 pb-24 sm:px-8">
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
            <ListMusic className="h-4 w-4 text-primary" aria-hidden /> Giras públicas
          </h2>
          {perfil.giras.length === 0 ? (
            <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
              {perfil.souEu
                ? "Você ainda não publicou nenhuma gira. Em Minhas giras dá para tornar uma pública."
                : "Nenhuma gira pública ainda."}
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {perfil.giras.map((g) => (
                <Link
                  key={g.id}
                  href={`/gira/${g.id}`}
                  className="rounded-xl border bg-card/40 p-3 transition hover:border-primary/40"
                >
                  <p className="truncate font-semibold text-foreground">{g.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {n(g.pontos, "ponto", "pontos")}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Trocar o apelido MOVE esta página: a URL é o apelido. Sem navegar,
            a tela ficaria apontando para um nome que não existe mais e daria
            404 no primeiro recarregamento — logo depois de a pessoa mexer nas
            próprias configurações, que é o pior momento para o app parecer
            quebrado. */}
        <TrocarApelido
          aberto={trocando}
          onFechar={(novo) => {
            setTrocando(false);
            if (novo && novo.toLowerCase() !== perfil.apelido.toLowerCase()) {
              navegar(`/perfil/${encodeURIComponent(novo)}`);
            } else if (novo) {
              carregar();
            }
          }}
        />

        {perfil.favoritos !== null && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
              Favoritos
            </h2>
            {perfil.favoritos.length === 0 ? (
              <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
                Nenhum ponto favoritado ainda.
              </p>
            ) : (
              <ol className="divide-y divide-border/60 rounded-xl border">
                {perfil.favoritos.map((f, i) => (
                  <li key={f.id} className="flex items-baseline gap-3 px-3 py-2.5">
                    <span className="w-6 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-foreground">{f.titulo}</span>
                      {f.orixa && (
                        <span className="block truncate text-xs text-muted-foreground">
                          {f.orixa}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
