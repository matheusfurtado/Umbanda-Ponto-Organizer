/**
 * Curtir um ponto — sem depender de ter cópia do acervo.
 *
 * A curtida era coluna da linha do ponto, e a linha de um ponto curtido é a
 * CÓPIA pessoal (ADR 0005): curtir exigia ter cópia, e ter cópia era o mesmo
 * que ter copiado o acervo inteiro. O ADR 0009 desfaz o laço.
 *
 * A rota aceita o id da cópia OU o do canônico e guarda o canônico — quem
 * organizou o acervo vê ids próprios, quem não organizou vê os canônicos, e a
 * tela não precisa saber a diferença.
 */

import { chamarApi } from "@/api/cliente";

export const curtirPonto = (pontoId: string) =>
  chamarApi<void>(`/pontos/${encodeURIComponent(pontoId)}/curtir`, {
    method: "PUT",
  });

export const descurtirPonto = (pontoId: string) =>
  chamarApi<void>(`/pontos/${encodeURIComponent(pontoId)}/curtir`, {
    method: "DELETE",
  });
