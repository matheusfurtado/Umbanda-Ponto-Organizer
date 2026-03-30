import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Props {
  aberto: boolean;
  titulo: string;
  descricao: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export function ModalConfirmar({ aberto, titulo, descricao, onConfirmar, onCancelar }: Props) {
  return (
    <AlertDialog open={aberto} onOpenChange={(v) => !v && onCancelar()}>
      <AlertDialogContent className="bg-card border-border text-foreground max-w-sm mx-4">
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">{descricao}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancelar} className="border-border">Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmar} className="bg-destructive text-white hover:bg-destructive/90">Excluir</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
