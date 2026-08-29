/**
 * O harness testa a si mesmo antes de eu confiar nele.
 *
 * Um renderizador que "passa" sem rodar efeito é pior que nenhum: ele dá
 * confiança onde não há cobertura. Estes quatro casos são as propriedades das
 * quais tudo o mais depende.
 */

import { equal, match, ok } from "node:assert/strict";
import { test } from "node:test";
import { useEffect, useState } from "react";
import { renderizar } from "../testes/renderizar.ts";

test("o JSX chega ao teste — o que o Node sozinho não faz", async () => {
  const tela = await renderizar(<p className="oi">olá</p>);
  equal(tela.exigir("p.oi").textContent, "olá");
  await tela.desmontar();
});

test("o efeito RODA antes do assert", async () => {
  function Efeito() {
    const [texto, setTexto] = useState("antes");
    useEffect(() => setTexto("depois"), []);
    return <span>{texto}</span>;
  }
  const tela = await renderizar(<Efeito />);
  equal(tela.texto(), "depois", "o assert leu o primeiro quadro, não a tela");
  await tela.desmontar();
});

test("clicar muda a tela, e o clique borbulha até o React", async () => {
  function Contador() {
    const [n, setN] = useState(0);
    return (
      <div>
        <button type="button" onClick={() => setN((v) => v + 1)}>
          <span>mais</span>
        </button>
        <output>{n}</output>
      </div>
    );
  }
  const tela = await renderizar(<Contador />);
  // Clica no `span` DENTRO do botão: se o evento não borbulhasse, o teste
  // passaria a mentir sobre todo componente com ícone dentro de botão.
  await tela.clicar("button span");
  equal(tela.exigir("output").textContent, "1");
  await tela.desmontar();
});

test("re-renderizar troca a prop SEM remontar — é o cenário do #14", async () => {
  const montagens: string[] = [];
  function Tela({ id }: { id: string }) {
    const [tocado, setTocado] = useState(false);
    useEffect(() => {
      montagens.push(id);
    }, [id]);
    return (
      <button type="button" onClick={() => setTocado(true)}>
        {id}
        {tocado ? " tocado" : ""}
      </button>
    );
  }
  const tela = await renderizar(<Tela id="a" />);
  await tela.clicar("button");
  match(tela.texto(), /tocado/);
  await tela.reRenderizar(<Tela id="b" />);
  // O estado SOBREVIVE à troca de prop — é exatamente por isso que o filtro do
  // `TelaArtista` atravessava de um artista para o outro.
  match(tela.texto(), /b tocado/, "o componente remontou; o cenário do #14 não seria reproduzível");
  ok(montagens.length === 2 && montagens[1] === "b");
  await tela.desmontar();
});

test("rede de verdade é barrada por padrão", async () => {
  await fetch("https://exemplo.invalido/x").then(
    () => {
      throw new Error("o teste alcançou a rede");
    },
    (e: Error) => match(e.message, /rede de verdade/),
  );
});
