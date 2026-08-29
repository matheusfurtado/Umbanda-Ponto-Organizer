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

  /** As extensões que o Vite tenta e o Node não. */
  const comExtensao = (alvo: string) => {
    for (const tentativa of [alvo, `${alvo}.ts`, `${alvo}.tsx`, path.join(alvo, "index.ts")]) {
      if (existsSync(tentativa)) return comConsulta(pathToFileURL(tentativa).href);
    }
    return null;
  };

  if (caminho.startsWith("@/")) {
    // As extensões valem para o `@/` TAMBÉM, e não valiam.
    //
    // Este ramo devolvia o caminho cru, sem tentar `.ts`. Como o app quase
    // sempre usa `@/` só para tipo (apagado na compilação) ou dentro de
    // `.tsx` (que teste nenhum importa), o furo ficou invisível — até um
    // módulo testado precisar de um import de RUNTIME por atalho, e aí o
    // arquivo inteiro morria com ENOENT antes do primeiro assert.
    //
    // O risco de deixar assim era pior que o erro: ele empurra quem escreve a
    // trocar o import por relativo "porque o teste não gosta", que é mudar o
    // código para agradar a ferramenta.
    const achado = comExtensao(path.join(RAIZ, "src", caminho.slice(2)));
    if (achado) return achado;
  }

  if (caminho.startsWith(".") && contexto.parentURL) {
    const base = path.dirname(fileURLToPath(contexto.parentURL.split("?")[0]));
    const achado = comExtensao(path.resolve(base, caminho));
    if (achado) return achado;
  }

  return proximo(especificador, contexto, proximo);
};
