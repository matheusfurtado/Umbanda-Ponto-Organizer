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
      itens: pendente.map(({ pontoId, secao }, ordem) => {
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

/** repertorio_id -> sequência final que o servidor ainda não confirmou. */
const fila = new Map<string, ItemEnviado[]>(lerFila());

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
function lerFila(): [string, ItemEnviado[]][] {
  try {
    const cru = localStorage.getItem(CHAVE_FILA);
    if (!cru) return [];
    const bruto = JSON.parse(cru) as [string, (string | ItemEnviado)[]][];
    return bruto.map(([id, itens]) => [
      id,
      itens.map((i) => (typeof i === "string" ? { pontoId: i, secao: null } : i)),
    ]);
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
let estado: EstadoSincronia = { enviando: false, pendentes: fila.size };

function anunciar(novo: Partial<EstadoSincronia>) {
  estado = { ...estado, ...novo, pendentes: fila.size };
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

  for (const [id, pontos] of rodada) {
    try {
      const atualizado = await definirItens(id, pontos);
      // Só remove se o que está na fila ainda for o que acabou de subir. Se a
      // pessoa mexeu de novo durante o envio, a entrada nova permanece.
      if (fila.get(id) === pontos) {
        fila.delete(id);
        gravarFila();
      }
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
    }
  }

  enviando = false;
  anunciar({ enviando: false, ultimoErro: falhou });
  if (fila.size > 0 && !falhou) agendar();
}

function agendar() {
  if (relogio) clearTimeout(relogio);
  relogio = setTimeout(empurrar, ESPERA_ENVIO_MS);
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
  fila.set(repertorioId, itensNovos);
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
