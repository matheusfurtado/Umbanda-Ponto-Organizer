/**
 * Faz o Node achar os módulos do jeito que o Vite acha.
 *
 * O código do app importa sem extensão (`"../api/cliente"`) e com o atalho
 * `@/` — duas coisas que o bundler resolve e o Node, sozinho, não. Sem isto,
 * rodar um teste com `node --test` esbarra em `ERR_MODULE_NOT_FOUND` antes de
 * chegar em qualquer assert.
 *
 * A alternativa era instalar um runner só para isto. Vinte linhas custam menos
 * que uma dependência, e o teste passa a exercitar o mesmo arquivo que vai para
 * produção — sem cópia, sem stub de módulo.
 */

import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

type Resolve = (
  especificador: string,
  contexto: { parentURL?: string },
  proximo: Resolve,
) => Promise<{ url: string; shortCircuit?: boolean }>;

export const resolve: Resolve = async (especificador, contexto, proximo) => {
  // A query (`?cenario=2`) é o que dá ao teste uma instância nova do módulo:
  // a fila de envio é estado de módulo, e sem isso um cenário herdaria a do
  // anterior. Ela sai aqui para o arquivo ser encontrado, e volta na URL.
  const [caminho, consulta] = especificador.split("?");
  const comConsulta = (url: string) => ({
    url: consulta ? `${url}?${consulta}` : url,
    shortCircuit: true,
  });

  if (caminho.startsWith("@/")) {
    return comConsulta(pathToFileURL(path.join(RAIZ, "src", caminho.slice(2))).href);
  }

  if (caminho.startsWith(".") && contexto.parentURL) {
    const base = path.dirname(fileURLToPath(contexto.parentURL.split("?")[0]));
    const alvo = path.resolve(base, caminho);
    for (const tentativa of [alvo, `${alvo}.ts`, `${alvo}.tsx`, path.join(alvo, "index.ts")]) {
      if (existsSync(tentativa)) return comConsulta(pathToFileURL(tentativa).href);
    }
  }

  return proximo(especificador, contexto, proximo);
};
