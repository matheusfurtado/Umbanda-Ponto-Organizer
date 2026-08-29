/**
 * Onde o acervo mora, e como ele viaja entre aparelho e servidor.
 *
 * A regra que manda em tudo aqui: **na gira o app não pode travar esperando
 * rede.** Celular na mão, luz baixa, sinal ruim ou nenhum. Por isso:
 *
 * - Leitura tenta o servidor e **cai para o cache do aparelho** se falhar.
 * - Escrita grava no cache **na hora** e empurra para o servidor depois.
 *
 * O `localStorage` deixa de ser a fonte da verdade e vira cache. A diferença
 * importa: cache pode estar velho, e a UI precisa poder dizer isso.
 *
 * **Limitação assumida (fase 1):** o envio é um snapshot inteiro, último-a-
 * escrever-vence. Com um usuário e um aparelho está certo. Quando entrar conta
 * e multi-aparelho, vira sync incremental — está registrado no ADR 0002.
 */

import { baixarAcervo, ehErroDeApi, ehErroDeRede, enviarAcervo } from "../api/cliente";
import { carregarDados, salvarDados } from "../storage";
import type { AppData, FonteAcervo } from "../types";

export interface ResultadoCarga {
  dados: AppData;
  fonte: FonteAcervo;
  /** Preenchido quando caiu para o cache: a UI mostra o porquê. */
  motivo?: string;
}

/** Espera antes de empurrar para o servidor. Arrastar um ponto dispara várias
 *  mutações seguidas; sem isto seria um PUT do acervo inteiro por quadro. */
const ESPERA_ENVIO_MS = 1500;

function descrever(erro: unknown): string {
  if (ehErroDeRede(erro)) return "sem conexão com o servidor";
  // O texto do servidor, quando existe, é melhor que qualquer um daqui: ele
  // foi escrito para a pessoa ler. O 402 do sync, por exemplo, diz "guardar
  // seus pontos na nuvem faz parte do plano pago; seu acervo continua salvo
  // neste aparelho — nada foi perdido" — e isso é exatamente o que ela precisa
  // saber. "Servidor respondeu 402" não é informação, é ruído com número.
  if (ehErroDeApi(erro)) return erro.detalhe || `servidor respondeu ${erro.status}`;
  return "falha desconhecida";
}

export async function carregar(): Promise<ResultadoCarga> {
  try {
    const doServidor = await baixarAcervo();
    // A preferência de qual orixá estava aberto é deste aparelho e não vem do
    // servidor. Preservá-la evita a tela pular ao voltar de uma sincronização.
    const local = carregarDados();

    // O que ficou por enviar VENCE o servidor.
    //
    // Antes, `carregar()` gravava o do servidor por cima sem olhar: quem
    // editasse sem sinal e reabrisse o app com rede perdia a edição em
    // silêncio — e o pendente vivia só em memória, então recarregar bastava
    // para apagá-lo. O cache era a única cópia, e o próprio carregamento a
    // destruía.
    //
    // Devolver o pendente mantém a promessa da faixa de conflito ("nada foi
    // perdido") verdadeira no caminho mais comum do app: gira sem sinal.
    const pendente = pendenteGuardado();
    if (pendente) {
      aguardando = pendente;
      anunciar({ pendente: true });
      agendar();
      const dados: AppData = { ...pendente, ultimoOrixaId: local.ultimoOrixaId };
      salvarDados(dados);
      return { dados, fonte: "cache", motivo: "há mudanças suas ainda não enviadas" };
    }

    const dados: AppData = { ...doServidor, ultimoOrixaId: local.ultimoOrixaId };
    salvarDados(dados);
    return { dados, fonte: "servidor" };
  } catch (erro) {
    const cache = carregarDados();
    // `carregarDados` semeia o acervo embutido quando não há nada gravado.
    // Distinguir "cache de uma visita anterior" de "nunca falei com servidor"
    // muda a mensagem: a segunda não é uma falha, é a primeira abertura.
    const houveVisita = localStorage.getItem("pontos-umbanda-data") !== null;
    return {
      dados: cache,
      fonte: houveVisita ? "cache" : "local",
      motivo: descrever(erro),
    };
  }
}

