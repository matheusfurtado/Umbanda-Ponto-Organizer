import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import { tagsComEndereco } from "./scripts/opengraph";

const port = Number(process.env.PORT) || 3000;
const basePath = process.env.BASE_PATH || "/";

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    {
      // As duas tags de OpenGraph que exigem URL absoluta. Ver
      // `scripts/opengraph.ts`: sem `PONTOS_URL_APP` elas NÃO saem, e no lugar
      // fica um comentário dizendo por quê — prévia quebrada é cacheada pelo
      // WhatsApp por muito tempo, e um link já compartilhado não se conserta.
      name: "opengraph-com-endereco",
      transformIndexHtml(html: string) {
        return html.replace(
          "</head>",
          `  ${tagsComEndereco(process.env.PONTOS_URL_APP)}\n  </head>`,
        );
      },
    },
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/*.png"],
      manifest: {
        // `id` congela a identidade do app instalado.
        //
        // Sem ele o Chrome deriva do `start_url` — e o dia em que `start_url`
        // virar `/acervo`, quem já tinha instalado passa a ter OUTRO app: o
        // antigo fica órfão na tela inicial e o novo instala do lado.
        id: "/",
        name: "Pontos de Umbanda",
        short_name: "Pontos",
        description: "Organize e acesse pontos de umbanda de forma rápida e offline",
        lang: "pt-BR",
        // Explícito, e não pelo que o plugin injeta: no TWA é o `scope` que
        // decide o que abre DENTRO do app e o que abre no navegador. Os links
        // de vídeo apontam para o YouTube, e é exatamente isso que se quer
        // fora do escopo — vídeo abre no app do YouTube, não numa aba presa
        // dentro do nosso.
        scope: "/",
        theme_color: "#7c3aed",
        // ATENÇÃO se um dia houver TWA: esta cor não é a mesma do campo do
        // ícone (`#1a0f2e`, em `scripts/gerar-icones.py`). Na splash do TWA,
        // que desenha o ícone sobre o `background_color`, a diferença aparece
        // como um quadrado mais claro sobre fundo mais escuro. Enquanto for só
        // PWA, ninguém vê. Quando for TWA, uma das duas cores tem de ceder — e
        // a decisão é de identidade visual, não minha.
        background_color: "#0f0a1e",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        // Os tokens são de um registro fechado em inglês minúsculo (w3c), e
        // por isso NÃO vão em pt-BR como o resto. Não são lidos pelo Chrome
        // nem pelo Play, que tem seletor próprio no Console.
        categories: ["music", "lifestyle"],
        // As três rotas que existem de verdade em `src/App.tsx`. O Bubblewrap
        // só oferece atalhos no app Android se o manifest os declarar.
        shortcuts: [
          { name: "Buscar ponto", short_name: "Buscar", url: "/buscar" },
          { name: "Meus favoritos", short_name: "Favoritos", url: "/favoritos" },
          { name: "Repertórios", short_name: "Repertórios", url: "/repertorios" },
        ],
        // `screenshots` fica de FORA de propósito, e é a única coisa que falta
        // para o diálogo de instalação rico do Chrome. Declarar caminho para
        // arquivo que não existe é pior que não declarar: o Chrome descarta o
        // diálogo rico inteiro. Elas exigem o app rodando e alguém decidindo o
        // que mostrar — está anotado no `docs/adr/0008-distribuicao-em-loja.md`.
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          // ARQUIVOS DIFERENTES dos de cima, e isso é o conserto.
          //
          // Os dois `purpose` apontavam para o mesmo `icon-512.png`, que tem
          // cantos transparentes e formas translúcidas. Sob a máscara do
          // launcher Android aquilo vira ombro escuro e anel que troca de cor
          // conforme o papel de parede. Ver `scripts/gerar-icones.py`.
          //
          // E são dois `purpose` em objetos separados, nunca `"any maskable"`
          // no mesmo: o maskable carrega borda sacrificial, e exibido sem
          // máscara essa borda vira ar morto.
          {
            src: "icons/icon-192-maskable.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        // Havia aqui uma regra de `runtimeCaching` para `fonts.googleapis.com`.
        // Ela saiu porque as fontes do Google saíram do `index.html` — o app
        // não pede nada àquele host desde então, e a regra descrevia um
        // tráfego que não existe mais. Regra de cache órfã é pior que inútil:
        // o próximo a ler conclui que o app ainda fala com o Google.
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    // Dev: proxy same-origin de /api -> API Python (FastAPI). Espelha o proxy
    // que a hospedagem fará em produção. Same-origin não é preguiça: é o que
    // deixa o cookie httpOnly de sessão funcionar na fase 2 sem CORS nem
    // SameSite=None.
    //
    // Porta 8000 é a do uvicorn DENTRO do dev container, onde o vite também
    // roda. (Do host, a mesma API responde na 8010 — a 8000 do host já é do
    // dev container do ApuracaoAssistidade_IBS_CBS_v1.)
    proxy: {
      "/api": {
        target: process.env.VITE_API_TARGET || "http://localhost:8000",
        changeOrigin: true,
      },
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
