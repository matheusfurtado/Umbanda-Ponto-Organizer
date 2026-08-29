/**
 * Nenhuma tela mostra `ErroApi.message` — ele traz "API 409: " na frente.
 *
 * Esta cerca existe porque o defeito era de REPETIÇÃO, não de um arquivo. O
 * ternário `problema instanceof Error ? problema.message : "..."` estava
 * copiado em vinte telas, e a pessoa lia **"API 409: Você já sugeriu um autor
 * para este ponto."** Quem está no terreiro não sabe o que é 409, e o número
 * faz a resposta inteira parecer defeito em vez de resposta.
 *
 * Consertar as vinte sem uma cerca só adia: a vigésima primeira tela vai
 * copiar o padrão da vigésima. É a mesma razão de existir o
 * `test_documentacao_cita_o_que_existe.py` do lado do Python.
 *
 * O que se cobra é o USO em tela. `mensagemDeErro` é o caminho único, e ela
 * decide o que sai: `detalhe` do servidor, o texto padrão de quem chamou, ou o
 * de rede.
 */

import { equal, ok } from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const SRC = dirname(fileURLToPath(import.meta.url));

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) {
      // `components/ui/` é shadcn, código de terceiro que não fala com a API.
      return nome === "ui" ? [] : arquivos(caminho);
    }
    if (!/\.tsx?$/.test(nome) || nome.includes(".test.")) return [];
    return [caminho];
  });
}

/** `problema instanceof Error ? problema.message : "..."` — em qualquer nome. */
const VAZAMENTO = /(\w+) instanceof Error\s*\?\s*\1\.message/;

/**
 * Onde o padrão é legítimo, e por quê.
 *
 * Cada entrada é uma decisão, não um silenciamento — por isso o motivo é
 * obrigatório, e o teste abaixo cobra que a exceção ainda seja necessária.
 */
const PERMITIDOS: Record<string, string> = {
  "api/cliente.ts":
    "é onde o `ErroRede` MONTA a própria mensagem a partir da causa. Não é " +
    "exibição: é a construção do erro que `mensagemDeErro` depois traduz.",
};

test("nenhuma tela mostra a mensagem crua de um erro", () => {
  const lista = arquivos(SRC);
  // GUARDA DE COMPLETUDE. Sem ela, um `readdirSync` que passasse a devolver
  // nada deixaria este teste verde para sempre — é o tropeço nº 1 deste
  // projeto, e já custou quatro vezes.
  ok(lista.length > 60, `só ${lista.length} arquivos varridos: a varredura quebrou`);
  for (const obrigatorio of ["componentes/SugerirAutor.tsx", "pages/TelaPerfil.tsx"]) {
    ok(
      lista.some((c) => c.endsWith(obrigatorio)),
      `a varredura não alcança ${obrigatorio}`,
    );
  }

  const culpados = lista
    .filter((c) => VAZAMENTO.test(readFileSync(c, "utf8")))
    .filter((c) => !(c.slice(SRC.length + 1) in PERMITIDOS));
  equal(
    culpados.length,
    0,
    "estas telas mostram o `message` cru, com o 'API <status>:' na frente — " +
      `use \`mensagemDeErro\`:\n${culpados.map((c) => "  " + c.slice(SRC.length + 1)).join("\n")}`,
  );
});

test("e `mensagemDeErro` é mesmo usada, e não só importada", () => {
  // Uma cerca que só proíbe pode ser satisfeita apagando a mensagem de erro
  // inteira. O caminho certo tem de estar em uso de verdade.
  const usos = arquivos(SRC).filter((c) => /\bmensagemDeErro\(/.test(readFileSync(c, "utf8")));
  ok(usos.length > 15, `só ${usos.length} telas usam o caminho único`);
});

test("a exceção ainda precisa existir", () => {
  // Lista de exceção que ninguém revisa vira lista de esquecimento: no dia em
  // que o `cliente.ts` parar de montar a mensagem assim, a entrada passa a
  // esconder o próximo vazamento que aparecer nesse arquivo.
  for (const [caminho, motivo] of Object.entries(PERMITIDOS)) {
    ok(
      VAZAMENTO.test(readFileSync(join(SRC, caminho), "utf8")),
      `${caminho} não tem mais o padrão (${motivo}) — tire da lista`,
    );
  }
});
