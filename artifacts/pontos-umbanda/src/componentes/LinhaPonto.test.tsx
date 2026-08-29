/**
 * A linha do acervo — a que todo mundo vê, 520 vezes.
 *
 * Nunca teve teste porque `.tsx` não podia ser importado. É a linha onde a
 * pessoa decide se aperta play no meio da gira, e quase tudo aqui é uma
 * promessa: "este vídeo é este ponto", "isto é novo", "isto não tem gravação".
 * Promessa errada nesta tela custa mais que em qualquer outra do app.
 */

import { doesNotMatch, equal, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { LinhaPonto } from "@/componentes/LinhaPonto";
import { AppProvider } from "@/context";
import { AuthProvider } from "@/auth/AuthContext";
import type { Ponto } from "@/types";

/**
 * O `AuthProvider` hidrata `user` de forma SÍNCRONA do `localStorage`
 * (`useState(() => lembrado())`) — é o que faz o app abrir sem piscar "Entrar"
 * para quem já estava logada. Num processo de teste, isso significa que a
 * pessoa do teste anterior continua logada no seguinte.
 *
 * Custou uma mutação sobrevivente no `MenuUsuario`: o cenário "ainda não sei
 * quem é" nunca acontecia, porque o usuário do teste de cima já estava lá.
 */
beforeEach(() => localStorage.clear());


const DIA = 24 * 60 * 60 * 1000;

function ponto(sobrepor: Partial<Ponto> = {}): Ponto {
  return {
    id: "og-1",
    subcategoriaId: "s1",
    titulo: "Ogum de Lei",
    letra: "Ogum de Lei, meu pai\nOgum de Lei",
    favorito: false,
    ordem: 1,
    criadoEm: 0,
    ...sobrepor,
  };
}

async function linha(p: Ponto, extras: Record<string, unknown> = {}) {
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) return { status: 401, corpo: {} };
    return { corpo: {} };
  });
  const { hook } = memoryLocation({ path: "/" });
  const tela = await renderizar(
    <Router hook={hook}>
      <AuthProvider>
        <AppProvider>
          <LinhaPonto ponto={p} indice={1} {...extras} />
        </AppProvider>
      </AuthProvider>
    </Router>,
  );
  await assentar();
  return { tela, rede };
}

