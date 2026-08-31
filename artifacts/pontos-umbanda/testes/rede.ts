/**
 * O dublê de `fetch`, com a resposta escrita no próprio teste.
 *
 * Escrever `globalThis.fetch = ...` à mão em cada arquivo produziria cinco
 * versões ligeiramente diferentes do mesmo dublê — e a que esquecesse de
 * restaurar contaminaria o teste seguinte, que é o defeito mais chato de achar
 * que existe.
 *
 * Dubla `fetch` **e** `navigator.sendBeacon`, no mesmo registro de chamadas.
 * São duas portas para a mesma rede, e um teste que dublasse só uma delas
 * mediria metade — foi assim que o primeiro teste de componente do projeto
 * saiu batendo em `localhost:80` sem ninguém notar.
 */

type Resposta = {
  status?: number;
  corpo?: unknown;
  /** Corpo CRU (`text/html`), para imitar portal cativo. Vence o `corpo`. */
  bruto?: string;
};
type Rota = (url: string, init?: RequestInit) => Resposta | Promise<Resposta>;

export interface Rede {
  /** Toda chamada que o código fez, na ordem. */
  chamadas: { url: string; metodo: string }[];
  restaurar: () => void;
}

/**
 * Instala o dublê e devolve o registro do que foi chamado.
 *
 * A rota recebe a URL inteira e devolve `{status, corpo}`. URL que a rota não
 * reconhecer vira **erro**, não 404 silencioso: chamada inesperada é achado,
 * e um 404 mudo faria o componente mostrar erro como se fosse o cenário.
 */
export function fingirRede(rota: Rota): Rede {
  const original = globalThis.fetch;
  const chamadas: { url: string; metodo: string }[] = [];

  // O DOM é OPCIONAL aqui.
  //
  // Teste de módulo de API não monta componente nenhum e não precisa de
  // janela. Exigir `window` fazia o dublê estourar com "window is not
  // defined" — um erro sobre navegador no meio de um teste que só queria
  // saber o que o servidor respondeu.
  const navegador = (globalThis as { window?: { navigator: Navigator } }).window?.navigator;
  const beaconOriginal = navegador?.sendBeacon;

  // `sendBeacon` é síncrono e devolve booleano: quem o chama não espera nada e
  // não trata erro. Aqui ele só REGISTRA — o corpo da rota é ignorado de
  // propósito, porque nenhum código do app poderia lê-lo.
  if (navegador) {
    Object.defineProperty(navegador, "sendBeacon", {
      configurable: true,
      writable: true,
      value: (url: string) => {
        chamadas.push({ url, metodo: "BEACON" });
        return true;
      },
    });
  }

  globalThis.fetch = (async (entrada: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof entrada === "string" ? entrada : String((entrada as URL).toString());
    chamadas.push({ url, metodo: init?.method ?? "GET" });
    const resposta = await rota(url, init);
    const { status = 200, corpo = {} } = resposta;
    /**
     * Corpo CRU, sem passar por `JSON.stringify`.
     *
     * O dublê só sabia responder JSON, e por isso não conseguia imitar o caso
     * mais comum de rede em terreiro: Wi-Fi com **portal cativo**, que devolve
     * 200 com a página de login em `text/html`. Sem isto, o defeito de "200 que
     * não é JSON" não tinha como ser testado.
     */
    const { bruto } = resposta;
    if (bruto !== undefined) {
      return new Response(bruto, {
        status,
        headers: { "content-type": "text/html" },
      });
    }
    // 204/205/304 NÃO podem ter corpo: o `Response` estoura com
    // "Response with null body status cannot have body", e o `catch` de quem
    // chamou lê isso como falha de REDE. Um `DELETE` que respondia 204 chegava
    // à tela como "sem conexão" — o dublê inventando um erro que o servidor
    // nunca mandaria, e o teste medindo a mentira.
    if (status === 204 || status === 205 || status === 304) {
      return new Response(null, { status });
    }
    return new Response(JSON.stringify(corpo), {
      status,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;

  return {
    chamadas,
    restaurar: () => {
      globalThis.fetch = original;
      if (navegador) {
        Object.defineProperty(navegador, "sendBeacon", {
          configurable: true,
          writable: true,
          value: beaconOriginal,
        });
      }
    },
  };
}
