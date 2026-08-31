/**
 * A capa de um repertório.
 *
 * Playlist não tem cor no banco, e a cor sai do NOME — a mesma playlist tem
 * sempre a mesma capa, e duas diferentes quase nunca colidem. A regra mora em
 * `lib/matiz.ts`, compartilhada com a vitrine de artistas.
 */

import { ListMusic } from "lucide-react";
import { matiz } from "@/lib/matiz";

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
