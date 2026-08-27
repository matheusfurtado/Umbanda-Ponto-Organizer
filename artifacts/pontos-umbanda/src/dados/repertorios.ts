/**
 * Onde os repertórios moram no aparelho.
 *
 * **O caso que manda no desenho é a gira sem sinal.** A pessoa monta o
 * repertório em casa, com internet, e lê no terreiro — onde muitas vezes não há
 * rede. Uma tela que busca do servidor a cada visita fica vazia justamente na
 * hora de cantar, e offline é o que o plano promete.
 *
 * Escopo, e por quê:
 *
 * - **Ler funciona sempre.** Cache primeiro, servidor por cima.
 * - **Reordenar, incluir e tirar funcionam offline.** São as operações que
 *   acontecem NA gira ("vamos pular esse"). O envio é a sequência final do
 *   repertório — `PUT /itens` já substitui tudo e é idempotente, então guardar
 *   o último estado e reenviar quando a rede voltar é seguro.
 * - **Criar, renomear e apagar exigem conexão.** Um repertório novo precisa de
 *   id do servidor, e inventar id local traria reconciliação para resolver um
 *   caso raro: ninguém batiza uma gira nova no meio dela.
 */

import { ehErroDeApi, ehErroDeRede } from "../api/cliente";
import { definirItens, listar, type Repertorio , type ItemEnviado} from "../api/repertorio";

const CHAVE = "pontos-umbanda-repertorios";
/**
 * A fila também vai para o disco.
 *
 * Sem isto, ela vivia só em memória — e o caminho que perde dado é justamente o
 * desta feature: a pessoa reordena a gira sem sinal, fecha o app, reabre com
 * internet, e a resposta do servidor sobrescreve o cache com a ordem antiga. A
 * mudança dela some sem aviso.
 */
const CHAVE_FILA = "pontos-umbanda-repertorios-fila";
const ESPERA_ENVIO_MS = 1500;

export type FonteRepertorios = "servidor" | "cache" | "vazio";

export interface CargaRepertorios {
  repertorios: Repertorio[];
  fonte: FonteRepertorios;
  motivo?: string;
}

export interface EstadoSincronia {
  enviando: boolean;
  /** Quantos repertórios têm mudança local que o servidor ainda não recebeu. */
  pendentes: number;
  ultimoErro?: string;
  /**
   * Os ids das giras que o servidor recusou porque mudaram em outro aparelho.
   *
   * Estado próprio, e não só uma mensagem de erro, porque exige DECISÃO da
   * pessoa: nem descartar o que ela montou aqui, nem apagar o que ela montou
   * lá. Enquanto o id estiver nesta lista, o envio automático NÃO insiste.
   */
  conflitos: string[];
}

function descrever(erro: unknown): string {
  if (ehErroDeRede(erro)) return "sem conexão com o servidor";
  if (ehErroDeApi(erro)) {
    if (erro.status === 402) return "seu plano não inclui repertórios";
    return `servidor respondeu ${erro.status}`;
  }
  return "falha desconhecida";
}

function lerCache(): Repertorio[] | null {
  try {
    const cru = localStorage.getItem(CHAVE);
    return cru ? (JSON.parse(cru) as Repertorio[]) : null;
  } catch {
    // Cache corrompido não pode derrubar a tela: trata como ausente.
    return null;
  }
}

function gravarCache(reps: Repertorio[]): void {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(reps));
  } catch {
    // Cota cheia. A tela continua funcionando com o que está em memória;
    // só a próxima abertura offline é que perde.
  }
}

/**
 * O que ainda não subiu VENCE o que o servidor devolveu.
 *
 * O servidor não conhece a mudança feita offline. Aceitar a resposta dele como
 * verdade apagaria a gira que a pessoa montou sem sinal — que é exatamente o
 * dado que esta camada existe para proteger.
 */
