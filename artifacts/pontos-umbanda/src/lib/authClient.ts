import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";
import { API_BASE } from "./apiBase";

// Cliente Better-Auth (mesma instância do backend em lib/auth). Sessão por cookie httpOnly
// (same-origin via proxy), então nada de token no cliente web.
export const authClient = createAuthClient({
  baseURL: API_BASE,
  plugins: [emailOTPClient()],
});

export const { useSession, signIn, signUp, signOut } = authClient;
