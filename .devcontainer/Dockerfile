# .devcontainer/Dockerfile
# Imagem de desenvolvimento: Node 24 + pnpm (via corepack) + ferramentas de CLI
# úteis para trabalhar com Postgres/Drizzle de dentro do container.
#
# Esta imagem NÃO é usada para build/deploy de produção — ela existe apenas
# para o dev container. Deploy de produção continua no pipeline existente
# (Vercel para o frontend / esbuild para o api-server).

FROM node:24-bookworm-slim

# --- pnpm via corepack (mesma politica de supply-chain do pnpm-workspace.yaml) ---
ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:${PATH}"

# Fixa a versão EXATA do pnpm. O repo é pnpm 10; o pnpm 11 falha no gate de build
# do esbuild (ERR_PNPM_IGNORED_BUILDS) mesmo com esbuild em onlyBuiltDependencies.
# COREPACK_DEFAULT_TO_LATEST=0 impede o corepack de pular para a última versão
# quando não há packageManager pinado (agora há, no package.json raiz — cinto e suspensório).
ENV COREPACK_DEFAULT_TO_LATEST=0

RUN corepack enable && corepack prepare pnpm@10.34.4 --activate

# --- ferramentas de sistema úteis dentro do container ---
# git: necessário para o VS Code/Claude Code operarem no repo
# curl/ca-certificates: downloads e healthchecks
# postgresql-client: psql/pg_isready para depurar o Postgres do compose
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        git \
        curl \
        ca-certificates \
        postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# A imagem oficial node:*-bookworm-slim já cria o usuário "node" (uid/gid 1000).
# Preparamos os diretórios de trabalho e do pnpm store com o dono correto
# antes de trocar para esse usuário não-root.
RUN mkdir -p /workspace "${PNPM_HOME}" \
    && chown -R node:node /workspace "${PNPM_HOME}"

USER node
WORKDIR /workspace

CMD ["sleep", "infinity"]
