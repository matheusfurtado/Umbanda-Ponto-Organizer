/**
 * O perfil — o único lugar onde a pessoa manda uma imagem.
 *
 * Mandar foto neste app foi uma decisão pesada: "pedir imagem a quem se
 * identifica como de Umbanda é pedir um rosto colado a uma convicção
 * religiosa". Ficou aberto, e o cuidado migrou para o servidor, que reencoda
 * tudo e joga fora o EXIF — a coordenada de GPS de uma foto de celular
 * publicaria onde fica o terreiro.
 *
 * Do lado da tela, o que precisa valer é: a recusa do servidor chega LEGÍVEL
 * (é ele que sabe o limite e os formatos), e desistir não deixa a tela travada.
 */

import { equal, match, ok } from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { act } from "react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { assentar, renderizar, type Tela } from "../../testes/renderizar.ts";
import { fingirRede } from "../../testes/rede.ts";
import { TelaPerfil } from "@/pages/TelaPerfil";
import { AuthProvider } from "@/auth/AuthContext";

beforeEach(() => localStorage.clear());

const EU = {
  id: "u1", email: "maria@exemplo.com", email_verificado: true,
  apelido: "pai-joao", admin: false, favoritos_publicos: false, foto: null,
};

const PERFIL = {
  apelido: "pai-joao", foto: null, souEu: true, euSigo: false,
  seguidores: 3, seguindo: 1, favoritosPublicos: false,
  giras: [], favoritos: [], enviados: [],
};

function servidor(opcoes: {
  perfil?: Record<string, unknown>;
  foto?: { status: number; corpo?: unknown } | "rede";
} = {}) {
  const chamadas: { url: string; metodo: string }[] = [];
  const rede = fingirRede((url, init) => {
    chamadas.push({ url, metodo: init?.method ?? "GET" });
    if (url.includes("/auth/eu")) return { corpo: EU };
    if (url.includes("/eu/foto")) {
      if (opcoes.foto === "rede") throw new TypeError("Failed to fetch");
      return opcoes.foto ?? { corpo: { foto: "/api/v1/perfis/pai-joao/foto?v=2" } };
    }
    if (url.includes("/perfis/")) return { corpo: { ...PERFIL, ...opcoes.perfil } };
    throw new Error(`chamada não prevista: ${init?.method ?? "GET"} ${url}`);
  });
  return { chamadas, rede };
}

async function abrir(opcoes: Parameters<typeof servidor>[0] = {}) {
  const s = servidor(opcoes);
  const { hook } = memoryLocation({ path: "/perfil/pai-joao" });
  const tela = await renderizar(
    <Router hook={hook}>
      <AuthProvider>
        <TelaPerfil />
      </AuthProvider>
    </Router>,
  );
  await assentar();
  return {
    tela,
    chamadas: s.chamadas,
    limpar: async () => {
      await tela.desmontar();
      s.rede.restaurar();
      localStorage.clear();
    },
  };
}

/**
 * Escolhe um arquivo no `<input type="file">`.
 *
 * `files` é somente-leitura no DOM, então o teste a define — é o mesmo que o
 * navegador faz quando a pessoa escolhe no seletor.
 */
async function escolherArquivo(tela: Tela, nome: string, tipo: string) {
  const input = tela.todos('input[type="file"]')[0] as HTMLInputElement;
  ok(input, "não achei o seletor de arquivo");
  const arquivo = new window.File(["conteudo"], nome, { type: tipo });
  Object.defineProperty(input, "files", { value: [arquivo], configurable: true });
  await act(async () => {
    input.dispatchEvent(new window.Event("change", { bubbles: true }));
  });
  await assentar();
  return input;
}

test("a recusa do servidor chega com as palavras DELE", async () => {
  // É o servidor que sabe o limite e os formatos aceitos. Traduzir aqui seria
  // duas verdades sobre a mesma regra — e este caminho passa por `multipart`,
  // que até há pouco lançava `Error` cru e perdia a mensagem inteira.
  const { tela, limpar } = await abrir({
    foto: { status: 415, corpo: { detail: "Formato não aceito: use JPEG, PNG ou WebP." } },
  });
  try {
    await escolherArquivo(tela, "gira.gif", "image/gif");
    const aviso = tela.todos('[role="alert"]').find((p) => /Formato/.test(p.textContent ?? ""));
    equal(aviso?.textContent, "Formato não aceito: use JPEG, PNG ou WebP.");
    ok(!/API 415/.test(tela.texto()), "vazou o status para quem está no terreiro");
  } finally {
    await limpar();
  }
});