test("o destaque da busca vale no título E na letra aberta", async () => {
  const { tela, rede } = await linha(ponto(), { busca: "ogum" });
  try {
    equal(tela.todos("mark").length, 1, "o título não realçou");
    await tela.clicar('button[aria-expanded]');
    equal(tela.todos("mark").length, 3, "a letra aberta não realçou");
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});

test("o casamento duvidoso NÃO tem a mesma cara do certo", async () => {
  // "A pessoa aperta play no meio da gira e toca outra música." São 157 pontos
  // assim; se o ícone fosse o mesmo, a honestidade seria só um comentário.
  const certo = await linha(ponto({ videoUrl: "https://y/1", videoStatus: "encontrado" }));
  const duvida = await linha(ponto({ videoUrl: "https://y/1", videoStatus: "revisar" }));
  try {
    const iconeDe = (t: typeof certo.tela) =>
      t.exigir('a[href="https://y/1"]').querySelector("svg")?.getAttribute("class") ?? "";
    ok(iconeDe(certo.tela) !== iconeDe(duvida.tela), "o palpite tem o ícone do acerto");
    match(
      certo.tela.exigir("a").getAttribute("title") ?? "",
      /Ouvir no YouTube/,
    );
    match(
      duvida.tela.exigir("a").getAttribute("title") ?? "",
      /confira antes de usar/,
    );
  } finally {
    await certo.tela.desmontar(); certo.rede.restaurar();
    await duvida.tela.desmontar(); duvida.rede.restaurar();
  }
});

test("sem vídeo é uma informação anunciada, não um vazio", async () => {
  // Era espaço em branco, e "não tem gravação" ficava indistinguível de "o
  // ícone não carregou".
  const { tela, rede } = await linha(ponto({ videoUrl: null }));
  try {
    equal(tela.achar("a[href^='https']"), null, "ofereceu link sem vídeo");
    const marca = tela.exigir('[aria-label$="sem vídeo ainda"]');
    ok(marca, "o sem-vídeo não se anuncia a quem usa leitor de tela");
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});

test("a confiança fraca aparece com o número, na letra aberta", async () => {
  const { tela, rede } = await linha(
    ponto({ videoUrl: "https://y/1", videoStatus: "revisar", videoConfianca: 0.42 }),
  );
  try {
    await tela.clicar('button[aria-expanded]');
    match(tela.texto(), /correspondência ficou fraca \(42%\)/);
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});

test("o selo 'novo' segue os 30 dias, e some fora deles", async () => {
  for (const [quando, esperado] of [
    [Date.now() - 2 * DIA, true],
    [Date.now() - 29 * DIA, true],
    [Date.now() - 31 * DIA, false],
    [null, false],
  ] as const) {
    const { tela, rede } = await linha(ponto({ aprovadoEm: quando }));
    try {
      equal(
        /novo/i.test(tela.texto()),
        esperado,
        `aprovadoEm=${quando} deveria ${esperado ? "" : "não "}ser novo`,
      );
    } finally {
      await tela.desmontar();
      rede.restaurar();
    }
  }
});

test("quem compôs vem antes de quem trouxe, e nunca no lugar dele", async () => {
  // "Trocar um pelo outro atribuiria obra religiosa a quem não a fez."
  const { tela, rede } = await linha(ponto({ autor: "Zé Pilintra", enviadoPor: "maria" }));
  try {
    const texto = tela.texto();
    ok(
      texto.indexOf("Zé Pilintra") < texto.indexOf("enviado por maria"),
      `quem trouxe apareceu antes de quem compôs: ${texto}`,
    );
    match(texto, /Zé Pilintra · enviado por maria/);
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});

test("só quem trouxe, sem autor, não deixa um separador solto", async () => {
  const { tela, rede } = await linha(ponto({ enviadoPor: "maria" }));
  try {
    doesNotMatch(tela.texto(), /·\s*enviado/, "sobrou o ponto separador sem nada antes");
    match(tela.texto(), /enviado por maria/);
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});

test("linha sem autoria nenhuma não mostra risco nem linha vazia", async () => {
  // "Um '—' em 520 linhas é ruído em toda a lista."
  const { tela, rede } = await linha(ponto());
  try {
    equal(tela.texto().trim(), "1Ogum de Lei", `veio lixo junto: ${tela.texto()}`);
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});

test("o ponto sem letra convida a mandar, em vez de abrir vazio", async () => {
  const { tela, rede } = await linha(ponto({ letra: "   " }));
  try {
    await tela.clicar('button[aria-expanded]');
    match(tela.texto(), /ainda não está no acervo/);
    ok(
      tela.todos("a").some((a) => a.getAttribute("href") === "/enviar-ponto"),
      "disse que falta e não ofereceu o caminho",
    );
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});

test("o ponto em aprovação é marcado — só ela o vê", async () => {
  const { tela, rede } = await linha(ponto({ emAprovacao: true }));
  try {
    ok(tela.achar('[aria-label="Em aprovação"]'), "sem a marca, ela acha que já está no acervo de todos");
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});

test("a duração é lida de relance, inclusive passando da hora", async () => {
  // O acervo tem um vídeo de 4761 s hoje, e vai ter mais: os canais que o
  // casamento encontra publicam gira inteira. Sem o ramo da hora ele saía
  // como "79:21", e quem procura um ponto curto para ensaiar teria de fazer a
  // conta de cabeça.
  for (const [seg, esperado] of [
    [125, "2:05"],
    [5, "0:05"],
    [3600, "1:00:00"],
    [4761, "1:19:21"],
    [3661, "1:01:01"],
  ] as const) {
    const { tela, rede } = await linha(ponto({ videoDuracaoSeg: seg }));
    try {
      match(tela.texto(), new RegExp(esperado.replace(/:/g, ":")), `${seg}s saiu errado`);
    } finally {
      await tela.desmontar();
      rede.restaurar();
    }
  }
});

test("duração ausente ou zero não vira '0:00' na coluna", async () => {
  for (const seg of [null, 0, undefined] as const) {
    const { tela, rede } = await linha(ponto({ videoDuracaoSeg: seg }));
    try {
      doesNotMatch(tela.texto(), /\d+:\d\d/, `${seg} virou duração`);
    } finally {
      await tela.desmontar();
      rede.restaurar();
    }
  }
});

test("a seta conta o mesmo estado que o título — são o mesmo controle", async () => {
  // Só o botão do título tinha `aria-expanded`. Quem usa leitor de tela
  // apertava a SETA — que é o afordance, é por ela que se tenta primeiro — e
  // não ouvia nada mudar.
  const { tela, rede } = await linha(ponto());
  try {
    const seta = tela.exigir('button[aria-label="Abrir letra"]');
    equal(seta.getAttribute("aria-expanded"), "false");
    await tela.clicar(seta);
    equal(
      tela.exigir('button[aria-label="Fechar letra"]').getAttribute("aria-expanded"),
      "true",
      "a seta abriu a letra sem anunciar que abriu",
    );
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});

test("todo botão da linha é `type=button`", async () => {
  // Botão sem `type` dentro de `<form>` é `submit`. Hoje nenhuma tela põe a
  // linha num formulário, e é exatamente por isso que a armadilha fica: no dia
  // em que puser, favoritar passa a enviar o formulário e ninguém liga uma
  // coisa à outra.
  const { tela, rede } = await linha(ponto(), {
    onAdicionar: () => {},
    onSugerirAutor: () => {},
  });
  try {
    const semTipo = tela.todos("button").filter((b) => b.getAttribute("type") !== "button");
    equal(semTipo.length, 0, `sem type=button: ${semTipo.map((b) => b.getAttribute("aria-label"))}`);
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});

test("as ações de toque NÃO dependem de hover para existir", async () => {
  // Eram `opacity-0` reveladas por `group-hover`, e em tela de toque não existe
  // hover: sumiam, mas continuavam ocupando espaço e respondendo ao toque.
  const { tela, rede } = await linha(ponto(), {
    onAdicionar: () => {},
    onSugerirAutor: () => {},
  });
  try {
    for (const rotulo of [/Adicionar .* a um repertório/, /Sugerir o autor/, /Favoritar/]) {
      const botao = tela.todos("button").find((b) => rotulo.test(b.getAttribute("aria-label") ?? ""));
      ok(botao, `não achei o botão ${rotulo}`);
      const classe = botao.getAttribute("class") ?? "";
      ok(
        !classe.split(/\s+/).includes("opacity-0"),
        `${rotulo} some no celular: a classe esconde sem depender de hover`,
      );
    }
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});
