import { InstallBanner } from "@/components/InstallBanner";
import { AppProvider } from "@/context";
import { TelaOrixas } from "@/pages/TelaOrixas";
import { TelaSubcategorias } from "@/pages/TelaSubcategorias";
import { Orixa } from "@/types";
import { useState } from "react";

function AppInner() {
  const [orixaSelecionado, setOrixaSelecionado] = useState<Orixa | null>(null);

  if (orixaSelecionado) {
    return (
      <TelaSubcategorias
        orixa={orixaSelecionado}
        onVoltar={() => setOrixaSelecionado(null)}
      />
    );
  }

  return <TelaOrixas onSelectOrixa={setOrixaSelecionado} />;
}

function App() {
  return (
    <AppProvider>
      <AppInner />
      <InstallBanner />
    </AppProvider>
  );
}

export default App;
