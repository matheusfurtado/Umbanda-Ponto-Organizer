/**
 * Seguir um artista — o clique que muda antes da resposta.
 *
 * "`void promessa` num `onClick` engole falha de rede: o botão não muda, nada
 * aparece, e a pessoa não sabe se aconteceu." O botão é otimista de propósito,
 * e o que precisa estar preso é a VOLTA: se a chamada falhar, ele desfaz E diz
 * o que houve. Mostrar "Seguindo" para quem não está seguindo é o pior dos
 * mundos — a pessoa fecha o app achando que tem o artista na biblioteca.
 */

import { deepEqual, equal, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { BotaoSeguirArtista } from "@/componentes/BotaoSeguirArtista";
import { AuthProvider } from "@/auth/AuthContext";
import { EntitlementsProvider } from "@/billing/EntitlementsContext";

beforeEach(() => localStorage.clear());

async function abrir(
  seguindo: boolean | null,
  resposta: { status?: number; corpo?: unknown } = { status: 204 },
  /**
   * O plano de quem está olhando.
   *
   * Seguir artista entrou no plano pago em 03/09 (ADR 0012), então o botão só é
   * BOTÃO para quem tem o direito. Os cenários de clique abaixo passam um
   * assinante — é o único jeito de exercitar o clique — e o caso sem plano
   * ganhou teste próprio no fim do arquivo.
   */
  direitos: Record<string, unknown> = { plano: "mensal", seguirArtistas: true },
) {
  const mudancas: boolean[] = [];
  // Mutável: um teste precisa FALHAR e depois dar certo, para ver se a
  // mensagem velha some.
  let proxima = resposta;
  const rede = fingirRede((url) => {
    if (url.includes("/seguir")) return proxima;
    if (url.includes("/meus-direitos")) return { corpo: direitos };
    // Precisa vir uma sessão: o `EntitlementsProvider` só BUSCA os direitos de
    // quem está logado, e sem isto todo cenário caía em grátis — inclusive os
    // que testam o clique, que então não achavam botão nenhum.
    if (url.includes("/auth/eu")) {
      return { corpo: {
        id: "u1", email: "m@e.com", email_verificado: true,
        apelido: "maria", admin: false, favoritos_publicos: false, foto: null,
      } };
    }
    throw new Error(`chamada não prevista: ${url}`);
  });
  const tela = await renderizar(
    <AuthProvider>
      <EntitlementsProvider>
        <BotaoSeguirArtista
          artistaId="a1"
          seguindo={seguindo}
          onMudou={(s) => mudancas.push(s)}
        />
      </EntitlementsProvider>
    </AuthProvider>,
  );
  await assentar();
  // DUAS voltas, e não uma: a sessão chega na primeira, e é só então que o
  // provider vai buscar os direitos. Com uma volta só, todo cenário lia
  // "grátis" e os testes de clique não achavam botão nenhum.
  await assentar();
  return {
    tela,
    mudancas,
    rede,
    responderCom: (r: { status?: number; corpo?: unknown }) => { proxima = r; },
    limpar: async () => {
      await tela.desmontar();
      rede.restaurar();
    },
  };
}

const oBotao = (tela: Tela) => tela.achar("button");

/**
 * Os métodos das chamadas ao SEGUIR, e não de todas.
 *
 * Desde que o botão passou a ler os direitos (03/09), montá-lo dispara dois
 * `GET` — sessão e plano — antes de qualquer clique. Comparar a lista inteira
 * com `["PUT"]` passou a falhar por causa de ruído de provider, e afrouxar para
 * "contém PUT" perderia o que este trecho existe para provar: que seguir manda
 * **um** PUT, e desseguir manda **um** DELETE.
 */
const metodosDoSeguir = (rede: { chamadas: { url: string; metodo: string }[] }) =>
  rede.chamadas.filter((c) => c.url.includes("/seguir")).map((c) => c.metodo);

test("visitante não vê botão — vê o caminho de entrar", async () => {
  // `seguindo === null` é "não sei quem é você". Um botão que não pode
  // funcionar seria pior que a frase que explica por quê.
  const { tela, limpar } = await abrir(null);
  try {
    ok(tela.naoTem("button"), "ofereceu seguir a quem não tem conta");
    match(tela.texto(), /Entre/);
    // Com o MOTIVO junto: chegar numa tela de login sem uma palavra sobre o
    // que aconteceu é o beco que o convite existe para não ser.
    ok(
      tela.achar('a[href="/login?motivo=seguir-artista"]'),
      "a frase não leva a lugar nenhum",
    );
  } finally {
    await limpar();
  }
});

test("seguir muda o botão na hora, sem esperar a ida e volta", async () => {
  const { tela, mudancas, rede, limpar } = await abrir(false);
  try {
    match(oBotao(tela)!.textContent ?? "", /Seguir/);
    await tela.clicar("button");
    // A primeira mudança é o otimismo: ela sai antes de o servidor responder.
    deepEqual(mudancas, [true]);
    await assentar();
    deepEqual(mudancas, [true], "avisou duas vezes a mesma coisa");
    // E o SENTIDO chega ao servidor: seguir é PUT.
    deepEqual(metodosDoSeguir(rede), ["PUT"]);
  } finally {
    await limpar();
  }
});

test("deixar de seguir também é otimista, e no sentido certo", async () => {
  const { tela, mudancas, rede, limpar } = await abrir(true);
  try {
    match(oBotao(tela)!.textContent ?? "", /Seguindo/);
    await tela.clicar("button");
    await assentar();
    deepEqual(mudancas, [false]);
    deepEqual(metodosDoSeguir(rede), ["DELETE"]);
  } finally {
    await limpar();
  }
});

test("falhou: o botão VOLTA ao que era, e diz o que houve", async () => {
  // O rollback sozinho não basta: sem mensagem, o botão pisca e volta, e a
  // pessoa conclui que o clique não pegou.
  const { tela, mudancas, limpar } = await abrir(false, {
    status: 503, corpo: { detail: "O servidor de artistas está fora do ar." },
  });
  try {
    await tela.clicar("button");
    await assentar();
    deepEqual(mudancas, [true, false], "não desfez o otimismo depois da falha");
    match(tela.texto(), /fora do ar/);
    ok(tela.achar('[role="alert"]'), "o erro não é anunciado a leitor de tela");
  } finally {
    await limpar();
  }
});

test("tentar de novo apaga a mensagem da tentativa anterior", async () => {
  // Erro que sobrevive à tentativa seguinte é pior que erro nenhum: o botão
  // diz "Seguindo" e, logo abaixo, uma linha vermelha diz que não deu.
  const { tela, responderCom, limpar } = await abrir(false, {
    status: 503, corpo: { detail: "O servidor de artistas está fora do ar." },
  });
  try {
    await tela.clicar("button");
    await assentar();
    match(tela.texto(), /fora do ar/);

    responderCom({ status: 204 });
    await tela.clicar("button");
    await assentar();
    ok(
      !/fora do ar/.test(tela.texto()),
      `a mensagem da falha anterior ficou: ${tela.texto()}`,
    );
  } finally {
    await limpar();
  }
});

test("o estado de seguir é anunciado, e não só desenhado", async () => {
  // Um ícone de check trocando por um `+` não diz nada a quem não vê a tela.
  const { tela, limpar } = await abrir(true);
  try {
    ok(oBotao(tela)!.getAttribute("aria-pressed") === "true");
  } finally {
    await limpar();
  }
});

test("no cartão do diretório o convite cabe: vira botão, não parágrafo", async () => {
  // Na página do artista o convite é um parágrafo inteiro — ali há espaço e a
  // ação é a principal. Num cartão de lista, o mesmo parágrafo empurraria o
  // nome do terreiro para fora.
  const { tela, limpar } = await abrir(null);
  try {
    await tela.reRenderizar(
      <AuthProvider>
        <EntitlementsProvider>
          <BotaoSeguirArtista artistaId="a1" seguindo={null} compacto onMudou={() => {}} />
        </EntitlementsProvider>
      </AuthProvider>,
    );
    const convite = tela.exigir('a[href="/login?motivo=seguir-artista"]');
    match(convite.textContent ?? "", /Seguir/);
    equal(convite.getAttribute("aria-label"), "Entrar para seguir este artista");
    ok(tela.naoTem("p"), "sobrou o parágrafo da versão grande dentro do cartão");
  } finally {
    await limpar();
  }
});


test("logado e SEM plano: o botão vira convite para assinar, não erro", async () => {
  // O terceiro estado. Sem ele, quem tem conta e não assina clicaria "Seguir",
  // levaria 402 do servidor e leria uma mensagem de erro onde devia ler um
  // convite — a pior forma de descobrir que algo é pago.
  const { tela, limpar } = await abrir(false, { status: 204 },
    { plano: "gratis", seguirArtistas: false });
  try {
    ok(tela.naoTem("button"), "ofereceu um botão que o servidor vai recusar");
    const convite = tela.todos("a").find((a) => a.getAttribute("href") === "/planos");
    ok(convite, "não há caminho para assinar");
    // E a descoberta continua dita como aberta: fechar a página do artista é o
    // que o ADR 0007 escolheu NÃO fazer, e a frase é o que impede alguém de
    // achar que fechou.
    match(tela.texto(), /p[áa]gina dele.*abert|abert.*p[áa]gina/i);
  } finally {
    await limpar();
  }
});
