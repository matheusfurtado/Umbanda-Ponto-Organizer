import { useEffect, useMemo, useState } from "react";
import { Check, ListMusic, Loader2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listar, criar, definirItens, type Repertorio } from "@/api/repertorio";
import { ehErroDeApi, ehErroDeRede } from "@/api/cliente";
import type { Ponto } from "@/types";

/**
 * Levar um ponto para uma gira, de onde a pessoa o encontrou.
 *
 * Antes, montar a gira exigia ir até a tela de repertórios e procurar o ponto
 * de novo — buscar duas vezes a mesma coisa. Quem está lendo a letra e decide
 * "esse entra na chegada de sexta" quer resolver ali.
 *
 * ## Por que a seção é um campo livre com sugestões
 *
 * As partes da gira variam de casa para casa. Uma lista fixa imporia o
 * vocabulário de um terreiro a todos os outros — num app religioso isso não é
 * detalhe de interface. As sugestões vêm das seções que a PRÓPRIA gira já usa,
 * então quem repete um nome não o digita de novo, e quem tem outro nome não é
 * corrigido.
 *
 * ## O `PUT` manda a VERSÃO, e este é o segundo caminho de escrita
 *
 * `PUT /repertorios/{id}/itens` substitui a sequência inteira, e o servidor só
 * recusa gravação cega quando o cliente manda `versao`. Este diálogo mandava
 * sem — e a `dados/repertorios.ts`, que é o outro caminho para a MESMA
 * escrita, manda. Duas implementações da mesma regra, e só uma com a proteção:
 * exatamente o que o `useAcoesDePonto` diz, no docstring dele, que este
 * projeto já pagou para aprender.
 *
 * O dano é o que o servidor descreve em `routers/repertorio.py`: a pessoa
 * monta a gira no computador, abre este diálogo no celular (que carregou a
 * lista antes), aperta Adicionar — e o servidor grava a sequência ANTIGA mais
 * um. **O que ela montou no computador some, sem erro e sem aviso.**
 *
 * Com a versão, o servidor devolve 409, e aqui a gira é recarregada e a pessoa
 * fica sabendo. O conserto do 409 NÃO é reenviar sem a versão — isso é a
 * gravação cega de novo, com um passo a mais.
 */
