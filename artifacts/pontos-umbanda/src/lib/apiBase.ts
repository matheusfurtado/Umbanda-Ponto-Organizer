// Base da API. Em dev, o Vite faz proxy de /api -> localhost:3001 (ver vite.config.ts),
// então same-origin funciona sem CORS. Em produção, a Vercel faz proxy /api/* -> Fly.
// VITE_API_URL permite apontar direto para o backend (ex.: app nativo futuro).
export const API_BASE =
  (import.meta.env as Record<string, string | undefined>).VITE_API_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");
