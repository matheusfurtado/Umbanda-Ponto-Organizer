/**
 * Todo diálogo que guarda o que a pessoa digitou limpa ao fechar.
 *
 * Três vezes o mesmo defeito, em três arquivos diferentes:
 *
 * - **`ApagarConta`** — a senha ficava, e reabrir trazia "Apagar para sempre"
 *   já armado, antes de a pessoa ter lido uma linha do aviso.
 * - **`TrocarApelido`** — o nome abandonado ficava, e "Trocar" armado move a
 *   URL do perfil: os links colados no grupo do terreiro param de abrir.
 * - **`PublicarGira`** — o apelido abandonado ficava, e um toque o tornava o
 *   nome público da pessoa em todo o app.
 *
 * Os três têm a mesma forma: `useState` que sobrevive porque o componente não
 * é desmontado — ele só devolve `null`, ou o `Dialog` só fecha. E os três
 * armam um botão destrutivo com um valor que a pessoa descartou.
 *
 * Duas ocorrências eu tratei como coincidência e consertei sem cerca. A
 * terceira é padrão.
 *
 * ## O que se cobra
 *
 * Um diálogo que tem `useState` de entrada precisa de uma função de fechar que
 * limpe — e TODOS os caminhos de saída (o `onOpenChange` do `Dialog`, o botão
 * "Cancelar", e o caminho de sucesso) precisam passar por ela. Cobrar o nome
 * `fechar` é frágil; o que se cobra é que nenhum caminho de saída chame o
 * `onFechar` cru.
 */

import { equal, ok } from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const SRC = dirname(fileURLToPath(import.meta.url));

function arquivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return nome === "ui" ? [] : arquivos(caminho);
    if (!nome.endsWith(".tsx") || nome.includes(".test.")) return [];
    return [caminho];
  });
}

/** Diálogo que guarda entrada da pessoa: tem `<Dialog`, `onFechar` e `useState`. */
function ehDialogoComEntrada(fonte: string): boolean {
  return (
    /<Dialog\b/.test(fonte) &&
    /\bonFechar\b/.test(fonte) &&
    /useState<?\s*(string|<string)/.test(fonte)
  );
}

/** `onClick={onFechar}` ou `onClick={() => onFechar()}` — saída sem limpeza. */
const SAIDA_CRUA = /on(?:Click|OpenChange)=\{[^}]*\bonFechar\b/;

test("nenhum diálogo com entrada sai pelo `onFechar` cru", () => {
  const lista = arquivos(SRC);
  ok(lista.length > 40, `só ${lista.length} componentes varridos: a varredura quebrou`);

  const dialogos = lista.filter((c) => ehDialogoComEntrada(readFileSync(c, "utf8")));
  // GUARDA DE COMPLETUDE: os três que motivaram esta cerca precisam estar na
  // varredura, senão ela passa vazia e não protege nada.
  for (const obrigatorio of [
    "componentes/PublicarGira.tsx",
    "componentes/TrocarApelido.tsx",
    "componentes/AdicionarAGira.tsx",
  ]) {
    ok(
      dialogos.some((c) => c.endsWith(obrigatorio)),
      `a varredura não reconhece ${obrigatorio} como diálogo com entrada`,
    );
  }

  const crus = dialogos.filter((c) => SAIDA_CRUA.test(readFileSync(c, "utf8")));
  equal(
    crus.length,
    0,
    "estes diálogos saem chamando `onFechar` direto — o que a pessoa digitou " +
      "sobrevive e reaparece na próxima abertura, com o botão já armado:\n" +
      crus.map((c) => "  " + c.slice(SRC.length + 1)).join("\n"),
  );
});


test("o detector reconhece as duas formas de sair — e não acusa a certa", () => {
  /**
   * Uma cerca de "nenhuma violação" não consegue falhar quando não há
   * violação: enfraquecer o próprio detector passa despercebido. Foi o que a
   * mutação mostrou — apagar `OpenChange` do padrão não derrubava nada.
   *
   * Então o detector é exercitado contra fonte sintética, onde a resposta
   * certa é conhecida.
   */
  const cruas = [
    'onClick={onFechar}',
    'onClick={() => onFechar()}',
    '<Dialog open onOpenChange={(v) => !v && onFechar()}>',
    'onOpenChange={(v) => { if (!v) onFechar(); }}',
  ];
  for (const fonte of cruas) {
    ok(SAIDA_CRUA.test(fonte), `não reconheceu como saída crua: ${fonte}`);
  }

  const limpas = [
    'onClick={fechar}',
    'onClick={() => fechar()}',
    '<Dialog open onOpenChange={(v) => !v && fechar()}>',
    // A PROP em si não é violação: todo diálogo recebe `onFechar`, e é a
    // função de limpar que deve chamá-la.
    'export function X({ onFechar }: { onFechar: () => void }) {',
    'const fechar = () => { setNome(""); onFechar(); };',
  ];
  for (const fonte of limpas) {
    ok(!SAIDA_CRUA.test(fonte), `acusou uma saída correta: ${fonte}`);
  }
});

test("o reconhecedor de diálogo com entrada não é largo demais", () => {
  // Se ele casasse com qualquer `.tsx`, a guarda de completude passaria e a
  // cerca reclamaria de arquivos que não são diálogo nenhum.
  ok(
    !ehDialogoComEntrada('export function Lista() { return <ul />; }'),
    "chamou de diálogo um componente sem Dialog",
  );
  ok(
    !ehDialogoComEntrada('<Dialog open>{null}</Dialog>'),
    "chamou de diálogo com entrada um que não guarda nada",
  );
  ok(
    ehDialogoComEntrada(
      'const [n, setN] = useState<string | null>(null); <Dialog/>; onFechar();',
    ),
    "não reconheceu um diálogo com entrada",
  );
});
