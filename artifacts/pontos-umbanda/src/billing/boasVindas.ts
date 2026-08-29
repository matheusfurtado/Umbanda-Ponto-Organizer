/**
 * O que a tela de confirmação pode dizer sobre o plano — e o que ela não pode.
 *
 * Confirmar o e-mail concede o teste de 15 dias, MAS nem sempre: `conceder`
 * devolve nada quando aquela caixa de entrada já usou o teste — quem apagou a
 * conta e criou outra, ou quem usou `fulano+2@` depois de `fulano@` (o
 * registro é por caixa, não por endereço). A rota responde igual nos dois
 * casos, e a tela dizia "Seus 15 dias de teste começam agora" para todo mundo.
 *
 * Quem caía nisso entrava no plano grátis — sem hierarquia, sem link de vídeo,
 * sem gira — logo depois de ler que tinha 15 dias. E como a frase é sobre o
 * que a pessoa vai encontrar, o desmentido chega na primeira tela, sem nada
 * ligando uma coisa à outra: parece defeito do app, não regra do produto.
 *
 * Está aqui fora da tela pelo mesmo motivo do `podeAssinar`: a regra é uma
 * decisão, e decisão dentro de JSX não tem como ser exercitada.
 *
 * `null` é uma resposta legítima e é o padrão: **sem saber o plano, a tela não
 * afirma nada sobre plano.** A confirmação da conta continua aparecendo — é o
 * que esta tela existe para dizer — e a frase sobre o teste some. Inventar
 * "15 dias" para preencher o silêncio é como o defeito nasceu.
 */

import type { Entitlements } from "@/lib/apiBilling";

export type BoasVindas =
  | { tipo: "teste"; dias: number }
  | { tipo: "pago" }
  | { tipo: "gratis" }
  | null;

/** Quantos dias o teste dá, para quando o servidor não mandar a conta. */
export const DIAS_DE_TESTE = 15;

export function boasVindas(ent: Entitlements | null | undefined): BoasVindas {
  if (!ent) return null;
  if (ent.plano === "teste") {
    // `diasRestantes` pode faltar; 15 é o certo no minuto em que o teste
    // começa, que é exatamente quando esta tela aparece. Zero NÃO é o certo:
    // "seus 0 dias de teste começam agora" é pior que não dizer nada.
    const dias = ent.diasRestantes ?? DIAS_DE_TESTE;
    return { tipo: "teste", dias: dias > 0 ? dias : DIAS_DE_TESTE };
  }
  if (ent.plano === "gratis") return { tipo: "gratis" };
  // Qualquer outro plano é plano pago. Não enumeramos os pagos aqui: plano
  // novo no servidor não pode virar promessa de teste no front.
  return { tipo: "pago" };
}
