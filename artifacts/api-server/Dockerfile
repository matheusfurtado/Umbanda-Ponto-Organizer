# syntax=docker/dockerfile:1
# Imagem de PRODUÇÃO do api-server para o Fly.io (region gru).
# Multi-stage: builder (monorepo pnpm + esbuild) -> runtime slim (só o bundle self-contained).
# O contexto de build é a RAIZ do repo (ver fly.toml). Isto NÃO é o dev container.

FROM node:24-bookworm-slim AS builder
ENV COREPACK_DEFAULT_TO_LATEST=0
RUN corepack enable
WORKDIR /repo

# Copia o monorepo inteiro — o esbuild bundla @workspace/db, @workspace/auth e
# @workspace/api-zod a partir da fonte. O .dockerignore tira node_modules/dist/store.
COPY . .

# pnpm fixado via "packageManager" no package.json (10.34.4). Instala e builda o api-server.
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @workspace/api-server run build

# ---------- runtime ----------
FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# O bundle esbuild é self-contained (validado: roda sem node_modules). Copiamos só o dist.
COPY --from=builder /repo/artifacts/api-server/dist ./dist

# PORT é injetado pelo fly.toml (default 3001). Secrets via `fly secrets set` (ver docs/deploy.md).
ENV PORT=3001
EXPOSE 3001
CMD ["node", "dist/index.mjs"]
