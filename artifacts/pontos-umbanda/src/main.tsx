// A fonte, servida pelo próprio app — ver o comentário no `index.html`.
import "@fontsource-variable/inter";
import { createRoot } from "react-dom/client";
import App from "./App";
import { iniciarPaleta } from "./lib/paleta";
import "./index.css";

// Antes da primeira pintura: aplicar a paleta depois faria a tela piscar na
// cor errada a cada carregamento.
iniciarPaleta();

createRoot(document.getElementById("root")!).render(<App />);
