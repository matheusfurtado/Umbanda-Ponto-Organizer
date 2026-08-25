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
  if (ehErroDeApi(erro)) return `servidor respondeu ${erro.status}`;
  return "falha desconhecida";
}

export async function carregar(): Promise<ResultadoCarga> {
  try {
    const doServidor = await baixarAcervo();
    // A preferência de qual orixá estava aberto é deste aparelho e não vem do
    // servidor. Preservá-la evita a tela pular ao voltar de uma sincronização.
    const local = carregarDados();
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
}

let relogio: ReturnType<typeof setTimeout> | null = null;
let aguardando: AppData | null = null;
let enviando = false;
const ouvintes = new Set<Ouvinte>();
let estado: EstadoEnvio = { enviando: false, pendente: false, conflito: false };

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
  enviando = true;
  anunciar({ enviando: true });

  try {
    await enviarAcervo(carga);
    anunciar({
      enviando: false,
      pendente: aguardando !== null,
      ultimoErro: undefined,
      conflito: false,
    });
  } catch (erro) {
    // O dado JÁ está no cache do aparelho — nada se perdeu, aconteça o que
    // acontecer aqui.
    aguardando = aguardando ?? carga;
    if (ehErroDeApi(erro) && erro.status === 409) {
      // Conflito: NÃO reenviar sozinho. Reenviar em laço apagaria o que o
      // outro aparelho gravou, que é exatamente o que a versão veio impedir.
      // Para de tentar e espera a pessoa decidir.
      anunciar({ enviando: false, pendente: true, conflito: true, ultimoErro: undefined });
      return;
    }
    anunciar({ enviando: false, pendente: true, ultimoErro: descrever(erro) });
  } finally {
    enviando = false;
    if (aguardando) agendar();
  }
}

function agendar() {
  // Em conflito não reagenda: insistir sozinho é justamente o que apagaria o
  // trabalho do outro aparelho.
  if (estado.conflito) return;
  if (relogio) clearTimeout(relogio);
  relogio = setTimeout(empurrar, ESPERA_ENVIO_MS);
}

/**
 * "Mandar as minhas assim mesmo": relê a versão atual e envia por cima.
 *
 * É uma decisão consciente da pessoa, com o servidor já mostrado a ela — não um
 * reenvio automático.
 */
export async function forcarEnvio(): Promise<void> {
  if (!aguardando) return;
  const atual = await baixarAcervo();
  aguardando = { ...aguardando, versao: atual.versao };
  anunciar({ conflito: false });
  await empurrar();
}

/** "Ficar com o que está no servidor": descarta o pendente daqui. */
export function descartarPendente(): void {
  aguardando = null;
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
  anunciar({ pendente: true });
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
    if (estado.pendente) sincronizarAgora();
  };
  window.addEventListener("online", aoVoltar);
  return () => window.removeEventListener("online", aoVoltar);
}