export function AdicionarAGira({
  ponto,
  onFechar,
}: {
  ponto: Ponto | null;
  onFechar: () => void;
}) {
  const [giras, setGiras] = useState<Repertorio[] | null>(null);
  const [escolhida, setEscolhida] = useState<string | null>(null);
  const [secao, setSecao] = useState("");
  const [nomeNova, setNomeNova] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    if (!ponto) return;
    setEscolhida(null);
    setSecao("");
    setErro(null);
    setPronto(false);
    // `nomeNova` também, e ele estava ficando.
    //
    // Quem abria sem gira nenhuma, digitava um nome, desistia e abria de novo
    // noutro ponto encontrava o campo preenchido — com o botão HABILITADO,
    // porque `nomeNova.trim()` sozinho o habilita. Um toque e nascia uma gira
    // com o nome abandonado. Pior com giras já existentes: nenhuma escolhida,
    // o botão aceso pelo texto velho, e "Adicionar" criava uma gira nova em
    // vez de pôr o ponto na que a pessoa achava ter selecionado.
    setNomeNova("");
    listar()
      .then((l) => {
        setGiras(l);
        // Uma gira só: já vem escolhida. Fazer a pessoa clicar na única opção
        // é pedir confirmação de uma decisão que não existe.
        if (l.length === 1) setEscolhida(l[0].id);
      })
      .catch(() => setGiras([]));
  }, [ponto]);

  const secoesConhecidas = useMemo(() => {
    const g = giras?.find((x) => x.id === escolhida);
    const nomes = (g?.itens ?? []).map((i) => i.secao).filter(Boolean) as string[];
    return [...new Set(nomes)];
  }, [giras, escolhida]);

  if (!ponto) return null;

  const adicionar = async () => {
    if (!escolhida && !nomeNova.trim()) return;
    setSalvando(true);
    setErro(null);
    try {
      let gira = giras?.find((g) => g.id === escolhida);
      if (!gira) {
        gira = await criar(nomeNova.trim());
      }
      // A API substitui a sequência inteira: manda-se a atual mais o novo — e
      // a VERSÃO junto, que é o que faz o servidor recusar gravar por cima do
      // que este aparelho não viu. Ver o docstring.
      const atual = gira.itens.map((i) => ({ pontoId: i.pontoId, secao: i.secao ?? null }));
      await definirItens(
        gira.id,
        [...atual, { pontoId: ponto.id, secao: secao.trim() || null }],
        gira.versao ?? null,
      );
      setPronto(true);
      // Um instante para a pessoa VER que deu certo antes de a janela sumir.
      setTimeout(onFechar, 700);
    } catch (problema) {
      if (ehErroDeApi(problema) && problema.status === 409) {
        // Mudou noutro aparelho. Recarrega e devolve a decisão à pessoa: o
        // conserto NÃO é reenviar sem a versão, que é a gravação cega de novo.
        const frescas = await listar().catch(() => null);
        if (frescas) setGiras(frescas);
        setErro(
          "Esta gira mudou em outro aparelho. Recarreguei o que está lá — " +
            "confira e toque em Adicionar de novo. Nada foi perdido.",
        );
        return;
      }
      setErro(
        ehErroDeRede(problema)
          ? "Sem conexão. Para mexer nas giras é preciso estar online."
          : problema instanceof Error
            ? problema.message
            : "Não consegui adicionar.",
      );
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onFechar()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Adicionar à gira</DialogTitle>
        </DialogHeader>

        <p className="-mt-1 truncate text-sm text-muted-foreground">{ponto.titulo}</p>

        {giras === null ? (
          <div aria-busy="true" className="space-y-2 py-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-11 animate-pulse rounded-lg bg-muted/40" />
            ))}
          </div>
        ) : giras.length === 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Você ainda não tem giras. Dê um nome à primeira:
            </p>
            <Input
              value={nomeNova}
              onChange={(e) => setNomeNova(e.target.value)}
              placeholder="Gira de sexta, Festa de Exu..."
              aria-label="Nome da nova gira"
            />
          </div>
        ) : (
          <div className="max-h-52 space-y-1 overflow-y-auto">
            {giras.map((g) => (
              <button
                key={g.id}
                onClick={() => setEscolhida(g.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                  escolhida === g.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
              >
                <ListMusic className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{g.nome}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {g.itens.length}
                </span>
                {escolhida === g.id && <Check className="h-4 w-4 shrink-0" aria-hidden />}
              </button>
            ))}
          </div>
        )}

        {(escolhida || nomeNova.trim()) && (
          <div>
            <label htmlFor="secao-gira" className="mb-1 block text-sm text-muted-foreground">
              Parte da gira <span className="text-xs">(opcional)</span>
            </label>
            <Input
              id="secao-gira"
              value={secao}
              onChange={(e) => setSecao(e.target.value)}
              placeholder="Chegada, Louvação, Firmeza..."
              list="secoes-conhecidas"
            />
            {/* Sugestões do que ESTA gira já usa: quem repete um nome não o
                digita de novo, e quem tem outro vocabulário não é corrigido. */}
            <datalist id="secoes-conhecidas">
              {secoesConhecidas.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </div>
        )}

        {erro && (
          <p role="alert" className="text-sm text-destructive">
            {erro}
          </p>
        )}

        <Button
          onClick={adicionar}
          disabled={salvando || pronto || (!escolhida && !nomeNova.trim())}
          className="w-full"
        >
          {salvando ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adicionando...</>
          ) : pronto ? (
            <><Check className="mr-2 h-4 w-4" /> Adicionado</>
          ) : (
            <><Plus className="mr-2 h-4 w-4" /> Adicionar</>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
