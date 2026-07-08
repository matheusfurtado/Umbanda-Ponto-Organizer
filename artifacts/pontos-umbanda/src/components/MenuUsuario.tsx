import { Link } from "wouter";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/auth/AuthContext";

// Entrada de auth no header: "Entrar" quando anônimo; avatar+nome quando logado.
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

  const inicial = (user.name || user.email || "?").charAt(0).toUpperCase();
  return (
    <Link href="/conta">
      <Button variant="ghost" size="sm" className="gap-2" title="Minha conta">
        <span className="w-6 h-6 rounded-full bg-primary/30 text-primary flex items-center justify-center text-xs font-semibold">
          {inicial}
        </span>
        <span className="max-w-[96px] truncate">{user.name || "Conta"}</span>
      </Button>
    </Link>
  );
}
