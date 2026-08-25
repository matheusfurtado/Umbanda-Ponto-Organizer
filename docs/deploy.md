# Deploy — Umbanda Ponto Organizer

Arquitetura (decisão do blueprint): **Vercel** (frontend estático + proxy `/api/*`) → **Fly.io** `gru` (api-server Express) → **Supabase** `sa-east-1` (só Postgres). Auth self-hosted (Better-Auth), e-mail via **Resend**, login social via **Google**.

O código de infra já está no repo:
- `artifacts/api-server/Dockerfile` — imagem de produção (bundle esbuild self-contained).
- `fly.toml` — app Fly (region `gru`, healthcheck `/api/healthz`, escala-a-zero).
- `vercel.json` — build do frontend + **proxy `/api/*` → Fly** (same-origin; cookie de sessão funciona).
- `.github/workflows/ci.yml` — typecheck + build em todo push/PR.
- `.github/workflows/deploy-api.yml` — deploy do api-server no Fly (o frontend a Vercel sobe sozinha).

> Tudo abaixo roda uma vez, no provisionamento. Precisa das SUAS contas.

## 1. Banco — Supabase (`sa-east-1`)
1. Crie um projeto na região **South America (São Paulo)**.
2. Pegue a **connection string** (use o **pooler**, porta 6543, para serverless): `postgresql://postgres:<senha>@<host>:6543/postgres?pgbouncer=true`.
3. NÃO usamos o Auth do Supabase — só o Postgres.
4. Aplique o schema: rode `pnpm --filter @workspace/db run push-force` apontando `DATABASE_URL` para o Supabase, e depois `pnpm --filter @workspace/db run seed` para semear o acervo (384 pontos).

## 2. API — Fly.io
```bash
fly apps create umbanda-ponto-api          # ou ajuste o nome em fly.toml
fly secrets set \
  DATABASE_URL="postgresql://...supabase...:6543/postgres?pgbouncer=true" \
  BETTER_AUTH_SECRET="$(openssl rand -base64 32)" \
  BETTER_AUTH_URL="https://SEU-DOMINIO" \
  TRUSTED_ORIGINS="https://SEU-DOMINIO" \
  RESEND_API_KEY="re_..." \
  EMAIL_FROM="Pontos de Umbanda <nao-responda@SEU-DOMINIO>" \
  GOOGLE_CLIENT_ID="...apps.googleusercontent.com" \
  GOOGLE_CLIENT_SECRET="..."
fly deploy                                  # ou deixe o GitHub Actions fazer
```
> **`BETTER_AUTH_URL` e `TRUSTED_ORIGINS` = o domínio PÚBLICO do frontend** (ex.: `https://pontosdeumbanda.app`), NÃO o `*.fly.dev`. O browser fala com o front; a Vercel faz proxy pro Fly.

## 3. Frontend — Vercel
1. Importe o repo. Framework: **Other** (o `vercel.json` já define build/output).
2. Em `vercel.json`, troque o destino do proxy `https://umbanda-ponto-api.fly.dev` pelo **URL real** do seu app Fly.
3. Não precisa de env no frontend (a API é same-origin via proxy). Se um dia rodar o front separado do back, use `VITE_API_URL`.

## 4. Google OAuth
- No Google Cloud Console → Credenciais → OAuth client (Web).
- **Authorized redirect URI**: `https://SEU-DOMINIO/api/auth/callback/google`.
- Copie client id/secret para os secrets do Fly (passo 2).

## 5. E-mail — Resend
- Crie a API key e verifique o domínio de envio; use em `RESEND_API_KEY`/`EMAIL_FROM`.

## 6. GitHub Actions
- Secret do repo: **`FLY_API_TOKEN`** (`fly tokens create deploy`). O deploy-api.yml usa ele.
- A Vercel sobe o frontend automaticamente pela integração de Git.

## Secrets (resumo)
| Secret | Onde | Valor |
|---|---|---|
| `DATABASE_URL` | Fly | Postgres do Supabase (pooler) |
| `BETTER_AUTH_SECRET` | Fly | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | Fly | domínio público do frontend |
| `TRUSTED_ORIGINS` | Fly | domínio(s) público(s), separados por vírgula |
| `RESEND_API_KEY` / `EMAIL_FROM` | Fly | Resend |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Fly | Google OAuth |
| `FLY_API_TOKEN` | GitHub | `fly tokens create deploy` |

## Verificar no 1º deploy (proxy + cookie)
O padrão é **same-origin via proxy** (front e `/api` no mesmo domínio), então o cookie httpOnly (`SameSite=Lax`) funciona sem CORS. Confirme após subir:
1. `GET https://SEU-DOMINIO/api/healthz` → `{"status":"ok"}`.
2. Criar conta → o `Set-Cookie` deve vir para o domínio do frontend (não `fly.dev`).
3. Recarregar → continua logado (sessão persiste).

Se o cookie NÃO grudar (proxy externo da Vercel alterando `Set-Cookie`), a alternativa é servir a API num subdomínio (`api.SEU-DOMINIO` → Fly) e habilitar `crossSubDomainCookies` no Better-Auth (`lib/auth`). O código de auth já está pronto para os dois caminhos.