function aplicarPendentes(doServidor: Repertorio[]): Repertorio[] {
  if (fila.size === 0) return doServidor;
  return doServidor.map((r) => {
    const pendente = fila.get(r.id);
    if (!pendente) return r;
    return {
      ...r,
      itens: pendente.itens.map(({ pontoId, secao }, ordem) => {
        // Título, canal e duração vêm do que o servidor já mandou: a fila
        // guarda só o que a pessoa DECIDIU (quais pontos, em que ordem, em
        // que parte da gira). Duplicar o resto na fila seria guardar duas
        // vezes um dado que só o servidor conhece.
        const antes = r.itens.find((i) => i.pontoId === pontoId);
        return {
          pontoId,
          ordem,
          secao: secao ?? null,
          titulo: antes?.titulo ?? null,
          autor: antes?.autor ?? null,
          videoUrl: antes?.videoUrl ?? null,
          videoStatus: antes?.videoStatus ?? null,
          videoCanal: antes?.videoCanal ?? null,
          videoDuracaoSeg: antes?.videoDuracaoSeg ?? null,
        };
      }),
    };
  });
}

export async function carregar(): Promise<CargaRepertorios> {
  const cache = lerCache();
  try {
    const doServidor = aplicarPendentes(await listar());
    gravarCache(doServidor);
    // Se havia pendência, tenta subir agora que se sabe que a rede responde.
    if (fila.size > 0) agendar();
    return { repertorios: doServidor, fonte: "servidor" };
  } catch (erro) {
    if (cache) return { repertorios: cache, fonte: "cache", motivo: descrever(erro) };
    return { repertorios: [], fonte: "vazio", motivo: descrever(erro) };
  }
}

// ------------------------------------------------------------------- envio

type Ouvinte = (estado: EstadoSincronia) => void;

/** repertorio_id -> o que ficou por enviar de uma gira: a sequência E a versão que foi vista. */
interface Pendente {
  itens: ItemEnviado[];
  /** `null` = fila de uma versão do app que não guardava versão. */
  versao: string | null;
}

const fila = new Map<string, Pendente>(lerFila());

/**
 * A fila do disco, NORMALIZADA.
 *
 * Antes das seções, cada entrada era uma lista de ids (`string[]`). Uma gira
 * montada offline naquela versão ainda pode estar guardada aqui, esperando
 * conexão. Ler aquilo como o formato novo produziria itens sem `pontoId` e o
 * envio subiria vazio — perdendo, em silêncio, a gira que a pessoa montou.
 *
 * Por isso a conversão é feita na leitura, e não em algum lugar depois.
 */
function lerFila(): [string, Pendente][] {
  try {
    const cru = localStorage.getItem(CHAVE_FILA);
    if (!cru) return [];
    const bruto = JSON.parse(cru) as [string, unknown][];
    return bruto.map(([id, valor]) => {
      // TRÊS formatos já existiram, e todos podem estar guardados agora num
      // aparelho que ficou offline: lista de ids, lista de itens, e o objeto
      // com versão. Ler qualquer um deles errado sobe uma gira vazia — perdendo
      // em silêncio o que a pessoa montou.
      if (Array.isArray(valor)) {
        const itens = (valor as (string | ItemEnviado)[]).map((i) =>
          typeof i === "string" ? { pontoId: i, secao: null } : i,
        );
        return [id, { itens, versao: null }];
      }
      const obj = valor as Pendente;
      return [id, { itens: obj?.itens ?? [], versao: obj?.versao ?? null }];
    });
  } catch {
    return [];
  }
}

function gravarFila(): void {
  try {
    if (fila.size === 0) localStorage.removeItem(CHAVE_FILA);
    else localStorage.setItem(CHAVE_FILA, JSON.stringify([...fila.entries()]));
  } catch {
    /* cota cheia */
  }
}
const ouvintes = new Set<Ouvinte>();
let relogio: ReturnType<typeof setTimeout> | null = null;
let enviando = false;
/** Giras que o servidor recusou por terem mudado em outro aparelho. */
const conflitos = new Set<string>();

