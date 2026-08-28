import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { db } from "@workspace/db";
import * as schema from "@workspace/db/schema";

const isProd = process.env.NODE_ENV === "production";
const secret = process.env.BETTER_AUTH_SECRET;
if (!secret && isProd) {
  throw new Error("BETTER_AUTH_SECRET é obrigatório em produção (openssl rand -base64 32).");
}

const trustedOrigins = (process.env.TRUSTED_ORIGINS ?? "http://localhost:3000,http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Transporte de e-mail: em produção usa Resend (via fetch, sem SDK — respeita minimumReleaseAge);
// em dev, sem RESEND_API_KEY, o OTP é logado no console para testar o fluxo.
function enviarEmail(to: string, assunto: string, corpo: string): void {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`\n[email dev] para=${to} assunto="${assunto}"\n${corpo}\n`);
    return;
  }
  void fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Pontos de Umbanda <onboarding@resend.dev>",
      to,
      subject: assunto,
      text: corpo,
    }),
  }).catch((err) => console.error("[email] falha ao enviar via Resend:", err));
}

export const auth = betterAuth({
  // Em dev usa um fallback fixo (cookie estável entre restarts). Em produção, obrigatório via env.
  secret: secret ?? "dev-secret-inseguro-troque-em-producao-000000000000",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3001",
  trustedOrigins,
  database: drizzleAdapter(db, { provider: "pg", schema, usePlural: true }),
  advanced: {
    // IDs em UUID (casam com as colunas uuid do Drizzle e com as FKs do domínio).
    database: { generateId: "uuid" },
    // Atrás de proxy (Fly/Vercel): resolve o IP real do cliente p/ rate limiting.
    ipAddress: { ipAddressHeaders: ["fly-client-ip", "x-forwarded-for"] },
  },
  emailAndPassword: { enabled: true },
  socialProviders: process.env.GOOGLE_CLIENT_ID
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
      }
    : undefined,
  plugins: [
    emailOTP({
      // async p/ satisfazer o tipo (Promise<void>), mas o envio em si é fire-and-forget
      // (enviarEmail não é awaited) — reduz timing attacks, conforme a doc.
      async sendVerificationOTP({ email, otp, type }) {
        const assunto =
          type === "sign-in"
            ? "Seu código de acesso — Pontos de Umbanda"
            : type === "email-verification"
              ? "Confirme seu e-mail — Pontos de Umbanda"
              : "Redefinição de senha — Pontos de Umbanda";
        enviarEmail(email, assunto, `Seu código é: ${otp}\n\nEle expira em alguns minutos. Axé.`);
      },
    }),
  ],
});

export type Auth = typeof auth;
