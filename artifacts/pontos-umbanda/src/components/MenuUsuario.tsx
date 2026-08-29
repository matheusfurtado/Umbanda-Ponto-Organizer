import { Link } from "wouter";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/componentes/Avatar";
import { useAuth } from "@/auth/AuthContext";
import { apelido } from "@/auth/apelido";

/**
 * Entrada de auth no header: "Entrar" quando anônimo; foto e nome quando
 * logado.
 *
 * ## Mostra o MESMO que a barra lateral, e isso é o conserto
 *
 * A barra lateral mostra `<Avatar apelido={user.apelido} foto={user.foto} />`
 * — a foto que a pessoa mandou e o nome público que ela escolheu. Este
 * cabeçalho desenhava um círculo próprio com a inicial do E-MAIL e escrevia a
 * parte local dele ao lado. A mesma pessoa, ao mesmo tempo, com duas
 * identidades na mesma tela.
 *
 * A do e-mail era a errada: é o dado que este app promete não expor a
 * ninguém, e o cabeçalho aparece em toda tela — inclusive no tablet
 * compartilhado do terreiro, onde quem olha de lado lê o fragmento do e-mail
 * em vez do apelido que ela pôs justamente no lugar dele.
 *
 * Quem ainda não escolheu apelido continua vendo o rótulo do e-mail: é o
 * recuo, e é o que ela tem para reconhecer em que conta está.
 */
export function MenuUsuario() {
  const { user, isPending } = useAuth();

  if (isPending) return <div className="w-9 h-9" aria-hidden />;

  if (!user) {
    return (
      <Link href="/login">
        <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <LogIn className="w-4 h-4" /> Entrar
        </Button>
      </Link>
    );
  }

  const nome = user.apelido || apelido(user.email);
  return (
    <Link href="/conta">
      <Button variant="ghost" size="sm" className="gap-2" title="Minha conta">
        <Avatar apelido={nome} foto={user.foto} tamanho="sm" />
        <span className="max-w-[96px] truncate">{nome}</span>
      </Button>
    </Link>
  );
}
