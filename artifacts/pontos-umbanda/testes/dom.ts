/**
 * Um DOM para os testes — e uma rede que NÃO existe.
 *
 * A suíte do front nunca teve um componente sob teste. Não por escolha: sem
 * DOM, `react-dom` não roda, e sem rodar não há efeito de React para exercitar.
 * Três dos sete últimos achados da revisão (a tela que prometia teste a quem
 * não ganhou, o filtro que não zerava ao trocar de artista, a seta fora do
 * botão) moravam todos nesse ponto cego.
 *
 * ## Registrado à mão, e não pelo pacote de registro
 *
 * O `@happy-dom/global-registrator` faria isto — mas ele copia tudo, e copiar
 * tudo **derruba o Node** aqui (ver a lista abaixo). O que interessa neste
 * arquivo é justamente o que NÃO é copiado, e isso é decisão: ela fica à
 * vista, e não dentro de uma dependência.
 *
 * ## `fetch` E `sendBeacon` explodem, de propósito
 *
 * O happy-dom traz um `fetch` que faz requisição DE VERDADE. Um teste que
 * esquecesse de trocá-lo sairia batendo na rede — lento, instável, e capaz de
 * escrever em servidor de gente. Aqui ele é substituído por um que estoura
 * dizendo o que fazer. Teste que precisa de rede declara a rede que quer.
 *
 * O `sendBeacon` entrou depois, e entrou porque a barreira VAZOU no primeiro
 * uso: o `registrarCliqueNoPonto` prefere `navigator.sendBeacon` justamente
 * porque `fetch` é cancelado quando a aba perde o foco, e o happy-dom
 * implementa `sendBeacon` com uma requisição real. O primeiro teste de
 * componente do projeto saiu batendo em `localhost:80`.
 *
 * A lição não é "faltou um nome na lista": é que **barrar a rede pelo `fetch`
 * é barrar uma porta de duas**. Toda saída nova (`WebSocket`,
 * `EventSource`, `Image.src`) precisa entrar aqui, ou o teste vai para a rede
 * sem ninguém perceber.
 */

import { Window } from "happy-dom";

const janela = new Window({ url: "http://localhost/" });

/**
 * O que entra no `globalThis` — por lista, e não em massa.
 *
 * A primeira versão copiava tudo que a janela tinha e pulava uma lista curta
 * do Node. Ela **derrubava o Node** com uma asserção nativa
 * (`Assertion failed: isolate_data`): entre as propriedades da janela existem
 * algumas que o runtime não aceita ver substituídas embaixo de si, e descobrir
 * quais era caçar uma a uma.
 *
 * Lista explícita é melhor de qualquer forma. Ela responde numa olhada "o que
 * este DOM oferece?", e quando um teste falhar com `X is not defined` a
 * correção é acrescentar uma linha aqui — visível na revisão — em vez de um
 * global surgir do nada porque a janela por acaso o tinha.
 *
 * Note quem NÃO está aqui: `crypto`, `performance`, `structuredClone`,
 * `AbortController`, `URL`. São do Node, o runner os usa, e trocá-los pelos da
 * janela é justamente o caminho que derrubou o processo.
 */
const DA_JANELA = [
  // O básico do DOM.
  "document", "navigator", "location", "history", "customElements",
  // As classes: o React faz `instanceof` com várias.
  "Node", "Element", "HTMLElement", "HTMLInputElement", "HTMLTextAreaElement",
  "HTMLSelectElement", "HTMLAnchorElement", "HTMLButtonElement", "HTMLFormElement",
  "HTMLImageElement", "SVGElement", "Text", "Comment", "DocumentFragment",
  "ShadowRoot", "DOMParser", "XMLSerializer", "NodeFilter", "Range",
  // Eventos.
  "Event", "CustomEvent", "MouseEvent", "KeyboardEvent", "InputEvent",
  "FocusEvent", "PointerEvent", "SubmitEvent", "EventTarget",
  // O que o app usa direto.
  "localStorage", "sessionStorage", "getComputedStyle", "matchMedia",
  "requestAnimationFrame", "cancelAnimationFrame", "MutationObserver",
  "ResizeObserver", "IntersectionObserver", "getSelection", "scrollTo",
  "FormData", "Blob", "File", "FileReader", "Image", "CSS",
] as const;

const faltando: string[] = [];
for (const chave of DA_JANELA) {
  const descritor = Object.getOwnPropertyDescriptor(janela, chave);
  if (!descritor) {
    faltando.push(chave);
    continue;
  }
  Object.defineProperty(globalThis, chave, { ...descritor, configurable: true });
}

// Uma peça que a janela deixou de ter é peça que o teste vai procurar e não
// achar, com erro de outra coisa. Melhor gritar aqui, uma vez, com o nome.
if (faltando.length > 0) {
  throw new Error(
    `O happy-dom não tem mais: ${faltando.join(", ")}. Tire da lista ou ` +
      "descubra o novo nome — deixar passar vira `undefined is not a function` " +
      "no meio de um teste de componente.",
  );
}

// O `window` precisa apontar para a janela, não para o `globalThis` do Node:
// código que faz `window.addEventListener` tem de falar com o mesmo DOM que o
// React montou.
Object.defineProperty(globalThis, "window", { value: janela, configurable: true });

/** O React exige isto para o `act` valer alguma coisa. */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

Object.defineProperty(globalThis, "fetch", {
  configurable: true,
  writable: true,
  value: async (entrada: unknown) => {
    throw new Error(
      `Teste tentou usar a rede de verdade (${String(entrada)}). Troque o ` +
        "`globalThis.fetch` por um dublê no próprio teste — ver `testes/rede.ts`.",
    );
  },
});

/**
 * A outra porta. Ver o docstring: `sendBeacon` é o caminho preferido do
 * `registrarCliqueNoPonto`, e no happy-dom ele bate na rede de verdade.
 */
Object.defineProperty(janela.navigator, "sendBeacon", {
  configurable: true,
  writable: true,
  value: (url: string) => {
    throw new Error(
      `Teste tentou usar a rede de verdade por sendBeacon (${url}). Use ` +
        "`fingirRede` — ela dubla `fetch` e `sendBeacon` juntos.",
    );
  },
});

export { janela };
