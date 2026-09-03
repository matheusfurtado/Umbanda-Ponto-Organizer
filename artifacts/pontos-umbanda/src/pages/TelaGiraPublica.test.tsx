/**
 * A gira aberta por link — a tela por onde o app circula.
 *
 * O canal deste produto é o link colado no grupo do terreiro, e duas portas
 * levam à mesma tela: `/gira/:id`, da vitrine, e `/g/:token`, do link que o
 * dono mandou. Quem abre vê a gira de outra pessoa montada — seções, ordem e
 * duração — e é o único lugar do app onde alguém entende o que o plano faz
 * antes de alguém lhe dizer.
 *
 * ## O que mudou em 03/09, e por que os cenários daqui mudaram junto
 *
 * - **O vídeo saiu do portão** (ADR 0002). Este arquivo prendia que "sem plano
 *   o link do vídeo não existe na tela"; virou o contrário no mesmo dia, e o
 *   teste está invertido abaixo.
 * - **A tela pede conta** — conta, nunca plano. A barreira é o `RotaProtegida`
 *   das duas rotas em `App.tsx`, e não uma regra desta tela.
 * - **A tela lê direitos**, por causa do `ConviteParaAssinar` do rodapé. Por
 *   isso todo cenário monta dentro do `EntitlementsProvider` — que só busca o
 *   plano quando há sessão, logo precisa do `AuthProvider` por fora.
 */

