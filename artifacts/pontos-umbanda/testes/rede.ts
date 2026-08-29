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

type Resposta = { status?: number; corpo?: unknown };
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
  const beaconOriginal = window.navigator.sendBeacon;
  const chamadas: { url: string; metodo: string }[] = [];

  // `sendBeacon` é síncrono e devolve booleano: quem o chama não espera nada e
  // não trata erro. Aqui ele só REGISTRA — o corpo da rota é ignorado de
  // propósito, porque nenhum código do app poderia lê-lo.
  Object.defineProperty(window.navigator, "sendBeacon", {
    configurable: true,
    writable: true,
    value: (url: string) => {
      chamadas.push({ url, metodo: "BEACON" });
      return true;
    },
  });

  globalThis.fetch = (async (entrada: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof entrada === "string" ? entrada : String((entrada as URL).toString());
    chamadas.push({ url, metodo: init?.method ?? "GET" });
    const { status = 200, corpo = {} } = await rota(url, init);
    return new Response(JSON.stringify(corpo), {
      status,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;

  return {
    chamadas,
    restaurar: () => {
      globalThis.fetch = original;
      Object.defineProperty(window.navigator, "sendBeacon", {
        configurable: true,
        writable: true,
        value: beaconOriginal,
      });
    },
  };
}
