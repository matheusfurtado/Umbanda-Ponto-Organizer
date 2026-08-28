/**
 * O aviso de que o texto legal ainda não está completo.
 *
 * Aparece no topo das páginas de privacidade e termos enquanto faltar algum
 * dado do controlador. **Não é decoração de desenvolvimento:** um texto legal
 * incompleto que vai ao ar parecendo completo é pior que texto nenhum — quem
 * lê acredita, e quem publica acha que resolveu.
 */

import { AlertTriangle } from "lucide-react";
import { faltaPreencher } from "@/dominio/controlador";

export function AvisoLegalPendente() {
  const falta = faltaPreencher();
  if (falta.length === 0) return null;

  return (
    <div
      role="alert"
      className="mb-6 flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden />
      <div>
        <p className="font-semibold text-amber-300">
          Este texto ainda não está completo.
        </p>
        <p className="mt-1 text-muted-foreground">
          Falta preencher: {falta.join(", ")}. Enquanto isso, o documento
          descreve corretamente o que o aplicativo faz com os dados, mas não
          identifica quem responde por eles.
        </p>
      </div>
    </div>
  );
}