import { deepEqual, equal, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { act } from "react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaGiraPublica } from "@/pages/TelaGiraPublica";
import { AuthProvider } from "@/auth/AuthContext";
import { EntitlementsProvider } from "@/billing/EntitlementsContext";

beforeEach(() => localStorage.clear());

const EU = {
  id: "u1", email: "m@e.com", email_verificado: true,
  apelido: "quem-olha", admin: false, favoritos_publicos: false, foto: null,
};

/**
 * Os direitos como o servidor os manda, e não um apelido.
 *
 * O `ConviteParaAssinar` só some quando `repertorios` E `seguirArtistas` são
 * verdadeiros — um assinante escrito pela metade continuaria sendo convidado a
 * assinar, e o teste passaria medindo o cenário errado.
 */
const GRATIS = {
  plano: "gratis", acervoOrganizado: false, repertorios: false,
  sync: false, seguirArtistas: false,
};
const ASSINANTE = {
  plano: "mensal", acervoOrganizado: true, repertorios: true,
  sync: true, seguirArtistas: true,
};

function item(pontoId: string, titulo: string | null, extra: Record<string, unknown> = {}) {
  return {
    pontoId, titulo, ordem: 0, secao: null, autor: null,
    videoUrl: null, videoStatus: null, videoCanal: null, videoDuracaoSeg: null,
    ...extra,
  };
}

const GIRA = {
  id: "g1", nome: "Gira de sexta", publico: true, de: "Terreiro de Ogum",
  itens: [
    item("p1", "Ogum de Lei"),
    item("p2", "Ponto de Oxum", { secao: "Louvação", videoDuracaoSeg: 4761 }),
  ],
};

/** A mesma gira, com vídeo no primeiro ponto e nenhum no segundo. */
const GIRA_COM_VIDEO = {
  ...GIRA,
  itens: [
    item("p1", "Ogum de Lei", { videoUrl: "https://youtu.be/x", videoStatus: "encontrado" }),
    item("p2", "Ponto de Oxum", { secao: "Louvação", videoDuracaoSeg: 4761 }),
  ],
};

type Resposta = { status?: number; corpo?: unknown };

function servidor(
  giras: Record<string, Resposta>,
  logado: boolean,
  direitos: Record<string, unknown>,
  segurar?: { id: string; soltar: () => void },
) {
  const rede = fingirRede(async (url) => {
    if (url.includes("/auth/eu")) return logado ? { corpo: EU } : { status: 401, corpo: {} };
    // Desde 03/09 a tela lê o plano (o `ConviteParaAssinar` do rodapé). Sem
    // esta rota o dublê estoura em "chamada não prevista" em todo cenário.
    if (url.includes("/meus-direitos")) return { corpo: direitos };
    // O `BotaoGuardar` pergunta a estante assim que há conta — não é o assunto
    // de nenhum teste aqui, e responder vazio é o cenário de quem nunca guardou.
    if (url.includes("/eu/biblioteca")) return { corpo: [] };
    // As duas portas batem em endereços diferentes: a chave é o id na vitrine e
    // o token no link compartilhado.
    const m = url.match(/\/repertorios\/(?:publicos|por-link)\/([^/?]+)/);
    if (m) {
      // Segura a resposta desta gira até o teste soltar. É o que torna
      // observável a janela em que a tela ainda não tem a nova — sem isso,
      // tudo chega dentro do mesmo `assentar` e o defeito não aparece.
      if (segurar && m[1] === segurar.id) {
        await new Promise<void>((resolver) => {
          segurar.soltar = resolver;
        });
      }
      return giras[m[1]] ?? { status: 404, corpo: { detail: "não existe" } };
    }
    throw new Error(`chamada não prevista: ${url}`);
  });
  return { rede };
}

async function abrir({
  chave = "g1",
  caminho,
  giras = { g1: { corpo: GIRA } },
  logado = true,
  direitos = GRATIS,
  segurar,
}: {
  /** O id na vitrine ou o token do link — é a chave do mapa `giras`. */
  chave?: string;
  /** Por onde se entra. Padrão: a vitrine (`/gira/:id`). */
  caminho?: string;
  giras?: Record<string, Resposta>;
  /**
   * Padrão LOGADO: desde 03/09 as duas rotas são `RotaProtegida`, então quem
   * chega aqui sem conta não existe mais no app. O que ainda se testa sem
   * conta é o guarda de dentro da tela (denunciar).
   */
  logado?: boolean;
  /** O plano de quem está olhando — escrito no cenário porque a tela o lê. */
  direitos?: Record<string, unknown>;
  segurar?: { id: string; soltar: () => void };
} = {}) {
  const s = servidor(giras, logado, direitos, segurar);
  const { hook, navigate } = memoryLocation({ path: caminho ?? `/gira/${chave}`, record: true });
  const tela = await renderizar(
    <Router hook={hook}>
      <AuthProvider>
        <EntitlementsProvider>
          <TelaGiraPublica />
        </EntitlementsProvider>
      </AuthProvider>
    </Router>,
  );
  await assentar();
  // DUAS voltas, e não uma: a sessão chega na primeira, e é só então que o
  // provider vai buscar os direitos. Com uma volta só, o cenário do assinante
  // ainda lia "grátis" e a faixa de convite aparecia para quem já paga.
  await assentar();
  return {
    tela,
    navigate,
    // O clique no vídeo sai por `navigator.sendBeacon`, não por `fetch` — o
    // dublê registra os dois no MESMO `chamadas`, e é lá que se confere.
    chamadas: s.rede.chamadas,
    limpar: async () => {
      await tela.desmontar();
      s.rede.restaurar();
      localStorage.clear();
    },
  };
}

/** Os títulos das linhas da gira, na ordem em que aparecem. */
const titulos = (tela: Tela) =>
  tela.todos("span.truncate.text-sm").map((s) => s.textContent?.trim());

test("a gira de outra pessoa aparece inteira: nome, quem montou e o tamanho", async () => {
  // Era "abre sem conta — é assim que o app circula". Até 03/09 esta era a
  // única tela aberta a anônimo, pelo mesmo motivo de sempre: o link no grupo
  // do terreiro. Ele decidiu o contrário nesse dia — *"acho que o link a pessoa
  // precisa estar logada também"* — e a barreira virou o `RotaProtegida` das
  // duas rotas, em `App.tsx`. A barreira é CONTA, nunca plano, e é isso que
  // este cenário prende: quem tem conta e não assina vê a gira inteira.
  const { tela, limpar } = await abrir({ logado: true, direitos: GRATIS });
  try {
    match(tela.texto(), /Gira de sexta/);
    match(tela.texto(), /Terreiro de Ogum/);
    match(tela.texto(), /2 pontos/);
  } finally {
    await limpar();
  }
});

test("sem plano, o link do vídeo APARECE — ele saiu do portão", async () => {
  // INVERTIDO em 03/09, e de propósito. Este teste prendia o contrário ("sem
  // plano o link simplesmente não existe na tela"), e o contrário virou a regra
  // antiga: o ADR 0002 tirou o vídeo do que se cobra — *"acesso ao vídeo é só
  // pra quem é premium? isso não faz sentido"*. O portão protegia dez links de
  // 1.134; os outros já saíam de graça pela página de quem gravou.
  //
  // A outra metade do teste velho continua valendo e continua aqui: a tela
  // mostra o que o SERVIDOR mandou e não inventa link para o ponto sem vídeo.
  const { tela, limpar } = await abrir({
    giras: { g1: { corpo: GIRA_COM_VIDEO } },
    logado: true,
    direitos: GRATIS,
  });
  try {
    const link = tela.todos("a").find((a) => a.getAttribute("href") === "https://youtu.be/x");
    ok(link, "o link do vídeo sumiu para quem não assina — o portão voltou");
    equal(
      tela.todos("a[href*='youtu']").length,
      1,
      "apareceu link no ponto que não tem vídeo — a tela inventou o endereço",
    );
    // E a gira continua útil: a sequência é o que a pessoa veio ver.
    deepEqual(titulos(tela), ["Ogum de Lei", "Ponto de Oxum"]);
  } finally {
    await limpar();
  }
});

test("o clique no vídeo é contado como vindo da gira", async () => {
  // Com plano — o par do teste acima. O link é o mesmo para os dois, e o que
  // se prende aqui é a contagem: é ela que o projeto entrega aos artistas como
  // valor, e ela precisa dizer de ONDE partiu o clique.
  const { tela, chamadas, limpar } = await abrir({
    giras: { g1: { corpo: GIRA_COM_VIDEO } },
    logado: true,
    direitos: ASSINANTE,
  });
  try {
    const link = tela.todos("a").find((a) => a.getAttribute("href") === "https://youtu.be/x");
    ok(link, "o link não apareceu para quem tem plano");
    await tela.clicar(link);
    await assentar();
    const cliques = chamadas.filter((c) => c.url.includes("/clique"));
    equal(cliques.length, 1, `o clique na gira não foi contado: ${JSON.stringify(chamadas)}`);
    match(cliques[0].url, /origem=gira/);
  } finally {
    await limpar();
  }
});

test("abre também pela segunda porta: o link compartilhado", async () => {
  // A rota `/g/:token`, de 03/09. O token NÃO é o id da gira: é segredo
  // próprio, revogável, e vai para outro endereço no servidor. Sem este teste,
  // mexer no `useRoute("/g/:token")` deixaria a tela em carregamento eterno
  // para quem clicou no link que recebeu — e a suíte seguiria verde, porque
  // todo o resto entra pela vitrine.
  const { tela, chamadas, limpar } = await abrir({
    caminho: "/g/tok-secreto",
    giras: { "tok-secreto": { corpo: GIRA } },
  });
  try {
    match(tela.texto(), /Gira de sexta/);
    ok(
      chamadas.some((c) => c.url.includes("/por-link/tok-secreto")),
      `o token não foi pelo endereço do link: ${JSON.stringify(chamadas)}`,
    );
    ok(
      !chamadas.some((c) => c.url.includes("/publicos/")),
      "o token foi perguntado como id da vitrine — a gira que só abre por link " +
        "viraria achável por quem tentasse o endereço",
    );
  } finally {
    await limpar();
  }
});

test("ponto que saiu do acervo é dito, e não vira linha em branco", async () => {
  // Uma gira publicada guarda ids; o ponto pode ter sido retirado depois.
  const comBuraco = { ...GIRA, itens: [item("p9", null)] };
  const { tela, limpar } = await abrir({ giras: { g1: { corpo: comBuraco } } });
  try {
    match(tela.texto(), /ponto removido do acervo/);
  } finally {
    await limpar();
  }
});

test("a duração de mais de uma hora não vira '79:21'", async () => {
  const { tela, limpar } = await abrir();
  try {
    match(tela.texto(), /1:19:21/);
  } finally {
    await limpar();
  }
});

test("denunciar só aparece para quem tem conta", async () => {
  // "Denúncia anônima não tem como ser contida."
  const anonima = await abrir({ logado: false });
  try {
    ok(!/Denunciar/.test(anonima.tela.texto()), "ofereceu denúncia a quem não tem conta");
  } finally {
    await anonima.limpar();
  }

  const logada = await abrir({ logado: true });
  try {
    match(logada.tela.texto(), /Denunciar/);
  } finally {
    await logada.limpar();
  }
});

test("o convite para assinar fica no fim — e some para quem já assina", async () => {
  // O convite entrou nesta tela em 03/09, e mora no RODAPÉ de propósito: quem
  // chegou até aqui acabou de ver a gira de outra pessoa montada, com seção,
  // ordem e duração. No topo ele venderia a ferramenta para quem ainda não viu
  // o que ela produz.
  const semPlano = await abrir({ logado: true, direitos: GRATIS });
  try {
    match(semPlano.tela.texto(), /Monte a sua/);
    ok(
      semPlano.tela.todos("a").some((a) => a.getAttribute("href") === "/planos"),
      "o convite não leva a lugar nenhum",
    );
  } finally {
    await semPlano.limpar();
  }

  // O defeito mais comum deste tipo de faixa: ela fica na tela de quem já
  // comprou. Aqui isso apareceria justo na tela que mais circula.
  const assinante = await abrir({ logado: true, direitos: ASSINANTE });
  try {
    ok(
      !/Monte a sua/.test(assinante.tela.texto()),
      "convidou a assinar quem já assina",
    );
  } finally {
    await assinante.limpar();
  }
});

test("gira que não existe explica e oferece a vitrine", async () => {
  const { tela, limpar } = await abrir({ chave: "fantasma", giras: {} });
  try {
    match(tela.texto(), /não existe/i);
    ok(tela.todos("a").some((a) => a.getAttribute("href") === "/giras-publicas"));
  } finally {
    await limpar();
  }
});

test("trocar de gira não deixa a anterior na tela", async () => {
  // O `Route path="/gira/:id"` não remonta quando só o parâmetro muda — é o
  // mesmo desenho do `TelaArtista`. Sem zerar, a gira anterior fica visível
  // sob a URL da nova.
  const outra = { ...GIRA, id: "g2", nome: "Festa de Exu", de: "Casa da Mata" };
  const { tela, navigate, limpar } = await abrir({
    giras: { g1: { corpo: GIRA }, g2: { corpo: outra } },
  });
  try {
    match(tela.texto(), /Gira de sexta/);
    await act(async () => {
      navigate("/gira/g2");
    });
    await assentar();
    match(tela.texto(), /Festa de Exu/);
    ok(!tela.texto().includes("Gira de sexta"), "a gira anterior sobreviveu à troca");
  } finally {
    await limpar();
  }
});


test("enquanto a nova não chega, a gira ANTERIOR sai da tela", async () => {
  // A mutação mostrou que o teste de troca acima não distinguia nada: sem
  // segurar a resposta, a gira nova chega no mesmo `assentar` e a janela do
  // defeito nunca existe. Aqui a segunda resposta fica presa, e o que se vê é
  // exatamente o que a pessoa veria.
  const outra = { ...GIRA, id: "g2", nome: "Festa de Exu" };
  const freio = { id: "g2", soltar: () => {} };
  const { tela, navigate, limpar } = await abrir({
    giras: { g1: { corpo: GIRA }, g2: { corpo: outra } },
    segurar: freio,
  });
  try {
    match(tela.texto(), /Gira de sexta/);
    await act(async () => {
      navigate("/gira/g2");
    });
    await assentar();

    ok(
      !tela.texto().includes("Gira de sexta"),
      "a gira anterior ficou na tela sob a URL da nova — quem compartilhou o " +
        "link de uma vê a outra",
    );
    ok(tela.achar('[aria-busy="true"]'), "não mostrou que está carregando");

    await act(async () => {
      freio.soltar();
      await new Promise((r) => setTimeout(r, 0));
    });
    match(tela.texto(), /Festa de Exu/);
  } finally {
    await limpar();
  }
});

test("a resposta atrasada da primeira gira não escreve na tela da segunda", async () => {
  const outra = { ...GIRA, id: "g2", nome: "Festa de Exu" };
  const freio = { id: "g1", soltar: () => {} };
  const { tela, navigate, limpar } = await abrir({
    giras: { g1: { corpo: GIRA }, g2: { corpo: outra } },
    segurar: freio,
  });
  try {
    // A primeira ainda está presa; troca para a segunda, que chega logo.
    await act(async () => {
      navigate("/gira/g2");
    });
    await assentar();
    match(tela.texto(), /Festa de Exu/);

    // AGORA a primeira responde, atrasada.
    await act(async () => {
      freio.soltar();
      await new Promise((r) => setTimeout(r, 0));
    });
    match(tela.texto(), /Festa de Exu/, "a resposta velha venceu a nova");
    ok(!tela.texto().includes("Gira de sexta"), "a gira antiga apareceu sob a URL da nova");
  } finally {
    await limpar();
  }
});
