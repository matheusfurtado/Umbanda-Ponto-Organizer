/**
 * O convite de instalar — e os dois jeitos de ele não existir.
 *
 * Esta é a superfície que decide se o app vira ícone na tela inicial. Tinha
 * dois defeitos que se anulavam em silêncio: no iPad ela NUNCA aparecia, e no
 * Android ela continuava aparecendo depois de o convite nativo ter sido gasto
 * — botão na tela que não fazia mais nada.
 */

import { equal, deepEqual, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { assentar, renderizar } from "../testes/renderizar.ts";
import { usePWA } from "@/usePWA";

beforeEach(() => localStorage.clear());

const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
/** Do iPadOS 13 em diante o Safari do iPad se declara Macintosh. */
const IPAD_MODERNO = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15";
const IPAD_ANTIGO = "Mozilla/5.0 (iPad; CPU OS 12_0 like Mac OS X) AppleWebKit/605.1.15";
const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36";
const MAC = IPAD_MODERNO;

function fingirAparelho(ua: string, toques: number) {
  for (const [nome, valor] of [["userAgent", ua], ["maxTouchPoints", toques]] as const) {
    Object.defineProperty(window.navigator, nome, { value: valor, configurable: true });
  }
}

/** Um convite nativo, como o Chrome o entrega. */
function convite(resposta: "accepted" | "dismissed" | "erro") {
  const e = new window.Event("beforeinstallprompt") as Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
    quantasVezes: number;
  };
  e.quantasVezes = 0;
  e.prompt = () => {
    e.quantasVezes += 1;
    // O evento é de uma vez só: o navegador rejeita a segunda chamada.
    if (e.quantasVezes > 1 || resposta === "erro") {
      return Promise.reject(new Error("InvalidStateError"));
    }
    return Promise.resolve();
  };
  e.userChoice = Promise.resolve({
    outcome: resposta === "erro" ? "dismissed" : resposta,
  });
  return e;
}

/** Expõe o hook para o teste, sem tela nenhuma no meio. */
let visto: ReturnType<typeof usePWA>;
function Sonda() {
  visto = usePWA();
  return <span>{String(visto.isIOS)}/{String(visto.isInstallable)}/{String(visto.isInstalled)}</span>;
}

async function montar(ua: string, toques = 0) {
  fingirAparelho(ua, toques);
  const tela = await renderizar(<Sonda />);
  await assentar();
  return { tela, limpar: () => tela.desmontar() };
}

test("iPhone é reconhecido — ele se declara", async () => {
  const { tela, limpar } = await montar(IPHONE, 5);
  try {
    equal(visto.isIOS, true);
  } finally {
    await limpar();
  }
  void tela;
});

test("iPad MODERNO é reconhecido, e era o que faltava", async () => {
  // Do iPadOS 13 em diante a string "iPad" some do user agent. Como o iOS
  // também não dispara `beforeinstallprompt`, o convite ficava impossível nos
  // dois caminhos: a faixa nunca aparecia justamente no aparelho onde ela é a
  // ÚNICA forma de instalar.
  const { limpar } = await montar(IPAD_MODERNO, 5);
  try {
    equal(visto.isIOS, true, "o iPad continua invisível para o app");
  } finally {
    await limpar();
  }
});

test("iPad antigo continua reconhecido — a correção não trocou um buraco por outro", async () => {
  const { limpar } = await montar(IPAD_ANTIGO, 5);
  try {
    equal(visto.isIOS, true);
  } finally {
    await limpar();
  }
});

test("um Mac de verdade NÃO recebe instruções de iPhone", async () => {
  // É o outro lado da mesma checagem: `maxTouchPoints` é o que separa um Mac
  // (0) de um iPad fingindo de Mac (5). Sem ele, todo Mac veria um passo a
  // passo do Safari do iPhone.
  const { limpar } = await montar(MAC, 0);
  try {
    equal(visto.isIOS, false, "mandou o Mac procurar o botão de compartilhar do iPhone");
  } finally {
    await limpar();
  }
});

test("Android com convite nativo: dá para instalar", async () => {
  const { limpar } = await montar(ANDROID, 1);
  try {
    equal(visto.isIOS, false);
    equal(visto.isInstallable, false, "ofereceu instalar antes de o navegador convidar");
    await assentar();
    window.dispatchEvent(convite("accepted"));
    await assentar();
    equal(visto.isInstallable, true);
  } finally {
    await limpar();
  }
});

test("aceitar o convite marca como instalado", async () => {
  const { limpar } = await montar(ANDROID, 1);
  try {
    window.dispatchEvent(convite("accepted"));
    await assentar();
    await visto.instalar();
    await assentar();
    equal(visto.isInstalled, true);
    equal(visto.isInstallable, false);
  } finally {
    await limpar();
  }
});

test("RECUSAR tira o botão — o convite nativo é de uma vez só", async () => {
  // O código só limpava o estado quando a pessoa aceitava. Recusando,
  // `isInstallable` continuava `true`, o botão "Instalar" continuava na faixa
  // e não fazia mais nada: a segunda chamada de `prompt()` rejeita com
  // `InvalidStateError`, e ninguém pegava essa promessa.
  //
  // Botão que não faz nada é pior que botão nenhum — a pessoa conclui que o
  // app está quebrado, no primeiro gesto que ele pediu que ela fizesse.
  const { limpar } = await montar(ANDROID, 1);
  try {
    window.dispatchEvent(convite("dismissed"));
    await assentar();
    await visto.instalar();
    await assentar();
    equal(visto.isInstallable, false, "o botão gasto continuou oferecido");
    equal(visto.isInstalled, false, "recusar não pode marcar como instalado");
  } finally {
    await limpar();
  }
});

test("o navegador recusando o convite não derruba a tela", async () => {
  const { limpar } = await montar(ANDROID, 1);
  try {
    window.dispatchEvent(convite("erro"));
    await assentar();
    await visto.instalar();
    await assentar();
    equal(visto.isInstallable, false);
    equal(visto.isInstalled, false);
  } finally {
    await limpar();
  }
});

test("desmontar devolve TODOS os ouvintes que o hook pendurou na janela", async () => {
  // O `appinstalled` estava anônimo e o `return` do efeito só removia o outro:
  // cada montagem deixava mais um ouvinte pendurado, chamando `setState` de um
  // componente que já saiu. Numa aba aberta a gira inteira, isso acumula.
  const postos: string[] = [];
  const tirados: string[] = [];
  const add = window.addEventListener.bind(window);
  const rem = window.removeEventListener.bind(window);
  window.addEventListener = ((tipo: string, ...resto: unknown[]) => {
    postos.push(tipo);
    return (add as (...a: unknown[]) => void)(tipo, ...resto);
  }) as typeof window.addEventListener;
  window.removeEventListener = ((tipo: string, ...resto: unknown[]) => {
    tirados.push(tipo);
    return (rem as (...a: unknown[]) => void)(tipo, ...resto);
  }) as typeof window.removeEventListener;
  try {
    const { limpar } = await montar(ANDROID, 1);
    await limpar();
    const doHook = (l: string[]) =>
      l.filter((t) => t === "beforeinstallprompt" || t === "appinstalled").sort();
    ok(doHook(postos).length > 0, "o hook não pendurou ouvinte nenhum — o teste ficou cego");
    deepEqual(doHook(tirados), doHook(postos), "sobrou ouvinte pendurado na janela");
  } finally {
    window.addEventListener = add;
    window.removeEventListener = rem;
  }
});
