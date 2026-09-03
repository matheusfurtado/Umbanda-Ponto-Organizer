/**
 * O convite para entrar, para quem está sem conta.
 *
 * Pedido dele: *"sempre que um usuário estiver deslogado faça campanha e motive
 * ele de fazer login"*.
 *
 * ## O texto promete só o que a conta realmente destrava
 *
 * Curtir, guardar na estante e enviar ponto exigem CONTA — não plano. Foi
 * conferido item a item na navegação antes de escrever a frase. Prometer o que
 * é do plano pago aqui seria vender o que a conta não entrega, e a pessoa
 * descobriria depois de se cadastrar: o pior momento possível.
 *
 * ## Por que não é um modal
 *
 * Modal interrompe, e interrupção num app que a pessoa abre NO MEIO DA GIRA é
 * pior que não converter. O convite fica onde a navegação já está: some quando
 * ela entra, e nunca cobre o ponto que ela veio cantar.
 *
 * ## Por que não tem "depois eu vejo"
 *
 * Um botão de dispensar exigiria guardar a dispensa em algum lugar, e a única
 * memória disponível para quem não tem conta é o aparelho. Guardar preferência
 * de quem não consentiu com nada, num app cuja simples conta revela religião,
 * é começar pelo lado errado. Ele é discreto o bastante para não precisar.
 */

import { Link } from "wouter";
import { Heart, LogIn } from "lucide-react";

export function ConviteParaEntrar({ compacto = false }: { compacto?: boolean }) {
  if (compacto) {
    return (
      <Link
        href="/login"
        className="flex min-h-11 items-center justify-center gap-2 border-t bg-primary/10 px-3 text-sm font-medium text-primary"
      >
        <LogIn className="h-4 w-4" aria-hidden />
        Entre para curtir e guardar seus pontos
      </Link>
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Heart className="h-4 w-4 text-primary" aria-hidden />
        O acervo é seu também
      </p>
      <p className="mt-1 text-xs leading-snug text-muted-foreground">
        Com uma conta você <strong className="font-medium text-foreground">curte</strong> os
        pontos que canta, <strong className="font-medium text-foreground">guarda</strong> as
        playlists que quiser e pode{" "}
        <strong className="font-medium text-foreground">mandar um ponto</strong> que falta no
        acervo.
      </p>
      <Link
        href="/login"
        className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground"
      >
        <LogIn className="h-4 w-4" aria-hidden />
        Entrar ou criar conta
      </Link>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        É de graça, e leva um minuto.
      </p>
    </div>
  );
}
