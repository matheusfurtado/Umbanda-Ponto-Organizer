/**
 * A capa de um repertório.
 *
 * Gira não tem cor no banco — e pedir para a pessoa escolher uma no momento de
 * criar seria atrito no pior lugar: ela quer montar a gira, não decorar. Então
 * a cor sai do NOME, de forma estável: a mesma gira tem sempre a mesma capa, e
 * duas giras diferentes quase nunca colidem.
 *
 * Estável importa. Cor sorteada a cada render faria a lista piscar e destruiria
 * a memória visual que é justamente o que a capa existe para criar.
 */

import { ListMusic } from "lucide-react";

function matiz(nome: string): number {
  let h = 0;
  for (let i = 0; i < nome.length; i++) h = (h * 31 + nome.charCodeAt(i)) % 360;
  return h;
}

export function CapaGira({ nome, tamanho = "md" }: { nome: string; tamanho?: "sm" | "md" }) {
  const h = matiz(nome || "gira");
  const medidas = tamanho === "sm" ? "h-12 w-12 rounded-lg" : "h-full w-full rounded-xl";

  return (
    <div
      className={`flex items-center justify-center shadow-lg ${medidas}`}
      style={{
        background: `linear-gradient(145deg, hsl(${h} 55% 42%), hsl(${(h + 40) % 360} 50% 26%))`,
      }}
      aria-hidden
    >
      <ListMusic className={tamanho === "sm" ? "h-5 w-5" : "h-12 w-12"} color="rgba(255,255,255,.85)" />
    </div>
  );
}
