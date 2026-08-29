/**
 * Montar um componente de verdade, com efeito e estado, e mexer nele.
 *
 * O `act` é o que faz os efeitos rodarem antes do assert. Sem ele o teste lê a
 * tela do primeiro quadro — antes de qualquer `useEffect` — e passa a afirmar
 * coisas sobre um estado que o usuário nunca vê.
 *
 * ## `assentar`, e por que ele não é opcional
 *
 * O `act` de `renderizar` espera UM ciclo. Uma tela que faz duas chamadas em
 * sequência — confirmar o e-mail, e depois perguntar o plano — só termina a
 * segunda alguns ticks depois, e o assert leria a tela do meio do caminho.
 * Isso não dá erro: dá um teste que afirma que a tela "não mostra o plano",
 * quando na verdade ela ainda não tinha chegado lá.
 *
 * `assentar()` deixa a fila de promessas terminar dentro de um `act`. Toda
 * tela que busca dado precisa dele depois de montar.
 *
 * ## `naPagina`, para o que sai do container
 *
 * Diálogo do Radix — e este app usa vários — é renderizado em PORTAL, direto
 * no `document.body`. Procurar só dentro do container devolve vazio, e um
 * teste que procura vazio e não acha nada passa a afirmar "o botão não está
 * lá" quando o botão está, um nível acima.
 *
 * `import "./dom.ts"` vem primeiro e não é decoração: o `react-dom/client`
 * precisa do `document` existindo quando é avaliado. Por isso ele entra por
 * `import()` dinâmico aqui embaixo, e não por `import` no topo — assim a ordem
 * é explícita no código, em vez de depender de ninguém reordenar os imports.
 */

import "./dom.ts";
import { act, type ReactNode } from "react";

const { createRoot } = await import("react-dom/client");

/**
 * Deixa as promessas pendentes terminarem, com o React sabendo.
 *
 * `setTimeout(0)` e não `Promise.resolve()`: uma cadeia de `await` só anda uma
 * casa por microtarefa, e ceder o macrotick drena a fila inteira de uma vez.
 */
export async function assentar(): Promise<void> {
  await act(async () => {
    await new Promise((resolver) => setTimeout(resolver, 0));
  });
}

export interface Tela {
  container: HTMLElement;
  html: () => string;
  texto: () => string;
  achar: (seletor: string) => Element | null;
  todos: (seletor: string) => Element[];
  /** Exige que exista: seletor que não casa é erro do teste, não `null`. */
  exigir: (seletor: string) => Element;
  clicar: (alvo: Element | string) => Promise<void>;
  /** Igual a `todos`, mas na PÁGINA inteira: pega portal de diálogo. */
  todosNaPagina: (seletor: string) => Element[];
  /** O texto da página inteira, portais incluídos. */
  textoNaPagina: () => string;
  /** Ver `assentar` — o mesmo, já preso a esta tela. */
  assentar: () => Promise<void>;
  /** Re-renderiza a MESMA raiz — é assim que se troca uma prop sem remontar. */
  reRenderizar: (no: ReactNode) => Promise<void>;
  desmontar: () => Promise<void>;
}

export async function renderizar(no: ReactNode): Promise<Tela> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const raiz = createRoot(container);
  await act(async () => {
    raiz.render(no);
  });

  const exigir = (seletor: string): Element => {
    const achado = container.querySelector(seletor);
    if (!achado) {
      throw new Error(
        `Nada casou com "${seletor}". O que está na tela:\n${container.innerHTML}`,
      );
    }
    return achado;
  };

  return {
    container,
    html: () => container.innerHTML,
    texto: () => container.textContent ?? "",
    achar: (seletor) => container.querySelector(seletor),
    todos: (seletor) => [...container.querySelectorAll(seletor)],
    exigir,
    clicar: async (alvo) => {
      const el = typeof alvo === "string" ? exigir(alvo) : alvo;
      await act(async () => {
        el.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
      });
    },
    todosNaPagina: (seletor) => [...document.body.querySelectorAll(seletor)],
    textoNaPagina: () => document.body.textContent ?? "",
    assentar,
    reRenderizar: async (novo) => {
      await act(async () => {
        raiz.render(novo);
      });
    },
    desmontar: async () => {
      await act(async () => {
        raiz.unmount();
      });
      container.remove();
    },
  };
}