let estado: EstadoSincronia = {
  enviando: false,
  pendentes: fila.size,
  conflitos: [],
};

function anunciar(novo: Partial<EstadoSincronia>) {
  estado = {
    ...estado,
    ...novo,
    // Derivados da fonte, e não do que o chamador lembrou de passar: um
    // `anunciar({})` esquecido deixaria a faixa de conflito na tela depois de
    // resolvido, ou escondida com ele aberto.
    pendentes: fila.size,
    conflitos: [...conflitos],
  };
  ouvintes.forEach((o) => o(estado));
}

export function observarSincronia(ouvinte: Ouvinte): () => void {
  ouvintes.add(ouvinte);
  ouvinte(estado);
  return () => ouvintes.delete(ouvinte);
}

async function empurrar() {
  if (enviando || fila.size === 0) return;
  enviando = true;
  anunciar({ enviando: true });

  // Copia as entradas antes: a fila pode receber mudanças novas enquanto o
  // envio corre, e essas precisam ficar para a próxima rodada.
  const rodada = [...fila.entries()];
  let falhou: string | undefined;

  for (const [id, pendente] of rodada) {
    // Gira já em conflito não vai de novo: reenviar em laço é exatamente o que
    // apagaria o que o outro aparelho gravou.
    if (conflitos.has(id)) continue;
    try {
      const atualizado = await definirItens(id, pendente.itens, pendente.versao);
      // Só remove se o que está na fila ainda for o que acabou de subir. Se a
      // pessoa mexeu de novo durante o envio, a entrada nova permanece.
      if (fila.get(id) === pendente) {
        fila.delete(id);
      } else {
        // Mexeu durante o envio: a entrada que ficou foi montada sobre a
        // versão ANTIGA, que este envio acabou de invalidar. Sem corrigir a
        // versão dela aqui, a rodada seguinte levaria 409 contra o próprio
        // aparelho — "mudou em outro lugar" sem nada ter mudado.
        const agora = fila.get(id);
        if (agora) fila.set(id, { ...agora, versao: atualizado.versao ?? null });
      }
      gravarFila();
      const cache = lerCache();
      if (cache) gravarCache(cache.map((r) => (r.id === atualizado.id ? atualizado : r)));
    } catch (erro) {
      falhou = descrever(erro);
      if (ehErroDeApi(erro) && erro.status === 404) {
        // Repertório apagado em outro aparelho. Insistir para sempre não
        // ressuscita nada; some da fila.
        fila.delete(id);
        gravarFila();
      }
      if (ehErroDeApi(erro) && erro.status === 409) {
        // Mudou em outro aparelho. A entrada FICA na fila — é a única cópia do
        // que a pessoa montou aqui — mas marcada, para nenhuma rodada futura
        // subir por cima sozinha. Quem decide é ela, na tela.
        conflitos.add(id);
        falhou = undefined;
      }
    }
  }

  enviando = false;
  anunciar({ enviando: false, ultimoErro: falhou });
  // Só reagenda se sobrou algo que NÃO está em conflito. Contar as em conflito
  // aqui faria o relógio bater para sempre num envio que a rodada pula.
  const pendura = [...fila.keys()].some((id) => !conflitos.has(id));
  if (pendura && !falhou) agendar();
}

function agendar() {
  if (relogio) clearTimeout(relogio);
  relogio = setTimeout(empurrar, ESPERA_ENVIO_MS);
}

/**
 * "Mandar a minha assim mesmo": relê a gira do servidor só para pegar a versão
 * atual e sobe a sequência deste aparelho por cima dela.
 *
 * É decisão consciente da pessoa, com o outro lado já mostrado a ela na tela —
 * nunca um reenvio automático.
 */