type Ouvinte = (estado: EstadoEnvio) => void;

export interface EstadoEnvio {
  enviando: boolean;
  /** Há mudança local que o servidor ainda não recebeu. */
  pendente: boolean;
  ultimoErro?: string;
  /**
   * O servidor recusou porque o acervo mudou em outro aparelho.
   *
   * Estado próprio, e não só uma mensagem de erro, porque exige DECISÃO: nem
   * descartar o que a pessoa fez aqui, nem apagar o que veio de lá. A tela
   * pergunta.
   */
  conflito: boolean;
  /**
   * O servidor recusou por um motivo que **insistir não resolve**: sem plano
   * (402), sem sessão (401), payload que ele não aceita (422).
   *
   * Estado próprio pelo mesmo motivo do `conflito`: sem ele, o `finally`
   * reagendava e o app entrava em laço — um `PUT` do acervo inteiro a cada
   * 1,5 s, para sempre, contra uma rota que já tinha dito não. Em celular na
   * gira isso é bateria e franquia de dados; no servidor é carga que nenhum
   * usuário pediu.
   *
   * O dado NÃO se perde: ele continua no cache e no pendente. O que para é a
   * insistência automática.
   */
  bloqueado: boolean;
}

/**
 * Quem é o dono do que está pendente.
 *
 * `aguardando` vivia só em memória, e isso custava caro de dois jeitos:
 *
 * 1. Recarregar (ou o sistema matar o PWA em segundo plano) apagava o pendente,
 *    e o `carregar()` seguinte sobrescrevia o cache com o do servidor. A edição
 *    feita sem sinal sumia sem aviso.
 * 2. Trocar de conta no MESMO aparelho — comum no tablet do terreiro — não
 *    limpava nada, e o acervo de quem saiu era empurrado para dentro da conta
 *    de quem entrou.
 *
 * Guardar o dono junto resolve os dois: o pendente é retomado só por quem o
 * criou, e descartado quando não é dele.
 */
const CHAVE_PENDENTE = "pontos-umbanda-pendente";

let donoAtual: string | null = null;