test("imagem grande demais é dita, e não vira erro genérico", async () => {
  const { tela, limpar } = await abrir({
    foto: { status: 413, corpo: { detail: "Imagem muito grande. O limite é 5 MB." } },
  });
  try {
    await escolherArquivo(tela, "foto.jpg", "image/jpeg");
    match(tela.texto(), /O limite é 5 MB/);
  } finally {
    await limpar();
  }
});

test("sem rede, a falha é dita como falha de rede", async () => {
  // O `multipart` desvia do cliente compartilhado por causa do cabeçalho, e
  // por isso já lançou `TypeError` cru: `ehErroDeRede` respondia "não é rede"
  // para uma queda de rede.
  const { tela, limpar } = await abrir({ foto: "rede" });
  try {
    await escolherArquivo(tela, "foto.jpg", "image/jpeg");
    match(tela.texto(), /[Ss]em conex/);
  } finally {
    await limpar();
  }
});

/**
 * Espia o que o componente ESCREVE em `input.value`.
 *
 * A primeira versão deste teste afirmava `input.value === ""` — e o campo já
 * era `""`, então a asserção não media nada: mover a limpeza para depois do
 * `return` (o defeito) passava. Um seletor de arquivo não aceita `value`
 * arbitrário no navegador, então o jeito de medir é interceptar a escrita.
 */
function espiarValue(input: HTMLInputElement, atual: string): string[] {
  const escritas: string[] = [];
  Object.defineProperty(input, "value", {
    configurable: true,
    get: () => atual,
    set: (v: string) => {
      escritas.push(v);
    },
  });
  return escritas;
}

test("desistir do seletor limpa o campo, senão o mesmo arquivo não dispara nada", async () => {
  // "Limpa o input mesmo se a pessoa desistir: sem isto, escolher o MESMO
  // arquivo de novo não dispara evento nenhum e parece que travou."
  const { tela, chamadas, limpar } = await abrir();
  try {
    const input = tela.todos('input[type="file"]')[0] as HTMLInputElement;
    const escritas = espiarValue(input, "C:\\fakepath\\foto-antiga.jpg");
    Object.defineProperty(input, "files", { value: [], configurable: true });
    await act(async () => {
      input.dispatchEvent(new window.Event("change", { bubbles: true }));
    });
    await assentar();

    equal(chamadas.filter((c) => c.url.includes("/eu/foto")).length, 0, "enviou sem arquivo");
    ok(
      escritas.includes(""),
      "desistir não limpou o campo: escolher o MESMO arquivo de novo não " +
        "dispara evento, e a tela parece travada",
    );
  } finally {
    await limpar();
  }
});

test("o seletor é limpo DEPOIS de enviar, para dar para repetir", async () => {
  const { tela, chamadas, limpar } = await abrir();
  try {
    const input = await escolherArquivo(tela, "foto.jpg", "image/jpeg");
    equal(chamadas.filter((c) => c.url.includes("/eu/foto") && c.metodo === "PUT").length, 1);
    equal(input.value, "");
  } finally {
    await limpar();
  }
});

test("perfil que não existe é dito com as palavras do servidor", async () => {
  const rede = fingirRede((url) => {
    if (url.includes("/auth/eu")) return { corpo: EU };
    if (url.includes("/perfis/")) {
      return { status: 404, corpo: { detail: "Não achei esse perfil." } };
    }
    throw new Error(url);
  });
  const { hook } = memoryLocation({ path: "/perfil/ninguem" });
  const tela = await renderizar(
    <Router hook={hook}>
      <AuthProvider>
        <TelaPerfil />
      </AuthProvider>
    </Router>,
  );
  await assentar();
  try {
    match(tela.texto(), /Não achei esse perfil/);
    ok(!/API 404/.test(tela.texto()));
  } finally {
    await tela.desmontar();
    rede.restaurar();
  }
});