export async function forcarEnvio(repertorioId: string): Promise<void> {
  const pendente = fila.get(repertorioId);
  if (!pendente) return;
  const doServidor = (await listar()).find((r) => r.id === repertorioId);
  if (!doServidor) {
    // Apagada no servidor enquanto o conflito estava aberto. Não há versão
    // contra a qual forçar, e recriar a gira por baixo não é o que o botão
    // prometeu.
    fila.delete(repertorioId);
    gravarFila();
    conflitos.delete(repertorioId);
    anunciar({ ultimoErro: "essa gira foi apagada em outro aparelho" });
    return;
  }
  fila.set(repertorioId, { ...pendente, versao: doServidor.versao ?? null });
  gravarFila();
  conflitos.delete(repertorioId);
  anunciar({ ultimoErro: undefined });
  await empurrar();
}

/**
 * "Ficar com a do servidor": descarta o que ficou pendente desta gira.
 *
 * Some com a entrada da fila E com o cache dela, porque `aplicarPendentes`
 * faria a sequência descartada continuar aparecendo na tela — a pessoa teria
 * clicado em descartar e visto o descartado.
 */
export async function descartarPendente(repertorioId: string): Promise<void> {
  // Busca ANTES de descartar. Ao contrário, uma rede que cai no meio deixa a
  // pessoa sem as duas: o que ela montou aqui já foi jogado fora, e o do
  // servidor não chegou para pôr no lugar. Nesta ordem, a falha não custa
  // nada — o pendente continua onde estava e ela tenta de novo.
  const doServidor = (await listar()).find((r) => r.id === repertorioId);
  fila.delete(repertorioId);
  gravarFila();
  conflitos.delete(repertorioId);
  const cache = lerCache();
  if (cache) {
    gravarCache(
      doServidor
        ? cache.map((r) => (r.id === repertorioId ? doServidor : r))
        : cache.filter((r) => r.id !== repertorioId),
    );
  }
  anunciar({ ultimoErro: undefined });
}

/**
 * Grava a sequência nova. O cache é atualizado de forma SÍNCRONA — é isso que
 * mantém a tela certa mesmo sem rede — e o servidor recebe depois.
 */
export function definirSequencia(
  repertorioId: string,
  itensNovos: ItemEnviado[],
): Repertorio[] {
  const cache = lerCache() ?? [];
  const atualizado = cache.map((r) =>
    r.id === repertorioId
      ? {
          ...r,
          itens: itensNovos.map(({ pontoId, secao }, ordem) => {
            const antes = r.itens.find((i) => i.pontoId === pontoId);
            return {
              pontoId,
              ordem,
              secao: secao ?? null,
              titulo: antes?.titulo ?? null,
              autor: antes?.autor ?? null,
              videoUrl: antes?.videoUrl ?? null,
              videoStatus: antes?.videoStatus ?? null,
              videoCanal: antes?.videoCanal ?? null,
              videoDuracaoSeg: antes?.videoDuracaoSeg ?? null,
            };
          }),
        }
      : r,
  );
  gravarCache(atualizado);
  // A versão que vai junto é a que ESTE aparelho viu por último, nunca uma
  // inventada agora: é ela que deixa o servidor perceber que a gira mudou em
  // outro lugar no meio do caminho. Se já havia pendente, a base continua sendo
  // a versão dele — as edições novas se somam às que ainda não subiram.
  const anterior = fila.get(repertorioId);
  const versaoBase = anterior
    ? anterior.versao
    : (cache.find((r) => r.id === repertorioId)?.versao ?? null);
  fila.set(repertorioId, { itens: itensNovos, versao: versaoBase });
  gravarFila();
  anunciar({});
  agendar();
  return atualizado;
}

/** Guarda o que veio do servidor (criar/renomear/apagar passam por aqui). */
export function guardar(reps: Repertorio[]): void {
  gravarCache(reps);
}

export function sincronizarAgora(): void {
  if (relogio) clearTimeout(relogio);
  void empurrar();
}

export function ligarRetomadaAutomatica(): () => void {
  const aoVoltar = () => {
    if (fila.size > 0) sincronizarAgora();
  };
  window.addEventListener("online", aoVoltar);
  return () => window.removeEventListener("online", aoVoltar);
}
