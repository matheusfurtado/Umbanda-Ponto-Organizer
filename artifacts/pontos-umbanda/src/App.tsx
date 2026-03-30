import { useState } from "react";
import { AppProvider } from "@/context";
import { TelaOrixas } from "@/pages/TelaOrixas";
import { TelaSubcategorias } from "@/pages/TelaSubcategorias";
import { InstallBanner } from "@/components/InstallBanner";
import { Orixa } from "@/types";

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
