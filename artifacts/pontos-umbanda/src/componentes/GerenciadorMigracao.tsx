import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import { ModalMigracao } from "@/components/ModalMigracao";
import { carregarDados } from "@/storage";

const FLAG_MIGRACAO = "migracao-oferecida";

/**
 * Oferece a migração uma única vez, logo após o login, se houver o que migrar.
 * O modo anônimo nunca vê isto. Fechar (mesmo "Agora não") marca como oferecido.
 *
 * ## "A chave existe" não é "há o que migrar"
 *
 * A condição era `localStorage.getItem("pontos-umbanda-data")` — presença da
 * chave. Só que essa chave também é escrita quando o app guarda o acervo
 * BAIXADO do servidor: quem entrasse numa conta já sincronizada recebia, na
 * volta, um convite para "enviar seus pontos" que na verdade devolveria ao
 * servidor o que dele tinha acabado de vir.
 *
 * Pior no aparelho sem nada: a chave existe com o acervo vazio, o diálogo abre
 * mostrando três zeros, e o `PUT` volta **422** — "Sync recusado: ele apagaria
 * o acervo inteiro" (a cerca do servidor, em `routers/sync.py`, que existe
 * porque um payload meio hidratado já apagou o acervo de uma conta de teste).
 * O app oferecia uma ação que ele mesmo sabe que não passa, e a recusa chegava
 * como se a pessoa tivesse tentado apagar as próprias coisas.
 */
export function GerenciadorMigracao() {
  const { autenticado, isPending } = useAuth();
  const [aberto, setAberto] = useState(false);

  useEffect(() => {
    if (isPending || !autenticado) return;
    if (localStorage.getItem(FLAG_MIGRACAO) === "1") return;
    if (carregarDados().pontos.length > 0) setAberto(true);
  }, [autenticado, isPending]);

  const fechar = () => {
    localStorage.setItem(FLAG_MIGRACAO, "1");
    setAberto(false);
  };

  return <ModalMigracao aberto={aberto} onFechar={fechar} />;
}
