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

/** `throw new Error(...)` numa resposta ruim, ou `.status` pendurado à mão. */
function inventaErro(fonte: string): boolean {
  return /throw new Error\(/.test(fonte) || /erro\.status = /.test(fonte);
}

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

/**
 * O outro lado da mesma moeda: quem PRODUZ o erro fala o vocabulário?
 *
 * `mensagemDeErro`, `ehErroDeApi` e `ehErroDeRede` só funcionam sobre
 * `ErroApi`/`ErroRede`. Cinco módulos de `api/` tinham um `chamar` copiado que
 * lançava `new Error(detalhe)` com um `.status` pendurado — e para esses três
 * a resposta era sempre "não é". Todo tratamento por status naquelas telas era
 * código morto, e ninguém tinha como notar: a mensagem aparecia, só que era
 * sempre a genérica.
 *
 * Já tinha doído uma vez, no `api/artista.ts`, e continuou nos outros quatro
 * mais dois caminhos de `multipart`. Cerca para não voltar uma sétima vez.
 */
/** Este arquivo fala HTTP? */
function falaHttp(fonte: string): boolean {
  return /\bfetch\(/.test(fonte);
}

test("quem fala HTTP fala o vocabulário de erro — esteja onde estiver", () => {
  // A varredura era só `api/`, e foi assim que `lib/apiBilling.ts`,
  // `lib/apiConta.ts` e um `fetch` cru dentro da `TelaNovidades` escaparam de
  // seis rodadas deste mesmo conserto. **A pasta não é o critério; falar HTTP
  // é.** Um arquivo que chama `fetch` e monta o próprio erro deixa
  // `ehErroDeApi` e `ehErroDeRede` cegos para ele, e o texto que o servidor
  // escreveu não chega a quem está lendo a tela.
  const lista = arquivos(SRC);
  const clientes = lista.filter((c) => falaHttp(readFileSync(c, "utf8")));
  ok(clientes.length >= 6, `só ${clientes.length} arquivos falam HTTP: a varredura quebrou`);
  // Âncoras que AINDA falam HTTP. `lib/apiBilling.ts` esteve aqui e saiu — ele
  // passou a usar `chamarApi`, que é o desfecho certo; âncora tem de ser um
  // fato de hoje, não a lembrança de um conserto.
  for (const obrigatorio of ["api/cliente.ts", "api/painel.ts"]) {
    ok(clientes.some((c) => c.endsWith(obrigatorio)), `a varredura não alcança ${obrigatorio}`);
  }

  const culpados = clientes.filter(
    // `cliente.ts` é quem DEFINE o vocabulário; ele não pode ser réu dele.
    (c) => !c.endsWith(join("api", "cliente.ts")) && inventaErro(readFileSync(c, "utf8")),
  );
  equal(
    culpados.length,
    0,
    "estes arquivos falam HTTP e inventam o próprio erro — use `chamarApi`, ou " +
      `\`ErroApi\`/\`ErroRede\` direto:\n${culpados.map((c) => "  " + c.slice(SRC.length + 1)).join("\n")}`,
  );
});

test("nenhuma TELA chama `fetch` direto", () => {
  // Cerca separada porque o defeito é outro: além do vocabulário, uma tela que
  // fala HTTP na mão perde o tempo limite de 8 s do `chamarApi` — "na gira o
  // celular costuma estar em rede ruim, e esperar 30 s parado é pior que cair
  // para o cache" — e some da conferência de fronteira do lado do Python, que
  // lê os módulos de `api/`.
  //
  // A `TelaNovidades` fazia isso, e por isso a rota `/novidades` nunca tinha
  // sido conferida contra o OpenAPI.
  const telas = arquivos(join(SRC, "pages")).concat(arquivos(join(SRC, "componentes")));
  ok(telas.length > 30, `só ${telas.length} telas varridas`);
  const culpados = telas.filter((c) => falaHttp(readFileSync(c, "utf8")));
  equal(
    culpados.length,
    0,
    "estas telas chamam `fetch` direto — o caminho é um módulo em `api/`:\n" +
      culpados.map((c) => "  " + c.slice(SRC.length + 1)).join("\n"),
  );
});

// ------------------------------------- e os detectores, contra caso conhecido

/**
 * Cerca de ausência não consegue falhar quando não há violação.
 *
 * As varreduras acima terminam em "a lista está vazia". Enfraquecer o PADRÃO —
 * tirar um caso do regex, apertar um limite de palavra — deixa a lista vazia
 * do mesmo jeito, e a cerca segue verde protegendo nada.
 *
 * Não é hipótese: no `dialogo-limpa-ao-fechar` a mutação que apagava metade do
 * detector sobreviveu, e só apareceu porque fui procurar. O alvo estava
 * testado; o INSTRUMENTO não estava.
 *
 * Por isso os dois detectores são medidos contra fonte sintética, onde a
 * resposta é conhecida — e os casos negativos importam tanto quanto os
 * positivos: cerca que acusa código correto vira ruído, e ruído é ignorado.
 */
test("o detector de `message` cru reconhece as formas que aparecem de verdade", () => {
  const vazam = [
    'setErro(problema instanceof Error ? problema.message : "padrão");',
    'setErro(e instanceof Error ? e.message : "padrão");',
    'setErro(\n  problema instanceof Error\n    ? problema.message\n    : "padrão",\n);',
  ];
  for (const fonte of vazam) {
    ok(VAZAMENTO.test(fonte), `não reconheceu como vazamento: ${fonte}`);
  }

  const limpas = [
    'setErro(mensagemDeErro(problema, "padrão"));',
    // Nome DIFERENTE dos dois lados não é o padrão que vaza.
    'setErro(a instanceof Error ? b.message : "padrão");',
    "if (problema instanceof Error) registrar(problema);",
  ];
  for (const fonte of limpas) {
    ok(!VAZAMENTO.test(fonte), `acusou código correto: ${fonte}`);
  }
});

test("o detector de HTTP reconhece chamada, e não menção", () => {
  ok(falaHttp("const r = await fetch(`${BASE}/x`);"));
  ok(falaHttp("void fetch(url, { method: \"POST\" });"));
  ok(!falaHttp("// o `chamarApi` faz o fetch por você"), "acusou uma menção em comentário");
  ok(!falaHttp("import { chamarApi } from \"@/api/cliente\";"), "acusou um import");
});

test("o detector de erro inventado reconhece as duas formas", () => {
  ok(inventaErro('if (!r.ok) throw new Error("falhou");'), "não viu o `throw new Error`");
  ok(
    inventaErro(
      "const erro = new Error(d) as Error & { status?: number };\n  erro.status = r.status;",
    ),
    "não viu o `.status` pendurado à mão",
  );

  ok(!inventaErro("throw new ErroApi(r.status, String(detalhe));"), "acusou o vocabulário certo");
  ok(!inventaErro("throw new ErroRede(causa);"), "acusou o vocabulário certo");
});