function lerPendente(): { dono: string; dados: AppData } | null {
  try {
    const bruto = localStorage.getItem(CHAVE_PENDENTE);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

function gravarPendente(dados: AppData | null): void {
  try {
    if (dados && donoAtual) {
      localStorage.setItem(CHAVE_PENDENTE, JSON.stringify({ dono: donoAtual, dados }));
    } else {
      localStorage.removeItem(CHAVE_PENDENTE);
    }
  } catch {
    /* sem storage o pendente volta a viver só em memória, como antes */
  }
}

/**
 * Diz de quem é a sessão atual. Chamado no login, no logout e ao abrir o app.
 *
 * Pendente de OUTRA conta é descartado aqui, antes de qualquer envio — é o que
 * impede o acervo de quem saiu de ser gravado na conta de quem entrou.
 */
export function definirDono(id: string | null): void {
  if (donoAtual === id) return;
  donoAtual = id;
  const guardado = lerPendente();
  if (!guardado || guardado.dono !== id) {
    aguardando = null;
    gravarPendente(null);
    anunciar({ pendente: false, conflito: false, bloqueado: false, ultimoErro: undefined });
    return;
  }
  aguardando = guardado.dados;
  anunciar({ pendente: true });
}

/** O que ficou por enviar da sessão anterior, se for desta mesma pessoa. */
export function pendenteGuardado(): AppData | null {
  const guardado = lerPendente();
  return guardado && guardado.dono === donoAtual ? guardado.dados : null;
}

let relogio: ReturnType<typeof setTimeout> | null = null;
let aguardando: AppData | null = null;

/** O pendente em memória. Existe para o TypeScript não estreitar o tipo. */
function pendenteEmMemoria(): AppData | null {
  return aguardando;
}
let enviando = false;
const ouvintes = new Set<Ouvinte>();
let estado: EstadoEnvio = {
  enviando: false,
  pendente: false,
  conflito: false,
  bloqueado: false,
};

function anunciar(novo: Partial<EstadoEnvio>) {
  estado = { ...estado, ...novo };
  ouvintes.forEach((o) => o(estado));
}

export function observarEnvio(ouvinte: Ouvinte): () => void {
  ouvintes.add(ouvinte);
  ouvinte(estado);
  return () => ouvintes.delete(ouvinte);
}

async function empurrar() {
  if (enviando || !aguardando) return;
  const carga = aguardando;
  aguardando = null;
  // Ainda NÃO apaga o guardado: se o envio falhar, ele é a única cópia do que
  // a pessoa fez. Só sai depois do 200.
  enviando = true;
  anunciar({ enviando: true });

  try {
    const resultado = await enviarAcervo(carga);
    // A versão que ESTE envio criou. Sem aplicá-la, o próximo salvamento manda
    // a versão que o envio acabou de invalidar e leva 409 — "mudou em outro
    // aparelho" sem nada ter mudado, a cada segunda edição seguida.
    if (resultado?.versao) {
      const cache = carregarDados();
      salvarDados({ ...cache, versao: resultado.versao });
      // Lido através de função: o `aguardando = null` no início desta função
      // estreita o tipo para `null`, e o TypeScript não atravessa chamada. O
      // que interessa aqui é o que chegou DEPOIS, enquanto o envio corria.
      const chegouDepois = pendenteEmMemoria();
      if (chegouDepois) {
        aguardando = { ...chegouDepois, versao: resultado.versao };
      }
    }
    // Chegou ao servidor: agora sim.
    gravarPendente(aguardando);
    anunciar({
      enviando: false,
      pendente: aguardando !== null,
      ultimoErro: undefined,
      conflito: false,
      bloqueado: false,
    });
  } catch (erro) {
    // O dado JÁ está no cache do aparelho — nada se perdeu, aconteça o que
    // acontecer aqui.
    aguardando = aguardando ?? carga;
    gravarPendente(aguardando);
    if (ehErroDeApi(erro) && erro.status === 409) {
      // Conflito: NÃO reenviar sozinho. Reenviar em laço apagaria o que o
      // outro aparelho gravou, que é exatamente o que a versão veio impedir.
      // Para de tentar e espera a pessoa decidir.
      anunciar({ enviando: false, pendente: true, conflito: true, ultimoErro: undefined });
      return;
    }
    if (!insistirAdianta(erro)) {
      anunciar({
        enviando: false,
        pendente: true,
        bloqueado: true,
        ultimoErro: descrever(erro),
      });
      return;
    }
    anunciar({ enviando: false, pendente: true, ultimoErro: descrever(erro) });
  } finally {
    enviando = false;
    if (aguardando) agendar();
  }
}

/**
 * Este erro muda de resposta se eu tentar de novo?
 *
 * A pergunta que faltava. O `catch` tratava só o 409 e mandava todo o resto
 * para o mesmo caminho — reagendar em 1,5 s, para sempre. Só que 402 (sem
 * plano) e 401 (sem sessão) não mudam por insistência: o usuário grátis
 * logado, e o anônimo, ficavam num laço de `PUT` do acervo inteiro a cada
 * 1,5 s enquanto o app estivesse aberto.
 *
 * - **Rede caída** → tentar de novo. É o caso normal da gira.
 * - **5xx** → tentar de novo. O servidor tropeçou, pode se levantar.
 * - **429** → tentar de novo. É "devagar", não "nunca".
 * - **409** → caminho próprio: exige decisão da pessoa, e reenviar sozinho
 *   apagaria o que o outro aparelho gravou.
 * - **Qualquer outro 4xx** → parar. O servidor não vai mudar de ideia porque
 *   perguntei mais vezes.
 */
function insistirAdianta(erro: unknown): boolean {
  if (!ehErroDeApi(erro)) return true;
  if (erro.status === 429) return true;
  return erro.status < 400 || erro.status >= 500;
}


function agendar() {
  // Em conflito não reagenda: insistir sozinho é justamente o que apagaria o
  // trabalho do outro aparelho.
  if (estado.conflito) return;
  // Bloqueado também não. Quem destrava é uma AÇÃO da pessoa — `persistir`
  // (ela editou de novo), `forcarEnvio`, ou trocar de conta —, nunca o
  // relógio. É a diferença entre uma tentativa por edição e uma por segundo e
  // meio para sempre.
  if (estado.bloqueado) return;
  if (relogio) clearTimeout(relogio);
  relogio = setTimeout(empurrar, ESPERA_ENVIO_MS);
}

/**
 * "Mandar as minhas assim mesmo": relê a versão atual e envia por cima.
 *
 * É uma decisão consciente da pessoa, com o servidor já mostrado a ela — não um
 * reenvio automático.
 */
/**
 * Quantos pontos existem NO SERVIDOR e não aqui.
 *
 * "Manter o deste aparelho" descarta esses — e a pessoa pode nunca tê-los
 * visto: o servidor acrescenta sozinho os pontos que a comunidade aprovou
 * desde a última leitura (ADR 0005). Descartar o que se escolheu apagar é uma
 * decisão; descartar o que nunca apareceu na tela é uma surpresa.
 *
 * Não decido por ela: conto, e a tela avisa antes.
 */
export async function contarSoDoServidor(): Promise<number> {
  if (!aguardando) return 0;
  const atual = await baixarAcervo();
  const meus = new Set(aguardando.pontos.map((p) => p.id));
  return atual.pontos.filter((p) => !meus.has(p.id)).length;
}

export async function forcarEnvio(): Promise<void> {
  if (!aguardando) return;
  const atual = await baixarAcervo();
  aguardando = { ...aguardando, versao: atual.versao };
  gravarPendente(aguardando);
  anunciar({ conflito: false });
  await empurrar();
}

/** "Ficar com o que está no servidor": descarta o pendente daqui. */
export function descartarPendente(): void {
  aguardando = null;
  gravarPendente(null);
  if (relogio) clearTimeout(relogio);
  anunciar({ conflito: false, pendente: false, ultimoErro: undefined });
}

/**
 * Grava a mudança. O cache é atualizado de forma SÍNCRONA — é isso que mantém
 * a UI instantânea e o app utilizável sem rede. O servidor recebe depois.
 */
export function persistir(dados: AppData): void {
  salvarDados(dados);
  aguardando = dados;
  // Persistido, e não só em memória: sem isto, recarregar ou o sistema matar o
  // PWA em segundo plano apagava o pendente, e o `carregar()` seguinte
  // sobrescrevia o cache com o do servidor. A edição feita sem sinal sumia.
  gravarPendente(dados);
  // Editar de novo destrava. Se o motivo do bloqueio passou — ela assinou,
  // ela entrou na conta —, a próxima edição sincroniza; se não passou, custa
  // UMA tentativa, não uma a cada segundo e meio.
  anunciar({ pendente: true, bloqueado: false });
  agendar();
}

/** Tenta agora, sem esperar o debounce. Use ao voltar a rede ou num botão. */
export function sincronizarAgora(): void {
  if (relogio) clearTimeout(relogio);
  void empurrar();
}

/** Quando o navegador avisa que a rede voltou, empurra o que ficou pendente. */
export function ligarRetomadaAutomatica(): () => void {
  const aoVoltar = () => {
    // Em conflito NÃO: a rede voltar não é a pessoa decidindo. O `agendar()`
    // já se recusa a insistir sozinho, mas este caminho chamava
    // `sincronizarAgora()` direto e passava por fora do guarda — bastava o
    // Wi-Fi oscilar para o aparelho reenviar por cima de um conflito que ele
    // mesmo tinha acabado de detectar.
    // Nem em conflito, nem bloqueado: a rede voltar não muda que falta plano
    // nem que falta sessão, e chamar `sincronizarAgora()` passa por fora do
    // `agendar()`. Sem esta metade, bastava o Wi-Fi oscilar para o laço
    // recomeçar pela porta dos fundos.
    if (estado.pendente && !estado.conflito && !estado.bloqueado) sincronizarAgora();
  };
  window.addEventListener("online", aoVoltar);
  return () => window.removeEventListener("online", aoVoltar);
}
