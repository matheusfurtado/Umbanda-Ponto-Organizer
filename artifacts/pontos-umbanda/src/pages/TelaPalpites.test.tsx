/**
 * "Outros palpites" — a tela que o modelo do servidor prometia desde sempre.
 *
 * `video_candidato` guarda os candidatos que não venceram, e o docstring dele
 * diz que são "o que a tela de correção oferece". A tela não existia: 1.538
 * candidatas paradas, e a fila de casamentos só sabe dizer sim ou não ao
 * primeiro — recusar deixa o ponto sem link mesmo quando o certo está uma
 * posição abaixo.
 */

import { deepEqual, match, ok } from "node:assert/strict";
import { test } from "node:test";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaPalpites } from "@/pages/TelaPalpites";

const palpite = (id: number, videoId: string, canal: string, nota: number) => ({
  id, videoId, titulo: `Vídeo ${videoId}`, canal, nota,
  url: `https://www.youtube.com/watch?v=${videoId}`,
});

const PONTO = {
  id: "p1", titulo: "Ponto de Oxalá", letra: "Verso que decide a escolha",
  orixa: "Oxalá", subcategoria: "Louvação", noApp: false,
  palpites: [
    palpite(1, "aaa", "Canal Qualquer", 0.62),
    palpite(2, "bbb", "Juliana D Passos", 0.55),
  ],
};

function servidor(voltou = false, itens = [PONTO]) {
  const escolhidos: number[] = [];
  const pedidos: string[] = [];
  const rede = fingirRede((url, init) => {
    if (url.includes("/palpites/quantos")) {
      return { corpo: { total: itens.length, no_app: 8 } };
    }
    const escolha = /\/admin\/palpites\/(\d+)\/escolher$/.exec(url);
    if (escolha) {
      escolhidos.push(Number(escolha[1]));
      return {
        corpo: {
          pontoId: "p1",
          artistaId: voltou ? "juliana" : null,
          voltouAoApp: voltou,
        },
      };
    }
    if (url.includes("/admin/palpites")) {
      pedidos.push(url);
      const desde = Number(new URL(url, "http://t").searchParams.get("desde") ?? 0);
      const vivos = itens.filter((p) => !escolhidos.some((e) =>
        p.palpites.some((c) => c.id === e)));
      return { corpo: vivos.slice(desde, desde + 20) };
    }
    throw new Error(`chamada não prevista: ${url} (${init?.method})`);
  });
  return { rede, escolhidos, pedidos };
}

async function abrir(voltou = false, itens = [PONTO]) {
  const { rede, escolhidos, pedidos } = servidor(voltou, itens);
  const tela = await renderizar(<TelaPalpites />);
  await assentar();
  return {
    tela, escolhidos, pedidos,
    limpar: async () => { await tela.desmontar(); rede.restaurar(); },
  };
}

const botoes = (tela: Tela, texto: RegExp) =>
  tela.todos("button").filter((b) => texto.test(b.textContent ?? ""));

test("a letra fica ao lado dos palpites, e o lugar do ponto em destaque", async () => {
  // Quem escolhe compara o VERSO com o título do vídeo. Se a letra exigir outra
  // tela, a escolha vira sorteio — e errar aqui é pôr o ponto de uma entidade
  // no vídeo de outra.
  const { tela, limpar } = await abrir();
  try {
    match(tela.texto(), /Oxalá · Louvação/);
    match(tela.texto(), /Verso que decide a escolha/);
    deepEqual(botoes(tela, /É este/).length, 2, "sem um botão por candidato");
    ok(
      tela.todos("a").some((a) => a.getAttribute("href")?.includes("aaa")),
      "sem link para abrir o vídeo, a escolha é às cegas",
    );
  } finally {
    await limpar();
  }
});

test("escolher chama a rota daquele palpite, e não a do primeiro", async () => {
  const { tela, escolhidos, limpar } = await abrir();
  try {
    await tela.clicar(botoes(tela, /É este/)[1]);
    await assentar();
    deepEqual(escolhidos, [2], "escolheu o candidato errado");
  } finally {
    await limpar();
  }
});

test("quando o canal é de artista curado, a tela diz que o ponto voltou", async () => {
  // A diferença não é adivinhável de fora: a regra do acervo é "só fica o que
  // tem gravação de artista conferida", então escolher um vídeo de canal não
  // curado dá o link e mantém o ponto fora.
  const { tela, limpar } = await abrir(true);
  try {
    await tela.clicar(botoes(tela, /É este/)[0]);
    await assentar();
    match(tela.texto(), /voltou ao app/i);
  } finally {
    await limpar();
  }
});

test("canal não curado: a tela diz que o ponto SEGUE fora, e por quê", async () => {
  const { tela, limpar } = await abrir(false);
  try {
    await tela.clicar(botoes(tela, /É este/)[0]);
    await assentar();
    match(tela.texto(), /segue fora do app/i);
    match(tela.texto(), /artista curado/i);
  } finally {
    await limpar();
  }
});

test("o ponto decidido sai da fila na hora, e o outro fica", async () => {
  // DOIS pontos de propósito. Com um só, decidir esvazia a lista e a busca
  // automática limpa a tela de qualquer jeito — o teste passava mesmo sem a
  // remoção imediata, e a mutação mostrou.
  const outro = {
    ...PONTO, id: "p2", titulo: "Ponto de Ogum",
    palpites: [palpite(9, "zzz", "Canal", 0.4)],
  };
  const { tela, limpar } = await abrir(false, [PONTO, outro]);
  try {
    await tela.clicar(botoes(tela, /É este/)[0]);
    await assentar();
    ok(!/Ponto de Oxalá/.test(tela.texto()), "o ponto decidido continuou na tela");
    match(tela.texto(), /Ponto de Ogum/);
  } finally {
    await limpar();
  }
});

test("fila vazia diz isso, e não fica carregando", async () => {
  const { tela, limpar } = await abrir(false, []);
  try {
    match(tela.texto(), /Nenhum palpite esperando escolha/);
    ok(tela.naoTem('[aria-busy="true"]'), "ficou carregando sobre fila vazia");
  } finally {
    await limpar();
  }
});

test("pede pelo deslocamento, não por número de página", async () => {
  // Cada escolha tira o ponto da fila, então ela encolhe enquanto se trabalha
  // nela: `desde = quantos estão na tela` continua certo depois de qualquer
  // número de decisões.
  const muitos = Array.from({ length: 20 }, (_, i) => ({
    ...PONTO, id: `p${i}`, palpites: [palpite(100 + i, `v${i}`, "Canal", 0.5)],
  }));
  const { tela, pedidos, limpar } = await abrir(false, muitos);
  try {
    deepEqual(pedidos.length, 1);
    ok(pedidos[0].includes("desde=0"), pedidos[0]);
    const ver = botoes(tela, /Ver mais/)[0];
    ok(ver, "sem 'Ver mais' não se passa dos 20 primeiros");
    await tela.clicar(ver);
    await assentar();
    ok(pedidos[1]?.includes("desde=20"), `segundo pedido: ${pedidos[1]}`);
  } finally {
    await limpar();
  }
});
