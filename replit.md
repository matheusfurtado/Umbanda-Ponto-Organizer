# Workspace

> [!IMPORTANT]
> **A stack Node descrita abaixo é SCAFFOLD, não o que roda.**
>
> A aplicação é **Python + PostgreSQL** (FastAPI + SQLAlchemy + Alembic), em
> `../api/`, com auth própria. O `artifacts/api-server` (Express + Better-Auth)
> **não sobe no dev container**, e o pipeline OpenAPI/Orval declara um único
> caminho (`/healthz`). Drizzle sobrevive em `lib/db`, fora do caminho de
> execução.
>
> O que está VIVO neste repositório é `artifacts/pontos-umbanda` — o PWA — e ele
> fala com a API Python. Para o estado real, veja `../docs/PROGRESSO.md` e
> `../CLAUDE.md`.
>
> Conferido em 28/08/2026.

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### `artifacts/pontos-umbanda` — Pontos de Umbanda PWA

React + Vite PWA. **Fala com a API Python** em `/api/v1` (same-origin; o Vite faz
proxy em dev, e em produção a própria API serve o `dist`). O `localStorage` é
**cache**, não fonte da verdade — quem manda é o servidor.

- **Technology**: React, TypeScript, Tailwind CSS, Shadcn UI, vite-plugin-pwa
- **Data model**: Orixás → Subcategorias → Pontos (3-level hierarchy)
- **Features**: Full CRUD, accordion pontos, real-time search with highlight, favorites, export/import JSON backup, PWA install prompt
- **Rede**: clientes escritos à mão em `src/api/`; sincronia e fila offline em
  `src/dados/` (`repositorio.ts` para o acervo, `repertorios.ts` para as giras)
- **Storage**: `localStorage` como cache, via `src/storage.ts`
- **State**: React Context (`src/context.tsx`) com `estado`/`fonte`/`envio`, mais
  `AuthProvider` e `EntitlementsProvider`
- **Routing**: wouter (`Switch`/`Route` em `src/App.tsx`, ~25 rotas)
- **Pages**: ~23 telas em `src/pages/`
- **Tests**: 27, com `pnpm test` (node:test, sem runner instalado)
- **PWA**: Service Worker via vite-plugin-pwa, offline support, install banner

---

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas.
Existem 11 arquivos aqui (auth, org, conteudo, colecoes, faturamento, auditoria,
consentimento e outros, ~556 linhas). **Nada disso está em uso**: o schema vivo é
o do Alembic em `../api/migrations/`.
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`).
**O spec declara um único caminho, `/healthz`** — o contrato real da aplicação é o
que o FastAPI gera em `/openapi.json`. Running codegen produces output into one
sibling package:

1. `lib/api-zod/src/generated/` — Zod schemas

(O alvo `api-client-react` foi removido em 28/08 com o pacote: ninguém consumia
os hooks gerados. O app fala com a API Python por clientes escritos à mão em
`artifacts/pontos-umbanda/src/api/`.)

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
