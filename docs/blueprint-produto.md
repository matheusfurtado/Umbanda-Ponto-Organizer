# Blueprint de Produto — Umbanda Ponto Organizer

> De organizador pessoal de pontos (PWA localStorage) a **produto SaaS**.
> Documento gerado por um time multi-agente (tiering Haiku/Sonnet/Opus). Fonte da verdade do plano; o time de agentes vive em `.claude/agents/`.

**Data:** 2026-07-07 · **Status:** proposta para revisão do dono

---

## 1. Sumário executivo

## Plano integrado — Umbanda Ponto Organizer → SaaS

Integrei as seis frentes do time (Hospedagem, Auth, Monetização, Schema/Dados, API/Sync, Frontend, Dev Container) num caminho único e sem contradições. O produto de hoje é um PWA 100% localStorage com backend-scaffold vazio (`lib/db/src/schema/index.ts` = `export {}`, `api-server` só com `/healthz`). A tese é **fechar as lacunas de PRODUTO (login, banco na nuvem, migração, pagamento Pix, colaboração de terreiro)** reaproveitando ~100% do scaffold — Drizzle, Express 5, pipeline Orval/OpenAPI, `custom-fetch` com base URL + token, `wouter`/React Query já instalados e mortos.

### Conflitos entre as seções que resolvi como CTO (decisões finais, únicas)

1. **Auth: Better-Auth self-hosted, NÃO Supabase Auth/GoTrue.** A frente de hospedagem sugeriu validar JWT do Supabase Auth; a frente de auth pediu Better-Auth. **Vence Better-Auth** rodando como middleware dentro do `api-server`, sobre o Postgres do Supabase (que é Postgres puro). Isso respeita a própria "regra de ouro" da frente de hospedagem — *sem SDK proprietário no caminho crítico, sem lock-in* — e mantém `auth.users`+JWT no nosso banco, deixando a porta AWS aberta. **Supabase entra só como Postgres gerenciado `sa-east-1`** (e, no futuro, Storage — que trocaremos por R2). Não usamos GoTrue.

2. **Gateway: Mercado Pago primário (Pix/boleto nativos), NÃO Stripe.** A frente de dados e a de API modelaram campos `stripe*`; a de monetização e a de hospedagem escolheram Mercado Pago. **Vence Mercado Pago**, isolado atrás de uma interface `PaymentProvider` (pacote `@workspace/billing`). O schema de faturamento fica **provider-agnóstico** (`provider`, `providerSubId`, `providerCustomerId`, `billing_events.providerEventId`) — descartei os nomes de coluna acoplados a Stripe. Stripe fica como plano B para cobrança internacional. O resíduo `stripe-replit-sync` no `pnpm-workspace.yaml` é removido.

3. **IDs: `crypto.randomUUID()` gerado no cliente (UUIDv4), coluna `uuid` no Postgres.** Havia três propostas divergentes: `gen_random_uuid()` server-side (dados), ULID client-side (sync), `crypto.randomUUID()` client-side (frontend). **Unifiquei em `crypto.randomUUID()` no cliente**, gravado em coluna `uuid` (o Postgres aceita valor fornecido). Satisfaz os três: o frontend já decidiu assim, o sync precisa de geração client-side para criar offline sem round-trip, e `gen_random_uuid()` vira apenas o *default* das linhas criadas pelo servidor (seed canônico). IDs antigos preservados em `slug` (matching/URL) + `legacy_id` (idempotência do import). Caminho para UUIDv7 aberto via função SQL, sem nova dependência (respeita `minimumReleaseAge`).

4. **Tabelas de auth: dono é o Better-Auth** (`user`/`session`/`account`/`verification`, schema que ele gera). Descartei o `users/sessoes/contas` hand-rolled da frente de dados. As tabelas de domínio referenciam `user.id`.

5. **Sync: import único no MVP, sync incremental depois.** A frente de sync propôs snapshot-blob como passo mínimo e a de frontend propôs repositório granular. **Síntese:** a migração localStorage→conta é um **import transacional único** do `AppData` (`POST /api/account/import-local-data`, idempotente, com dedup por hash — reaproveita `exportarDados()`); a leitura passa a ser server-authoritative com cache local; o **sync incremental bidirecional** (IndexedDB + outbox + delta-pull + Background Sync + fractional index) é uma fase posterior. O "snapshot" deixa de ser mecanismo de sync permanente e vira só o veículo da migração.

6. **Sessão: cookie httpOnly (default do Better-Auth) via proxy `/api/*` no `vercel.json`** (same-origin, mata `SameSite=None`/ITP do Safari). O `setAuthTokenGetter`/bearer do `custom-fetch` fica reservado para futuro app nativo; no web, `custom-fetch` usa `credentials: 'include'`. O `api-server` já traz `cookie-parser` — encaixa direto.

7. **Ordenação: índice fracionário (LexoRank, `text`)** — consenso dados+sync; o frontend ajusta o `ordem: number` legado. **RLS: autorização na app como camada primária + RLS como defesa em profundidade** (nunca camada única), com role `app_rw` sem `BYPASSRLS`.

O resultado é um único stack coerente: **Vercel (frontend) + Fly.io `gru` (Express) + Supabase `sa-east-1` (Postgres) + Better-Auth + Mercado Pago + Resend**, tudo Docker+Postgres+Drizzle sem lock-in, com AWS como destino futuro acionado por gatilhos concretos (B2B enterprise, volume p/ Reserved Instances, rede privada) — migração vira DevOps, não reescrita.

## 2. Visão de produto

Transformar o organizador pessoal de pontos cantados num produto SaaS que preserva e organiza o repertório da Umbanda — mantendo a promessa inegociável de que o app funciona 100% offline e sem conta, e de que nenhuma letra jamais fica atrás de paywall. Cobra-se a ferramenta ao redor (nuvem, sync entre aparelhos, backup versionado, modo apresentação mãos-livres, PDF) e, sobretudo, o workspace coletivo do terreiro (repertório oficial da casa, gira do dia compartilhada, papéis dirigente/ogã/médium) — o único fosso competitivo real e o eixo de maior disposição a pagar. B2C é o funil de aquisição orgânica (WhatsApp de terreiro); B2B é a tese de negócio. Local-first permanece o princípio de arquitetura: a leitura na gira nunca depende de rede.

## 3. Diagnóstico do que existe hoje

### 3.x Frontend (app React)

## Inventário do frontend `artifacts/pontos-umbanda`\n\n**Arquitetura de estado**: Um único React Context (`src/context.tsx`) guarda todo `AppData` (orixás/subcategorias/pontos) e expõe ~20 funções de mutação. Toda mutação é síncrona: atualiza o objeto em memória e grava em `localStorage` (chave única `pontos-umbanda-data`) via `src/storage.ts`. Não há noção de rede, loading, erro, cache ou usuário — é um modelo 100% local-first single-tenant.\n\n**Roteamento**: Não existe router real. `src/App.tsx` alterna entre `TelaOrixas` e `TelaSubcategorias` com um simples `useState<Orixa|null>` em `AppInner`. A dependência `wouter` está no `package.json` mas não é importada em lugar nenhum do código — é vestigial/preparada, não usada.\n\n**Fluxos de UI / features reais**: Home (`TelaOrixas`) lista orixás com drag-reorder (@dnd-kit), CRUD via modais, contadores agregados, backup manual (export/import JSON, com reload de página no import). Tela de detalhe (`TelaSubcategorias`) tem busca em tempo real com highlight (`CardPonto.destacar`), filtros por palavra-chave e filtros específicos de Exu, drag-drop de pontos entre subcategorias, um botão 'organizar por grupo' que reordena pontos localmente por regra de keyword, e accordion (`CardPonto`) com favoritar/editar/excluir/mover.\n\n**Qualidade do código**: Consistente e razoavelmente limpo (bom uso de hooks, memoização com `useMemo`/`useCallback`), mas há dívida técnica visível: `ModalReorganizar.tsx` é código morto (nunca importado; a mesma lógica foi reimplementada inline em `TelaSubcategorias`), e as dependências `wouter` e `@workspace/api-client-react`/`@tanstack/react-query` estão instaladas mas não usadas em nenhum componente — indício de que a integração com backend/roteamento real já era antecipada no scaffold, porém nunca conectada. Não há testes automatizados visíveis nos arquivos analisados.\n\n**O que precisaria mudar para contas/login/sync/planos** (inventário de lacunas, sem desenhar a solução): schema de dados (`types.ts`) sem campo de usuário/tenant; Context inteiro construído sobre leitura/escrita síncrona local, sem estados de loading/erro nem suporte a operações assíncronas/otimistas/conflito; ausência total de roteamento com URLs reais (bloqueia auth-gating e deep-linking); ausência de qualquer estado de autenticação ou UI de login; ausência de qualquer feature-gating de plano/assinatura; mecanismo de backup atual (import/export JSON com overwrite total + reload) incompatível com sync incremental multi-dispositivo; dependências de rede (`api-client-react`, `react-query`) já presentes mas nunca conectadas a nenhum endpoint."

**Lacunas para virar produto:**

- Sem qualquer noção de usuário: não há conceito de account/tenant/session em nenhum lugar do código — Context, storage.ts e types.ts assumem um único usuário implícito por navegador (dado preso em localStorage do dispositivo).
- Sem camada de rede: nenhum fetch/axios/React Query ativo no app apesar de @workspace/api-client-react e @tanstack/react-query estarem instalados; toda leitura/escrita é síncrona local (carregarDados/salvarDados em storage.ts), então introduzir sync remoto exige repensar o AppProvider inteiro (hoje 100% síncrono, sem loading/error state, sem optimistic updates, sem conflict resolution).
- types.ts não tem campos de propriedade/tenant (userId, terreiroId) em Orixa/Subcategoria/Ponto/AppData — schema de dados precisa migrar para multi-tenant antes de qualquer backend.
- Roteamento é apenas useState local em App.tsx (não há URLs reais: /orixa/:id não existe), então não há como (a) linkar direto para uma tela, (b) fazer auth-gating de rota, (c) redirecionar pós-login sem reescrever a navegação com wouter (que já está instalado mas não usado) ou outro router.
- Não existe estado de autenticação (sem login/signup/logout, sem token, sem verificação de sessão) nem UI para isso — nenhum componente, contexto ou rota protegida.
- Não existe qualquer noção de plano/assinatura/paywall/feature-gating no código — nenhuma checagem de 'free vs pago' em nenhum componente.
- Import/Export JSON (exportarDados/importarDados em storage.ts) é o único mecanismo de 'backup e portabilidade' hoje; ao introduzir sync remoto isso precisa coexistir ou ser substituído, e o fluxo de importarDados hoje sobrescreve localStorage inteiro e faz window.location.reload() — não é compatível com merge/sync incremental.
- gerarId() (storage.ts) provavelmente gera IDs client-side simples (não UUID nem alinhado a PK server) — nomes de tabela/PK/estratégia de sincronização precisam ser definidos.
- ModalReorganizar.tsx é código morto (não importado em lugar nenhum) — sinal de qualidade/dívida técnica a limpar antes de expandir a base de código.
- wouter e @workspace/api-client-react estão como devDependency no package.json mas não são usados — indica que o scaffold já antecipava sync/roteamento real porém nunca foi ligado ao app.
- Sem tratamento de estados de loading/erro/retry em nenhum componente — toda a UI assume operação síncrona instantânea (localStorage), então qualquer chamada de rede (login, sync) precisa desses estados novos em cada tela/modal.
- Nenhum teste automatizado aparente nos arquivos lidos — risco ao refatorar Context/estado para suportar rede.

**Riscos:**

- Migrar de localStorage síncrono para backend assíncrono é uma reescrita estrutural do Context inteiro (todas as ~20 funções de mutação em context.tsx assumem retorno imediato e estado sempre 'fresh' na mesma render) — não é um patch incremental, é troca de paradigma (fetch/mutate assíncronos, cache, invalidação).
- O fluxo de import/export JSON hoje é a única forma de portar dados entre dispositivos; usuários existentes (se houver) terão que migrar dados de localStorage para a nuvem — precisa de estratégia de migração/merge, já que hoje importarDados() sobrescreve tudo sem merge.
- Adicionar roteamento real (wouter) e auth-gating vai colidir com a navegação atual baseada em useState (App.tsx) — refatorar isso pode quebrar o comportamento de 'lembrar último orixá selecionado' (dados.ultimoOrixaId) que hoje é feito via useEffect local.
- Sem testes automatizados visíveis, qualquer refatoração grande de estado/roteamento tem alto risco de regressão silenciosa nas features já existentes (drag-drop, busca, favoritos).

### 3.x Dados & Migração

## Modelo de dados atual (localStorage)

**Fonte da verdade**: `artifacts/pontos-umbanda/src/storage.ts` (1351 linhas) — contém tipos re-exportados de `types.ts`, ~248 pontos seed hardcoded em array literal (linhas ~5 a ~1292), e as funções de persistência.

**Entidades e relações** (`src/types.ts`, 34 linhas):
- `Orixa { id, nome, cor, emoji, ordem, criadoEm }` — nível raiz.
- `Subcategoria { id, orixaId, nome, ordem, criadoEm }` — FK `orixaId → Orixa.id`.
- `Ponto { id, subcategoriaId, titulo, letra, favorito, ordem, criadoEm }` — FK `subcategoriaId → Subcategoria.id`.
- `AppData { orixas[], subcategorias[], pontos[], ultimoOrixaId? }` — o **blob único** persistido.

Hierarquia estrita 3 níveis: Orixa → Subcategoria → Ponto. Não há tabela de usuários, sessões, nem qualquer particionamento por usuário — tudo é um único documento JSON.

**IDs**: dois padrões coexistindo, sem UUID nem padrão único:
1. IDs "semânticos" hardcoded no seed, ex. `sub-oxossi-louvacao`, `sub-iansa-chegada`, prefixos curtos como `lo-1`, `ch-3`, `tr-14`, `cu-2`, `de-5` (letras iniciais da categoria + índice sequencial).
2. IDs gerados em runtime via `gerarId()` (storage.ts:1349): `${Date.now()}-${Math.random().toString(36).slice(2,9)}` — ex. `1774886896028-q58etyt`. Colidem no formato com `criadoEm` (mesmo timestamp em ms), mas não são garantidamente únicos entre dispositivos/usuários (dependem só do relógio local + random curto) — inaceitável como PK em banco compartilhado.

**Persistência atual** (storage.ts:1295-1347):
- `carregarDados()`: lê `localStorage['pontos-umbanda-data']`; se vazio, seeda com `ORIXAS_PADRAO` + `SUBCATEGORIAS_PADRAO` + `PONTOS_PADRAO` e salva.
- `salvarDados(dados)`: `JSON.stringify` bruto sobre a chave inteira — reescreve o documento todo a cada mutação (sem diff, sem versionamento, sem lock).
- `exportarDados()` / `importarDados()`: backup/restore manual via arquivo JSON, sem merge — importar substitui 100% dos dados locais.
- Nenhuma migração de schema, nenhum campo `updatedAt`, nenhum soft-delete, nenhuma versão de schema no payload.

**Campos `ordem` e `favorito`** (mutações em `src/context.tsx`):
- `ordem` é um inteiro por lista-irmã (todos os pontos de uma subcategoria reindexados 0..n-1 a cada reorder/mover — `reordenarPontos`, `reordenarMultiplosPontos`, `moverPontoCima/Baixo`, e o mesmo padrão para subcategorias e orixas). É **puramente local ao dispositivo/usuário atual** — reescreve o array inteiro.
- `favorito` é um booleano simples no próprio `Ponto`, alternado in-place (`toggleFavorito`).
- Ambos vivem **dentro da entidade de conteúdo compartilhável** (o Ponto), não em uma tabela de preferência por usuário. Esse é o problema estrutural nº 1 para multi-usuário.

**Volume de dados seed**:
- `storage.ts` (usado pelo app hoje): 11 orixas, ~50 subcategorias, ~248 pontos hardcoded como literais TS.
- `pontos-completo.json` (arquivo solto na raiz do repo, **não importado por nenhum código do app** — confirmado via grep, zero referências em `src/`): mesmo shape `{orixas, subcategorias, pontos}`, mas maior — 12 orixas, 42 subcategorias, 384 pontos. É um superset/backup mais completo gerado fora do app, nunca mergeado de volta ao seed do código. Candidato natural a seed inicial do banco central, mas precisa reconciliação com os ~248 já em `storage.ts` (IDs coincidem parcialmente, ex. `lo-1` aparece nos dois — não se sabe se são idênticos ou divergiram).

## Problemas estruturais para multi-usuário

1. **`favorito` e `ordem` são globais/embutidos no Ponto**: se Ponto virar entidade compartilhada (catálogo comum de letras), dois usuários não podem ter favoritos ou ordenações diferentes do mesmo ponto — precisa quebrar em tabela `user_ponto_preference (userId, pontoId, favorito, ordem)` separada do conteúdo.
2. **Não existe distinção entre "ponto padrão do catálogo" e "ponto autoral do usuário"**: hoje é tudo a mesma lista plana. Em produção multi-tenant é preciso um campo tipo `owner: 'system' | userId` (ou tabela separada `pontos_catalogo` vs `pontos_usuario`), para (a) permitir editar/deletar sem afetar outros, e (b) atualizar o catálogo global sem sobrescrever customizações do usuário.
3. **Deduplicação de letras entre usuários**: cada usuário hoje tem sua própria cópia completa (248-384 pontos) via seed local. Em servidor, se cada signup clonar o catálogo inteiro por usuário, gera-se enorme duplicação de texto e nenhuma forma de identificar que "letra X" é a mesma entre dois terreiros — falta normalização (hash de conteúdo, ou catálogo compartilhado com FK, não cópia).
4. **`ordem` como inteiro denso reindexado**: qualquer reorder reescreve toda a lista de irmãos; em concorrência multi-dispositivo (mesmo usuário logado em celular + web) isso gera write conflicts / last-write-wins destrutivo. Precisa de estratégia mais tolerante a merge (ordem fracionária tipo LexoRank, ou posições por timestamp).
5. **IDs não são globalmente únicos nem estáveis**: mistura de slugs semânticos fixos e `timestamp-random` gerados no cliente. Em banco compartilhado por múltiplos usuários, colisão de PK é possível e os slugs semânticos (`sub-oxossi-louvacao`) colidiriam entre diferentes contas se reaproveitados como PK global.
6. **Blob único (`AppData` inteiro) como unidade de leitura/escrita**: `carregarDados`/`salvarDados` operam no documento completo. Migrar para API real exige quebrar em endpoints granulares por entidade (CRUD Orixa/Subcategoria/Ponto) e por relação usuário↔preferência, não um GET/PUT de blob.
7. **Import/export sem merge**: `importarDados` substitui tudo — em multi-usuário isso teria que virar operação de merge server-side (idempotente, com resolução de conflito), não um overwrite.
8. **Sem soft-delete/auditoria**: excluir um Orixa hoje provavelmente cascade-deleta localmente sem histórico; num backend compartilhado (com planos/multi-terreiro) falta trilha de quem criou/editou o quê e quando (`createdBy`, `updatedBy`, `updatedAt`, `deletedAt`).

## O que falta para nuvem + migração

- **Backend**: `lib/db/src/schema/index.ts` está vazio (só placeholder) — nenhuma tabela Drizzle existe. `api-server` só tem `GET /healthz`. Pipeline Orval/OpenAPI está montado mas sem spec real além do healthcheck.
- **Schema Postgres necessário** (mínimo): `users`, `orixas` (catálogo, possivelmente `ownerId NULL` = global), `subcategorias`, `pontos` (com `ownerId`/`origemCatalogoId` para diferenciar cópia-do-catálogo vs autoral), `user_ponto_state` (favorito, ordem por usuário), `user_subcategoria_state`/`user_orixa_state` (ordenação por usuário), tabela de auth/sessão, e futuramente `plans`/`subscriptions` e `terreiros`/`memberships` se houver compartilhamento entre usuários de um mesmo grupo.
- **IDs**: trocar geração client-side por UUID/ULID server-side — os slugs semânticos do seed atual servem só como `slug` de exibição, não como PK.
- **Auth**: nada existe hoje (nem lib nem rota) — precisa provedor de auth (sessão/JWT), tabela de usuários, middleware no Express.
- **Migração do localStorage existente**: rota de "importar meu backup" na primeira sessão logada — reaproveitar o formato `AppData` de export/import como payload de onboarding, mapeando IDs antigos para novos (mantendo `legacyId` para rastreabilidade) e separando o que vira "cópia pessoal editável" do que deveria mapear para o catálogo global (reconciliação com `pontos-completo.json`, que tem mais pontos que o seed em uso).
- **Sync**: hoje é single-device/localStorage puro, sem noção de conflito; ao ir para multi-dispositivo é preciso decidir estratégia (last-write-wins por campo, CRDT, ou API request/response sem cache offline sofisticado no primeiro corte — o PWA/offline atual teria que virar cache read-only + fila de mutações pendentes).
- **Dev container**: não existe `.devcontainer` hoje; para atender ao pedido de trabalhar 100% dentro de container, falta compor Postgres + api-server + frontend num docker-compose/devcontainer.json com watch/hot-reload.

**Lacunas para virar produto:**

- Nenhuma tabela em lib/db (schema vazio) — precisa modelar users, orixas, subcategorias, pontos, user_ponto_state (favorito+ordem por usuário), user_subcategoria_state, user_orixa_state, e futuramente plans/terreiros
- Separar 'ponto de catálogo/padrão' de 'ponto do usuário' (campo ownerId ou tabelas distintas) — hoje é uma lista plana só
- Mover favorito e ordem para fora da entidade Ponto/Subcategoria/Orixa e para uma tabela de preferência por-usuário — hoje são campos globais no conteúdo
- Trocar gerarId() client-side por UUID/ULID gerado no servidor (ou com namespace de tenant) para evitar colisão entre usuários/dispositivos
- Definir estratégia de deduplicação de letras entre usuários (hash de conteúdo ou catálogo compartilhado via FK) em vez de cópia integral do seed por conta
- Construir rota/fluxo de migração do export local (formato AppData) para o banco no onboarding do usuário logado, com mapeamento de IDs legados
- Implementar auth (nenhuma lib/rota hoje) — sessão/JWT, tabela users, middleware Express
- Reconciliar pontos-completo.json (384 pontos) com o seed em uso em storage.ts (248 pontos) antes de usar como seed do catálogo central
- Trocar ordenação por inteiro denso reindexado por esquema tolerante a merge multi-dispositivo (ordem fracionária/LexoRank)
- Adicionar auditoria/soft-delete (createdBy, updatedAt, deletedAt) inexistentes hoje
- Criar .devcontainer com Postgres + api-server + frontend, hoje inexistente no monorepo
- Expandir OpenAPI spec (lib/api-spec) além de /healthz e gerar client real via Orval para as novas entidades

**Riscos:**

- Se o catálogo global for populado copiando o array de storage.ts sem reconciliar com pontos-completo.json, perde-se 136 pontos já existentes em outro dataset e há risco de duplicidade de IDs (ex. lo-1 aparece nos dois arquivos, sem garantia de conteúdo idêntico)
- Migrar 'ordem'/'favorito' tarde demais (depois que já houver usuários reais com dados salvos) obriga a uma migração de dados quebrando referências existentes no export/import JSON dos usuários
- IDs client-side gerados por Date.now()+random podem colidir ao importar backups de dois usuários diferentes para o mesmo catálogo compartilhado, corrompendo referências subcategoriaId/orixaId
- Sem devcontainer e sem schema de banco hoje, qualquer estimativa de prazo para 'produto com login/planos' deve considerar que o backend está em estado de scaffold zero — não é ajuste incremental, é construção do zero

### 3.x Backend / Scaffold

## Backend/Scaffold - Estado de Inventário

**Express 5 + Drizzle ORM + Orval Codegen**: Monorepo com API server em estado parcial.

### O que FUNCIONA (Core Funcionando):
- **Servidor Express**: app.ts + index.ts com middleware chain (pino-http logger, CORS, express.json)
- **Health Check**: GET /healthz retorna {status: "ok"} com validação Zod
- **Drizzle ORM Setup**: Pool PostgreSQL, DATABASE_URL validada, drizzle.config.ts correto
- **Orval Codegen Pipeline**: MONTADO E PRONTO
  - Input: lib/api-spec/openapi.yaml (spec OpenAPI 3.1)
  - Output 1: React Query client (lib/api-client-react/src/generated) - modo split
  - Output 2: Zod schemas (lib/api-zod/src/generated) - modo split, coerce habilitado
  - Sincronizados via titleTransformer customizado

### O que é PLACEHOLDER/VAZIO:
- **lib/db/src/schema/index.ts**: Exporta {} vazio - NENHUMA tabela real definida (só comentários de exemplo)
- **OpenAPI spec**: Contém APENAS /healthz, sem rotas de negócio
- **Zero rotas CRUD**: Sem endpoints para usuario, orixas, subcategorias, pontos, auth
- **Zero autenticação**: Sem JWT, sessions, middlewares de proteção
- **Zero validação de input**: Schemas Zod não mapeados nas rotas

### Pipeline Codegen Exato:
`openapi.yaml` → Orval → {React Query hooks em api-client-react/generated + Zod types em api-zod/generated}

Ambos em modo split (1 file per endpoint), coerce ativo para query/param/body/response, custom mutator (custom-fetch.ts).
Regenerar com: `orval` (na pasta lib/api-spec/)

**Lacunas para virar produto:**

- Zero tabelas BD: NENHUMA tabela definida em lib/db/src/schema/index.ts (obriga criar tabelas usuarios, orixas, subcategorias, pontos, sessoes, etc)
- Zero rotas CRUD: Sem endpoints GET/POST/PUT/DELETE de negócio (orixas, pontos, usuarios, sync, etc)
- Zero autenticação: Sem JWT, sessions, login, middlewares de proteção de rotas, contexto de usuário
- Zero migrations Drizzle: Sem drizzle/migrations, sem script `npm run db:migrate`
- Zero seed/fixtures: Sem dados iniciais de orixas/pontos no BD
- Zero testes backend: Sem testes unitários/integração
- Zero validação de input nas rotas: Schemas Zod gerados mas não usados em middlewares
- Zero documentação Orval: Sem guia de como executar `orval`, quando regenerar spec, workflow CI/CD
- Frontend desconectado: App React ainda usa localStorage puro, zero chamadas ao backend
- DATABASE_URL obrigatória mesmo sem schema: Erro na inicialização app se BD_URL não existir

**Riscos:**

- lib/db/index.ts lança erro fatal se DATABASE_URL não definida - impossível rodar server em ambiente sem BD configurado
- Orval pipeline requer manual regeneração: sem hook pré-commit/CI, risco de spec.yaml desincronizar com código gerado
- HealthCheck usa schema Zod (HealthCheckResponse) importado de workspace que pode quebrar se orval regenerar incorretamente
- Zero separação concerns nas rotas: rota health.ts mistura lógica com middleware, sem factory/wrapper de validação reutilizável

### 3.x Infra & Deploy

## Inventário de Infra/Build/Deploy

**Projeto**: Umbanda Ponto Organizer (monorepo pnpm). Node 24, TypeScript 5.9.

### Build e Typecheck

**Typecheck** (package.json raiz):
- `pnpm run typecheck:libs`: executa `tsc --build` (project references + composite) sobre lib/*
- `pnpm run typecheck`: roda typecheck:libs + filtered typecheck em artifacts/** e scripts
- Cada artifact tem seu próprio `tsc -p tsconfig.json --noEmit`

**Build** (Vercel via vercel.json):
- Frontend (@workspace/pontos-umbanda): `vite build` → artifacts/pontos-umbanda/dist (SPA estática)
  - Vite 7 + React 19 + Tailwind 4 + VitePWA (PWA offline)
- Backend (api-server): `node ./build.mjs` → esbuild com esbuildPluginPino, gera .mjs
  - Atualmente: apenas GET /healthz (scaffold vazio)
  - Requer DATABASE_URL (throw em lib/db/src/index.ts se não definido)

### Frontend no Vercel (Hoje)

**vercel.json** define deploy:
- buildCommand: `pnpm --filter @workspace/pontos-umbanda build`
- outputDirectory: artifacts/pontos-umbanda/dist
- installCommand: pnpm install
- SPA rewrites: todas rotas → /index.html
- APENAS FRONTEND (backend não é usado)

App: 100% localStorage (chave "pontos-umbanda-data"), ~248 pontos seedados hardcoded, React Context, @dnd-kit, busca com highlight, favoritos, export/import JSON.

### Resíduos Replit

**.replit**:
- deploymentTarget: "autoscale" (infraestrutura Replit)
- artifacts: api-server, mockup-sandbox (não usados)
- postBuild: pnpm store prune
- postMerge hook: scripts/post-merge.sh (tenta `pnpm --filter db push` - Drizzle migrations)
- Agent stack: PNPM_WORKSPACE, expertMode=true

### Política de Segurança de Deps

**pnpm-workspace.yaml**:
- **minimumReleaseAge: 1440 (1 dia)** - defesa supply-chain attacks
- minimumReleaseAgeExclude: @replit/*, stripe-replit-sync (confiáveis)
- Platform-specific overrides: esbuild, lightningcss, rollup para Linux-only (otimização Replit)
- Catalog: React 19.1.0, Vite 7, Tailwind 4, Drizzle, React Query pinadas

**.npmrc**: apenas auto-install-peers=false, strict-peer-dependencies=false

### O Que Falta para Produto Real

**CI/CD**: Nenhum GitHub Actions, GitLab CI, ou pipeline declarado. Sem .github/workflows.

**Dev Container**: Sem .devcontainer (o dono quer: "tudo instalado/rodado em dev container, trabalhar sempre de dentro")

**Dockerização**: Sem Dockerfile, docker-compose

**Secrets e Variáveis de Ambiente**: Nenhuma defined. Sem .env, .env.example. DATABASE_URL exigido por lib/db mas não existe.

**Ambientes**: Apenas produção (Vercel). Sem staging, dev, test.

**Banco de Dados Gerenciado**: lib/db/src/schema/index.ts está vazio (só comentários/placeholder). Drizzle scripts (push/push-force) não podem rodar sem DATABASE_URL e schema real. Nenhuma Postgres/AWS RDS/managed provisionado.

**Backend Persistente**: Express 5 scaffold vazio, só GET /healthz. Sem endpoints para auth, users, sync multi-dispositivo, dados server-side. api-server não é deployado no Vercel.

**Auth/Login**: 100% localStorage, sem login backend, JWT, OAuth, multi-device sync.

**Planos/Pagamento**: Sem Stripe/integração assinatura (pnpm-workspace.yaml menciona stripe-replit-sync excluído, legacy Replit Stripe mockup).

**Compartilhamento**: Sem multi-usuário, terreiros, sharing de pontos.

**Hospedagem Backend**: Sem host definitivo (AWS, Railway, Fly.io, etc.). Replit artifacts (api-server, mockup-sandbox) não são publicados."

**Lacunas para virar produto:**

- CI/CD Pipeline: GitHub Actions (test, typecheck, build, publish) ou equivalente
- Dev Container: .devcontainer/devcontainer.json com Node 24, pnpm, Postgres, todas ferramentas (objetivo dono)
- Docker: Dockerfile (multi-stage), docker-compose.yml (backend + Postgres + Redis) para dev/prod
- Secrets Management: .env.example template, GitHub Secrets (DATABASE_URL, API_KEY, STRIPE_KEY), OIDC trusted publisher
- Environments: staging vs prod (URLs, DB, cache, logging separados)
- Database Schema: lib/db/src/schema/* com Drizzle tables (users, pontos, orixas, subcategorias com user_id, etc). Postgres gerenciado (AWS RDS, Vercel Postgres, Supabase)
- Auth Backend: Express endpoints POST /auth/login, /auth/register, /auth/logout, JWT ou sessions
- Multi-Device Sync: API endpoints para sincronizar pontos/estado entre dispositivos do mesmo usuário
- Planos/Pagamento: Stripe integration (checkout, webhooks, subscription management)
- Backend Deployment: Vercel Functions, Railway, Fly.io, AWS ECS, ou similar para Express 5 + API
- Compartilhamento: Endpoints para compartilhar pontos entre usuários, criar/gerenciar terreiros
- Error Tracking: Sentry ou equivalente (telemetria de erros em produção)

**Riscos:**

- DATABASE_URL não definido: postMerge.sh tenta drizzle push em deploymentTarget Replit autoscale, causará erro se DB não existir. Bloqueia migrations. Arquivo: scripts/post-merge.sh, lib/db/src/index.ts
- API Server não deployado: vercel.json só publica frontend. Backend Express 5 é abandonware (só /healthz). Nenhum endpoint para dados server. Arquivo: vercel.json, artifacts/api-server/package.json
- Schema vazio: lib/db/src/schema/index.ts é placeholder. Drizzle tables não existem. Migrations não podem rodar.
- Resíduos Replit na produção: .replit configura autoscale Replit, mas Vercel ignora (vercel.json prevalece). Confusão sobre qual deploy é ativo. Arquivo: .replit vs vercel.json
- Sem typecheck no Vercel: vercel.json não roda typecheck antes de build (só build). Código com erros TS pode ser deployado.
- Expo/React Native legacy: pnpm-workspace.yaml exclui @expo/ngrok-bin platforms (react 19.1.0 pinned exatamente por Expo). Sem Expo target hoje, apenas web. Arquivo: pnpm-workspace.yaml líneas 58-61
- Node 24 Beta: .replit usa Node 24, que é beta/experimental. Sem suporte long-term. Vercel pode usar LTS diferente.

### 3.x Mercado & Domínio

## Domínio e mercado — "Umbanda Ponto Organizer"

### Personas
1. **Ogã/Curimbeiro** — toca atabaque e canta; é quem mais sofre a dor de "achar o ponto na hora", com as mãos ocupadas, pouca luz, gira em andamento. Hoje usa caderno físico, PDF impresso ou Word herdado do ogã anterior.
2. **Pai/Mãe de Santo (dirigente da casa)** — "dono" do repertório oficial do terreiro; decide sequência ritual (Chegada → Louvação → Trabalho → Curimba → Demanda → Cruzado/Despedida) e quer padronizar a letra entre os membros da própria casa (cada terreiro/linha canta uma variante diferente da "mesma" cantiga).
3. **Médium/cambone** — canta mas não é dono do repertório; usuário passivo que quer aprender a letra nova antes da próxima gira.
4. **Estudante/iniciante** — perfil mais educacional, tolera conteúdo curado sobre história e significado dos pontos.
5. **O terreiro como entidade coletiva (B2B)** — múltiplos membros compartilhando um mesmo acervo "oficial" da casa, com hierarquia de permissão (dirigente edita, ogãs/médiuns consultam).

### A dor real
Decorar letras (há muitas variações regionais e "de casa" para a "mesma" cantiga); organizar o repertório da gira do dia; achar o ponto certo em tempo real durante o ritual (mobile-first, ambiente barulhento); padronizar entre os membros do terreiro para não haver dissonância cantando junto; e preservar o acervo oral da casa (risco real de perda quando um dirigente falece ou o terreiro fecha — tradição é 100% oral/manuscrita).

### B2C vs B2B
- **B2C** (o que o app já faz hoje): organizador pessoal — repertório próprio, favoritos, busca. Monetização provável: freemium de baixo ticket (busca avançada, backup em nuvem, sync multi-dispositivo, remoção de anúncio).
- **B2B** (oportunidade real de produto): "workspace do terreiro" — conta coletiva com papéis (dirigente=admin, ogã=editor, médium=leitor), repertório oficial da casa compartilhado em tempo real, setlist da gira do dia visível a todos os membros. É o análogo do "Planning Center" para igrejas ou apps de setlist para bandas, mas para terreiros — esse é o eixo de maior disposição a pagar coletiva, pois dilui o custo entre a casa.

### Apps análogos (corroborado via busca)
- **Pontos Cantados de Umbanda** (Google Play/App Store) — biblioteca de pontos com letra + vídeo, freemium (premium remove ads, busca avançada por palavra, export em PDF). Concorrente direto mais maduro, já com anos de mercado.
- **SaravÁpp Pontos de Umbanda** e **Umbanda – Tudo sobre** — apps de conteúdo/descoberta (letras, áudio, orações, curiosidades).
- **pontosdeumbanda.com.br** — portal de referência com letras, toques e curiosidades.
- Análogos fora do domínio: Cifra Club (cifras musicais, comunidade edita/corrige), apps de setlist para bandas (OnSong, Setlist Helper), hinários digitais de igrejas evangélicas e Planning Center Services (staff scheduling + repertório compartilhado para igrejas) — o modelo de "hinário oficial + busca + favoritos + apresentação ao vivo compartilhada" é o mais próximo do que o produto pode virar.
- **Diferencial potencial do Umbanda Ponto Organizer**: os concorrentes existentes são bibliotecas de *descoberta/consumo* de pontos de terceiros; o produto atual é uma ferramenta de *organização do próprio repertório/da própria casa* — esse é o ângulo de diferenciação, não replicar biblioteca de conteúdo.

### Sensibilidade religiosa
- Pontos são tradição oral, sem autoria clara — baixo risco de copyright clássico, mas alto risco de "mercantilização de algo sagrado" ser mal vista pela comunidade se o modelo de cobrança parecer explorar a fé.
- Umbanda tem histórico real de intolerância religiosa no Brasil; qualquer superfície pública/UGC precisa de moderação cuidadosa (evitar exposição descontextualizada de pontos de Exu/Pomba-Gira para público leigo, evitar comentários depreciativos entre linhas/nações diferentes — Umbanda Branca, Cruzada, Omolokô, Almas e Angola etc. têm letras e práticas distintas).
- Se houver conteúdo gerado por usuário compartilhado entre terreiros, é preciso curadoria: uma letra "errada" ou de outra vertente pode ofender a linha de uma casa.

### Disposição a pagar
Sem dados de mercado confiáveis para citar números — o público praticante de Umbanda no Brasil é historicamente subdeclarado em censos (sincretismo, estigma social), então o TAM real é incerto por natureza. Pelos concorrentes observados (freemium de baixo ticket, tipicamente removendo anúncios/recursos avançados), a inferência razoável é: ticket individual baixo (mais próximo de poucos reais/mês que de assinaturas premium caras); o modelo B2B/terreiro tende a ser mais promissor economicamente porque dilui custo entre membros — mas terreiros costumam operar com caixa apertado (autossustentados por doação), então o preço por casa precisa ser muito baixo ou testado com cautela.

**Lacunas para virar produto:**

- Nenhuma modelagem de dados ou fluxo para 'repertório oficial do terreiro' compartilhado entre múltiplos usuários com papéis (dirigente/ogã/médium) — pré-requisito para o caso B2B, que parece ser o eixo de monetização mais defensável
- Nenhuma política de moderação/curadoria de conteúdo definida para o cenário em que pontos passem a ser compartilhados entre usuários ou terreiros diferentes (risco de letra incorreta ou desrespeitosa entre vertentes/linhas)
- Nenhuma pesquisa primária com o público-alvo real (ogãs, dirigentes de terreiro) sobre disposição a pagar, canais de aquisição atuais (grupos de WhatsApp, cadernos físicos) e o que os concorrentes existentes deixam a desejar — a análise aqui é inferência qualitativa, não validação de mercado
- Nenhuma definição de posicionamento/marketing que diferencie explicitamente 'ferramenta de organização do meu/nosso repertório' de 'biblioteca de pontos para descobrir/consumir' (onde os concorrentes já atuam)
- Nenhuma diretriz de tom/linguagem para comunicação pública da marca que evite tanto a mercantilização de algo sagrado quanto o exotismo/sensacionalismo em torno da religião

**Riscos:**

- Baixa disposição a pagar do público individual (padrão observado nos concorrentes freemium de baixo ticket) pode não sustentar um modelo de assinatura B2C robusto sozinho
- Terreiros como clientes B2B tendem a ter caixa apertado (autossustentados por doação), limitando o ticket viável do plano coletivo mesmo sendo o eixo de maior potencial
- Concorrente 'Pontos Cantados de Umbanda' já tem anos de mercado e tração — diferenciação clara em 'organização do repertório próprio/da casa' (vs. biblioteca de descoberta) é necessária para não competir de frente em desvantagem
- Risco de intolerância religiosa e trollagem caso a plataforma exponha conteúdo publicamente ou permita comentários/UGC sem moderação — Umbanda tem histórico documentado de discriminação no Brasil
- Fragmentação de 'verdade': cada terreiro considera sua própria letra a correta; apresentar uma versão 'canônica' única de um ponto pode gerar atrito religioso/cultural com usuários de outras vertentes (Umbanda Branca, Cruzada, Omolokô, Angola etc.)
- Cobrar por acesso a conteúdo de tradição oral sagrada pode ser percebido como mercantilização inadequada pela própria comunidade, exigindo comunicação cuidadosa sobre o que exatamente está sendo pago (organização/ferramenta, não a 'posse' das letras)

## 4. Definição do MVP

ENTRA NO MVP (Fundação + Backend mínimo + Auth + migração localStorage→conta):
- Dev Container completo (.devcontainer com Docker Compose: app Node 24 + Postgres 16 local), toda infra rodando dentro do container, sem instalar nada no host. Já desenhado pela frente de infra.
- Schema Drizzle integrado populando `lib/db/src/schema/` (hoje vazio): tabelas do Better-Auth (user/session/account/verification/consent_log) + domínio com discriminador `escopo ∈ {canonical,user,org}` + `user_ponto_state`/`user_orixa_state`/`user_subcategoria_state` (favorito/ordem/anotação por-usuário) + `pontos-completo.json` (384) como biblioteca canônica semeada com dedup por hash. `drizzle-kit push` em dev; `generate`+`migrate` em prod.
- Better-Auth self-hosted no `api-server`: Email OTP (primário) + magic link + email/senha + Google. Cookie httpOnly + sessão no Postgres. Dois consentimentos LGPD separados (Termos + dado sensível religioso) em `consent_log`.
- Rota de negócio mínima: `POST /api/account/import-local-data` (transacional, idempotente por `legacy_id`/`clientMigrationId`, dedup por hash, nunca apaga o localStorage). Leitura server-authoritative dos dados da conta.
- Frontend: `wouter` de verdade (rotas `/`, `/orixa/:id`, `/login`, `/conta`), `AuthProvider`, `RotaProtegida`, `DataRepository` (Local + Remote), tela de onboarding pós-login que detecta e migra os dados locais. `gerarId()` → `crypto.randomUUID()`. Remover `ModalReorganizar.tsx` morto.
- Ganho grátis embutido (puro frontend, zero backend): Modo Apresentação/Karaokê (tela cheia, Wake Lock, fonte grande, auto-scroll) e compartilhamento Nível 0 (base64 na URL para WhatsApp).
- Deploy: `vercel.json` com proxy `/api/*`→Fly (same-origin); Dockerfile no `api-server` reaproveitando `build.mjs`; `fly launch` region `gru`; Supabase `sa-east-1`; primeiro `.github/workflows` (typecheck + build + deploy).

NÃO ENTRA NO MVP (fases seguintes):
- Pagamento/planos/paywall (Mercado Pago, entitlements, `subscriptions`) — Fase 2.
- Sync incremental bidirecional real (IndexedDB, outbox, delta-pull, Background Sync, fractional index, tombstones) — Fase 3. No MVP o multi-dispositivo é básico (2º aparelho puxa da conta; escrita otimista simples com LWW).
- Terreiros/colaboração, papéis, setlist compartilhado, plugin `organization` — Fase 4.
- Apple login (só com app nativo iOS), R2 para assets, observabilidade avançada, migração AWS.
- Curadoria/moderação do catálogo canônico aberto à comunidade (no MVP o catálogo é curado/fechado).

## 5. Roadmap

### Fase 0 — Fundação / Dev Container / Backend mínimo
**Duração estimada:** 1-2 semanas

Ambiente 100% dentro do container, schema real no Postgres, seed canônico, e um ganho de produto visível sem backend.

- Criar .devcontainer (devcontainer.json + docker-compose.yml + Dockerfile) e .env.example; validar pnpm install + Postgres 16 local + drizzle push dentro do container
- Popular lib/db/src/schema (Better-Auth tables + domínio com escopo + user_*_state + billing provider-agnóstico) com CHECK de coerência escopo↔dono, índice fracionário e dedup por hash; drizzle-kit push
- Seed canônico a partir de pontos-completo.json (384 pontos, 12 orixás, 42 subs) com hash de letra normalizada; script pnpm --filter @workspace/db run seed
- Frontend Fase 1: introduzir wouter real (/, /orixa/:id), extrair DataRepository/LocalRepository de storage.ts, gerarId()→crypto.randomUUID(), remover ModalReorganizar.tsx
- Modo Apresentação/Karaokê (tela cheia + Wake Lock + auto-scroll) e compartilhamento Nível 0 (base64 na URL) — puro frontend, zero backend, valor imediato na gira

### Fase 1 — MVP: Auth + Conta + Migração localStorage→conta (deploy)
**Duração estimada:** 3-4 semanas

Usuário cria conta, faz login, migra seus dados locais para a nuvem e os vê em outro aparelho — sem quebrar o uso sem conta.

- Pacote lib/auth com Better-Auth (Email OTP primário + magic link + email/senha + Google), adapter Drizzle, cookie httpOnly + sessão no Postgres, scrypt
- Montagem no api-server: app.all('/api/auth/*') ANTES do express.json(); middleware requireAuth populando req.user; dois consentimentos LGPD em consent_log
- Endpoint POST /api/account/import-local-data (transacional, idempotente, dedup por hash) + GET /api/account/export (portabilidade LGPD); expandir openapi.yaml + rodar orval
- Frontend: AuthProvider, RotaProtegida, telas Login/Cadastro/Conta, tela de decisão 'continuar sem conta', modal de migração pós-login com preview e confirmação
- Infra de deploy: vercel.json proxy /api/*→Fly (same-origin, credentials:include no custom-fetch); Dockerfile+fly.toml region=gru + healthcheck /healthz; Supabase sa-east-1; Resend p/ email; primeiro GitHub Actions (typecheck+build+deploy)

### Fase 2 — Planos e Pagamento (Mercado Pago)
**Duração estimada:** 2-3 semanas

Fechar o funil de receita depois que conta e nuvem existem: cobrar pela ferramenta, nunca pela letra.

- Pacote @workspace/billing com interface PaymentProvider (impl. Mercado Pago); tabelas plans/subscriptions (userId XOR orgId)/billing_events (idempotente por providerEventId), features/limites em JSONB
- Serviço getEntitlements + middleware requireFeature autoritativo (HTTP 402); GET /api/me/entitlements + hook Orval; POST /api/billing/checkout (Pix/QR) e POST /api/webhooks/mercadopago (assinatura verificada, raw body antes do express.json, idempotente)
- Tiers: Grátis (R$0) / Pro R$9,90-mês·R$79,90-ano·Vitalício R$249 / Terreiro R$39,90-mês·R$399-ano; trial 14 dias sem cartão; rebaixa p/ grátis sem sequestrar dados
- Frontend: <Gate>/PaywallGate no ponto de fricção, tela Planos, botão 'Assinar com Pix', linguagem 'sustente a preservação' (nunca 'desbloqueie os pontos')
- Remover resíduo stripe-replit-sync; adicionar mercadopago ao catalog respeitando minimumReleaseAge

### Fase 3 — Sync offline-first incremental (produto robusto na gira)
**Duração estimada:** 3-4 semanas

Sync bidirecional tolerante a offline e a dois dispositivos simultâneos, sem regressão para quem usa sem conta.

- Migrar store local de localStorage para IndexedDB (idb/dexie) com object stores por entidade + store outbox; Context vira async/otimista com estados salvando/erro/pendente
- Endpoints GET /api/v1/sync/changes?since=<cursor> (inclui tombstones) e POST /api/v1/sync/mutations (fila idempotente por mutationId); updatedAt server-authoritative + deletedAt
- Índice fracionário (LexoRank) em user_*_state e itens de coleção substituindo ordem inteira densa; reconciliação push-primeiro-depois-pull
- Background Sync API (tag sync-outbox) com fallback obrigatório iOS (online/visibilitychange/boot); IndicadorSync no header; versionamento /api/v1 + schemaVersion no payload

### Fase 4 — Terreiros / Colaboração (B2B, o fosso competitivo)
**Duração estimada:** 3-4 semanas

Workspace coletivo da casa: repertório oficial, gira do dia compartilhada, papéis — a maior disposição a pagar.

- organizacoes + membros_organizacao (papéis proprietario/dirigente/editor/leitor) + plugin organization do Better-Auth; conteúdo escopo='org'
- Coleções/setlist ('gira do dia') com compartilhamento em tempo real na casa; convite por e-mail/link; assinatura de escopo terreiro no billing
- Frontend: tela Terreiro (membros, papéis, repertório oficial como escopo explícito no DataRepository), gating médium=leitor reforçado no backend
- Política de conteúdo/moderação entre linhas e nações (Exu/Pomba-Gira fora de contexto); tier social/gratuito para casas sem condição (curadoria manual leve)

### Fase 5 — Hospedagem definitiva / Escala / R2 (por gatilho, não calendário)
**Duração estimada:** Contínuo; 1-2 semanas quando o gatilho ocorrer

Endurecer operação e abrir caminho AWS só quando um gatilho concreto disparar.

- Cloudflare R2 (egress zero) para áudio/PDF quando storage entrar; PII sempre no Postgres sa-east-1 por LGPD
- Observabilidade (logs pino estruturados, métricas, alertas), backups automatizados e testados, jobs de limpeza (sessões/tombstones/logs) via pg-boss portável
- Migração AWS opcional por gatilho (B2B enterprise/SOC2, volume p/ Reserved Instances, rede privada): Fly→ECS Fargate, Supabase→RDS via pg_dump, R2→S3 por endpoint — DevOps, não reescrita
- Endurecimento de segurança: rate limit de borda, WAF, auditoria de scrypt→argon2id se exigido, revisão LGPD/DPA dos operadores

## 6. Hospedagem (decisão do painel)

**Vencedor:** Vercel + Fly.io (gru) + Supabase (São Paulo) — PaaS de baixa operação com região Brasil

No estágio MVP → primeiros milhares, o gargalo do dono (solo/time pequeno) é entregar as lacunas de PRODUTO — login, banco na nuvem, sync, pagamento Pix — não escalabilidade elástica. Ponderei Simplicidade (30%) e Custo/Adequação BR (25% cada) acima de Escalabilidade (20%). A opção Vercel+Fly+Supabase vence porque reaproveita ~100% do scaffold existente (Drizzle só precisa de DATABASE_URL, Express sobe como está no Fly gru, Orval intacto), fecha as 3 lacunas (Postgres+Auth+Storage) num só painel, não regride o frontend Vercel já funcional, e coloca API+banco colocalizados em São Paulo com custo pré-receita de ~US$8/mês. A AWS foi rejeitada explicitamente (não por default): piso fixo do Aurora (~US$44/mês desde o dia 1), semanas de curva para um time pequeno, e seus próprios furos admitidos (Stripe com Pix fraco força Mercado Pago mesmo assim; SES em sandbox; Cognito tosco em pt-BR) anulam a vantagem de 'ficar 100% AWS' justamente no critério Brasil. A opção Cloudflare ficou em quase-empate (perdeu por 0,05) e vence em custo/pagamentos BR — por isso a recomendação híbrida rouba dela o R2 (egress zero para áudio/PDF) e o Mercado Pago (Pix nativo, LGPD nativa) para plugar na base vencedora. O caminho de migração à AWS fica aberto por gatilhos concretos (B2B enterprise, volume p/ Reserved Instances, rede privada) porque tudo é Docker+Postgres+Drizzle sem lock-in — migração é DevOps, não reescrita; o único atrito real (Supabase Auth) é mitigado desde já mantendo userId próprio na tabela users.

| Opção | Custo | Simplicidade | Escalabilidade | Adequação BR | Total |
|---|---|---|---|---|---|
| Vercel + Fly.io (gru) + Supabase (São Paulo) | 8.5 | 7.5 | 8 | 8.5 | **8.1** |
| Cloudflare + Supabase (SP) + Fly.io (GRU) + R2 + Mercado Pago (Híbrido BR) | 9 | 6.5 | 8 | 9 | **8.05** |
| AWS Puro (S3+CloudFront, Lambda+API GW, Aurora Serverless v2, Cognito) | 4 | 3 | 9.5 | 6.5 | **5.43** |

## Decisão: começar gerenciado (Vercel + Fly.io `gru` + Supabase `sa-east-1`), AWS só depois — se/quando

**Pesos usados** (estágio MVP → primeiros milhares): Simplicidade 30%, Custo 25%, Adequação Brasil 25%, Escalabilidade 20%. Nessa fase o gargalo do dono não é infraestrutura elástica — é **entregar login + banco + sync + pagamento** com um time minúsculo, reaproveitando o scaffold que já existe (Drizzle vazio, Express `/healthz`, Orval montado). A escalabilidade máxima da AWS resolve um problema que o produto **ainda não tem**, cobrando por isso desde o dia 1.

### Por que a opção vencedora

1. **Reaproveita ~100% do scaffold, zero reescrita.** Supabase é Postgres puro: `lib/db` (Drizzle) só precisa do `DATABASE_URL`. O Express 5 de `artifacts/api-server` sobe no Fly.io como está (o `build.mjs`/esbuild já gera o `.mjs`). O pipeline Orval/OpenAPI continua idêntico — só passa a descrever rotas reais. Nada de `aws-lambda-web-adapter`, CDK, IAM ou Data API driver-split.
2. **Fecha as 3 lacunas de produto num só painel.** As lacunas reais mapeadas na fase 1 — login (não existe uma linha de auth), banco na nuvem (schema vazio), storage (áudio/PDF futuros) — são exatamente Postgres + Auth (GoTrue) + Storage do Supabase, no mesmo projeto. Um dashboard a menos para um dono solo operar.
3. **Não regride o que já funciona.** O frontend fica no Vercel; o `vercel.json` já faz o SPA rewrite correto e o PWA/offline não muda. A opção Cloudflare exige trocar Vercel→Pages (`wrangler.toml`) — retrabalho num pedaço que já está redondo, sem ganho relevante nesta fase.
4. **Latência BR de verdade.** Fly.io `gru` + Supabase `sa-east-1` = API e banco colocalizados em São Paulo (round-trip submilissegundo), e Vercel Edge serve o estático com PoP no Brasil. Isso mata o antipadrão "API no BR, banco nos EUA" (150–200 ms/request) sem a complexidade multi-AZ da AWS.
5. **Custo condizente com pré-receita.** ~US$5–10/mês no MVP; ~US$70–100/mês fixos em ~5k usuários. A AWS tem **piso** do Aurora Serverless v2 (~US$44/mês, 0,5 ACU) cobrado mesmo com zero uso — inaceitável para validar produto.

### Por que NÃO AWS agora (e por que não é "por padrão")

A própria proposta AWS admite os dois furos que derrubam sua vantagem no nosso contexto: (a) **Stripe tem Pix fraco**, então para público majoritariamente brasileiro você acaba integrando Mercado Pago/Pagar.me de qualquer jeito — anulando o "fica 100% AWS"; e (b) **SES exige sair do sandbox + aquecer reputação** e **Cognito Hosted UI é tosco** para pt-BR. Some a isso semanas de curva (VPC/IAM/CDK/Secrets Manager, driver-split dev/prod do Data API, LocalStack que não emula Cognito/Data API no free) para um time pequeno. AWS entrega **escalabilidade** que não precisamos, cobrando em **tempo de setup e piso de custo** que doem justamente onde estamos frágeis.

### O quase-empate com a opção Cloudflare (e o que roubar dela)

A opção 3 perdeu por **0,05** — praticamente empate — e vence em custo/pagamentos BR (Mercado Pago = Pix nativo, empresa brasileira sob LGPD, menor atrito cultural para ogãs/dirigentes; R2 com **egress zero** é decisivo se o produto servir áudio/PDF a milhares). Ela perde em simplicidade: troca do Vercel que já funciona, `pg-boss` disputando CPU/conexões com a API no mesmo container, e Mercado Pago tem DX de webhook pior que Stripe (mais lento de plugar no scaffold Express agora).

**Recomendação híbrida (cherry-pick):** adote a opção 2 como base, mas **importe duas ideias da opção 3 assim que o storage e o pagamento entrarem em cena**:
- **Storage de assets → Cloudflare R2** em vez de Supabase Storage, pelo egress zero (só blobs não-PII; mantenha PII sempre no Postgres `sa-east-1` por LGPD).
- **Pagamento → começar com Mercado Pago (Pix)**, não Stripe, dado o público-alvo. Stripe fica como plano B para cobrança internacional. Concretamente: rota `/api/webhooks/mercadopago` no Express + tabela `subscriptions` no `lib/db`.

Ou seja: **Vercel + Fly.io `gru` + Supabase `sa-east-1` + R2 + Mercado Pago** — o melhor dos dois mundos gerenciados.

---

## Roteiro de implementação (reaproveitando o scaffold)

1. **Schema Drizzle** (`lib/db/src/schema/index.ts`, hoje vazio): modelar `users`, catálogo (`orixas`/`subcategorias`/`pontos` com `ownerId` NULL=global vs autoral), **`user_ponto_state` (favorito + ordem por usuário)** — resolvendo o problema estrutural nº 1 detectado na fase 1: hoje `favorito`/`ordem` vivem dentro do `Ponto` compartilhável. Trocar `gerarId()` client-side por UUID/ULID server-side. `drizzle-kit push` apontando para o Supabase.
2. **Auth**: middleware Express validando JWT do Supabase Auth (JWKS público) → popula `req.user`. Cobre login/signup/magic-link/OAuth Google sem construir sessão na mão.
3. **API**: expandir `lib/api-spec/openapi.yaml` com as rotas de negócio, rodar `orval` para regenerar `api-client-react`/`api-zod` (pipeline já montado). Ligar `@tanstack/react-query`/`@workspace/api-client-react` (hoje dependências mortas) às telas.
4. **Frontend**: introduzir `wouter` (já instalado, nunca usado) para rotas reais (`/orixa/:id`) — pré-requisito para auth-gating; refatorar o `AppProvider` (hoje 100% síncrono sobre localStorage) para estados de loading/erro/optimistic.
5. **Deploy**: `Dockerfile` simples em `api-server` reaproveitando o `build.mjs`; `fly launch` com `region = gru` fixado no `fly.toml` e healthcheck em `/healthz` (já existe). Primeiro `.github/workflows` do repo (typecheck + build + deploy).
6. **Dev container** (pedido do dono): `.devcontainer/devcontainer.json` + `docker-compose.yml` com Postgres local **na mesma major do Supabase**, api-server e frontend — trabalho 100% dentro do container, `DATABASE_URL` apontando para o Postgres local (nunca depender do Supabase em dev). Fecha a lacuna de que hoje não há `.devcontainer` nem Dockerfile.
7. **Migração do localStorage**: tela de onboarding pós-login que lê o `exportarDados()` (formato `AppData` já existente) e faz POST em lote, mapeando IDs legados (`legacyId`) para os UUIDs do servidor, separando "cópia pessoal editável" do catálogo global (reconciliar com `pontos-completo.json`, 384 pontos, superset do seed em uso).

---

## Caminho de migração futura para AWS (gatilhos explícitos, não calendário)

**Nada aqui fecha a porta da AWS.** Tudo roda em **container Docker padrão + Postgres padrão + Drizzle** (sem lock-in tipo Lambda/DynamoDB/Cognito). Migrar depois é **exercício de DevOps, não reescrita de aplicação**.

Migre **somente se** um destes gatilhos disparar:
- **B2B/enterprise sério**: um cliente-terreiro grande ou parceiro exige contratualmente AWS/GCP, SOC2 formal, VPC peering ou DPA específico.
- **Volume que justifique Reserved Instances / Savings Plans**: quando o custo variável gerenciado passar consistentemente o equivalente AWS otimizado (tipicamente bem acima dos ~US$100/mês).
- **Necessidade de rede privada real** (peering, isolamento) que os PaaS não entregam.

**Como seria a migração (baixo atrito):**
- API: `Dockerfile` do Fly.io → **ECS Fargate** (ou App Runner) em `sa-east-1`, quase inalterado.
- Postgres: `pg_dump`/`pg_restore` do Supabase → **RDS/Aurora**; Drizzle só troca o `DATABASE_URL`.
- Auth: ponto de maior atrito — Supabase Auth acopla `auth.users`/JWT. Mitigação **desde já**: manter `userId` próprio na tabela `users` (o JWT sub como chave externa), para uma futura troca por Cognito/Auth0/Clerk ser reconciliação de IDs, não migração de sessões.
- Storage: se já estiver em R2 (S3-compatible), migrar para S3 é trocar endpoint/credenciais.
- Frontend: Vercel → S3+CloudFront é mecânico (mesmo `dist/` do Vite).

**Regra de ouro para preservar a opção:** nada de SDK proprietário no caminho crítico (sem RLS como única camada de autorização, sem Edge Functions Supabase para lógica de negócio, sem `pg_cron` para jobs que precisarão de fila real). Autorização no middleware Express, jobs via `pg-boss` (portável), catálogo/preferências em tabelas Drizzle limpas.

## 7. Frentes de design (detalhe técnico)

### 7.x Autenticação e Contas de Usuário — Umbanda Ponto Organizer

> Contexto de partida: hoje existem **zero usuários**, o app é 100% localStorage (`pontos-umbanda-data`), e o backend (`artifacts/api-server`, `lib/db`) é um scaffold vazio (só `GET /healthz`, sem tabelas). Este documento assume que o produto continuará funcionando **sem conta** (modo local) e que "criar conta" é uma escolha opt-in que dispara uma migração explícita dos dados locais.

---

## 1. Decisão central: biblioteca self-hosted vs. auth gerenciado

### 1.1 Comparativo

| Opção | O que é | Encaixe no stack atual (Express 5 + Drizzle + Postgres + monorepo pnpm) | Riscos/limites |
|---|---|---|---|
| **Auth.js (NextAuth)** | Lib de auth originada no ecossistema Next.js | Tem core framework-agnostic, mas o suporte a Express puro é de segunda classe; sessão/DB adapter exige mais código manual; magic link/OTP/organizações não são cidadãos de primeira classe | Ecossistema otimizado para Next; menos maduro para "workspace de terreiro" com papéis |
| **Lucia** | Era uma lib "roll your own auth" leve | **Descontinuada como biblioteca** (o projeto migrou para ser só um guia/tutorial desde 2024, sem pacote npm mantido ativamente) | Não recomendável iniciar projeto novo sobre ela hoje |
| **Better-Auth** | Framework de auth self-hosted, TypeScript-first, adapter oficial para Drizzle+Postgres, monta como middleware Express | **Alto encaixe**: roda dentro do próprio `api-server`, usa o `@workspace/db` (Postgres) que já existe, schema Drizzle gerado automaticamente casa com o pedido literal do produto ("tabelas `users`, `sessions`, `accounts`, `verification`"), plugins prontos para magic link, email-OTP, social login, rate limit e — crucial para a visão B2B do dono — plugin de **`organization`** (papéis/times), que mapeia quase 1:1 para "terreiro com dirigente/ogã/médium" | Biblioteca ainda jovem (mas com adoção rápida e mantenedores ativos); você assume operação (mas isso é o que o dono já quer: tudo em Postgres, sob controle, dev container, AWS) |
| **Clerk** (gerenciado) | SaaS de auth com UI pronta | Muito rápido de integrar, ótima DX | Vendor lock-in forte: usuários "moram" no Clerk, não no seu Postgres; precificação por MAU escala mal para um produto de nicho/baixo ticket como este; modelar "terreiro" como conta coletiva fica menos natural (tudo teria que ser espelhado via webhooks); conflita com o objetivo do dono de ter tudo sob controle próprio/AWS/devcontainer |
| **Supabase Auth (GoTrue)** | Auth gerenciado, geralmente acoplado ao Postgres do Supabase | Dá para usar standalone, mas isso reintroduz a complexidade de rodar o GoTrue você mesmo — sem ganhar nada sobre usar Better-Auth direto no seu próprio Postgres | Empurra a stack para a infra do Supabase, contrariando o plano de Postgres próprio em AWS |

### 1.2 Recomendação

**Better-Auth, self-hosted, dentro do `artifacts/api-server`, usando o Postgres já provisionado via `@workspace/db`.**

Motivos concretos:
1. As tabelas que o próprio pedido do produto lista (`users`, `sessions`, `accounts`, `verification`) são **literalmente o schema padrão do Better-Auth** — zero reinvenção.
2. Zero vendor lock-in: os dados de conta ficam no mesmo Postgres dos dados de domínio (orixás/pontos), o que simplifica JOIN, migração de dados locais, backup e a futura mudança para AWS RDS.
3. Cobre os três métodos pedidos (email+senha, magic link/OTP, Google/Apple) via plugins oficiais, sem código de criptografia/token feito à mão.
4. O plugin `organization` do Better-Auth é o caminho mais curto para o eixo B2B identificado pela pesquisa de mercado (workspace do terreiro: dirigente=admin, ogã=editor, médium=leitor) — não precisa ser ativado agora, mas evita reescrever auth quando isso vier.
5. Roda como middleware Express comum — nenhuma migração de framework, nenhum edge runtime exigido.

**Quando reconsiderar Clerk**: só se houver pressão extrema de prazo para lançar um MVP em poucos dias e o dono aceitar pagar o custo de migração depois. Não recomendado dado o objetivo explícito de manter tudo sob controle próprio.

---

## 2. Métodos de autenticação

| Método | Papel no produto | Observação |
|---|---|---|
| **Email + código OTP (6 dígitos)** | **Primário recomendado** | Persona típica (ogã/dirigente) não é necessariamente tech-savvy; digitar um código é mais robusto que clicar em link de email quando o email é lido num aparelho diferente do celular usado na gira (PWA mobile-first) |
| **Magic link** | Secundário/alternativa ao OTP | Mesmo fluxo de email, oferecido como opção "clique no link" para quem preferir; mesmo endpoint de envio, plugin `magicLink` |
| **Email + senha** | Opcional, para quem já tem esse hábito | `requireEmailVerification: false` no login (não bloqueia entrar), mas features sensíveis (export de dados, exclusão de conta) exigem `emailVerified = true` |
| **Google (social)** | Disponível já na v1 | Menor fricção para quem já usa Gmail no Android (maioria do público mobile no Brasil) |
| **Apple (social)** | Planejado, não bloqueante | Só é *obrigatório* pelas regras da App Store se/quando existir um **app nativo iOS**; hoje o produto é PWA, então não é mandatório — implementar quando o dev container e a conta Apple Developer ($99/ano) estiverem prontos |

Todos os métodos convergem para o mesmo `user`, com **account linking automático por email verificado** (`accountLinking.trustedProviders: ["google"]`) para evitar contas duplicadas quando alguém usa Google e depois tenta email+senha com o mesmo endereço.

---

## 3. Gestão de sessão: cookie httpOnly vs JWT

| Aspecto | Cookie httpOnly + sessão no Postgres (Better-Auth default) | JWT stateless |
|---|---|---|
| Revogação (logout remoto, dispositivo roubado, troca de senha) | Instantânea — apaga a linha em `session` | Impossível sem blocklist adicional (reintroduz estado, perde a vantagem) |
| Superfície de ataque XSS | Cookie `httpOnly` não é legível por JS — token não pode ser exfiltrado por script malicioso | Se guardado em `localStorage`, é lido por qualquer XSS |
| Exigido pelo domínio sensível (dados religiosos) | Favorece — dá controle fino de "derrubar sessão agora" | Desfavorece |
| Uso futuro (app nativo/mobile) | Cookie não viaja bem entre apps nativos | JWT/Bearer é o padrão nesse cenário |

**Recomendação**: cookie `httpOnly; Secure; SameSite=Lax` com sessão persistida em `session` (Postgres) como mecanismo **primário** para a PWA web — é o default do Better-Auth, não exige código extra. Guardar `session.token` hasheado, `expiresIn` 30 dias com `updateAge` de 1 dia (renovação deslizante). Ativar `cookieCache` (cache de ~60s) para não bater no Postgres em toda request.

Quando existir cliente nativo (React Native, se vier a acontecer), ativar o **plugin `bearer`** do Better-Auth: emite um token opaco validado contra a mesma tabela `session` via header `Authorization`, em vez de inventar um sistema JWT paralelo.

**Problema prático a resolver — cookie cross-site**: o frontend está no Vercel e o backend provavelmente ficará noutro domínio (AWS). Cookie cross-site exige `SameSite=None` e sofre bloqueios do Safari/ITP. **Solução recomendada**: reaproveitar o `vercel.json` (já faz SPA rewrites) para também fazer proxy de `/api/*` para o backend, tornando a chamada **same-origin** do ponto de vista do navegador:

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://api.pontosdeumbanda.app/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Isso elimina a necessidade de `SameSite=None`, simplifica CORS e evita problemas de terceiros no Safari.

---

## 4. Fluxos

### 4.1 Cadastro (email+senha) e verificação de email
1. `POST /api/auth/sign-up/email { name, email, password, consentimentoDadosReligiosos: true }` (checkbox **não pré-marcada** — ver seção LGPD).
2. Better-Auth cria `user (emailVerified=false)` + `account (providerId="credential", password=<hash>)`.
3. Hook `sendVerificationEmail` dispara email com link (token em `verification`, TTL 30 min, uso único).
4. Sessão já é criada no cadastro (login liberado) — reduz fricção — mas o app mostra um banner "confirme seu email" e o middleware bloqueia `export`/`delete account` até `emailVerified=true`.
5. Ao clicar no link → `emailVerified=true`, `autoSignInAfterVerification: true`, redireciona para `/app` com toast de sucesso → dispara a checagem de migração de dados locais (seção 6).

### 4.2 Magic link / Email OTP
- `POST /api/auth/sign-in/magic-link { email }` ou `POST /api/auth/email-otp/send-verification-otp { email }`.
- Se o email não existe ainda, o próprio clique/código **cria a conta** (email já provado = `emailVerified: true` de saída — sem passo de verificação separado).
- TTL curto (10–15 min), uso único, invalida-se após consumo.

### 4.3 Login social (Google/Apple)
- `GET /api/auth/sign-in/social?provider=google` → callback em `/api/auth/callback/google`.
- Redirect URI a cadastrar no Google Cloud Console: `https://api.pontosdeumbanda.app/api/auth/callback/google` (ou via o domínio proxied do Vercel, se optar por unificar origem também no OAuth).
- Antes de persistir o `user` na primeira vez, interceptar com hook `after` para exibir a tela de consentimento (Termos + dado sensível religioso) — OAuth não pode pular esse passo.

### 4.4 Reset de senha
1. `POST /api/auth/forget-password { email }` → **resposta genérica 200 sempre** (não revela se o email existe — anti enumeration).
2. Se existe, token hasheado em `verification` (TTL 30 min, uso único), email com link de reset.
3. `POST /api/auth/reset-password { token, newPassword }` → ao suceder, **invalidar todas as outras sessões ativas** do usuário (apagar linhas em `session` exceto a atual, ou todas + forçar novo login).

---

## 5. Segurança

| Tópico | Recomendação |
|---|---|
| **Hashing de senha** | Usar o default do Better-Auth (**scrypt**, memory-hard, sem binding nativo — importante para builds multi-arch em dev container/Docker). Argon2id é tecnicamente a recomendação nº1 da OWASP, mas exige `node-argon2` (binding nativo), o que complica imagem Docker multi-stage; deixar isso como *swap* documentado (`emailAndPassword.password.hash/verify` customizados) caso uma auditoria de segurança futura exija argon2id explicitamente. **Não usar bcrypt** para sistema novo (trunca input em 72 bytes, sem parâmetro de memória, pior resistência a GPU/ASIC que scrypt/argon2). |
| **Rate limiting** | Camada 1: rate limiter nativo do Better-Auth (`rateLimit: { enabled: true }`), com regras mais agressivas nas rotas `sign-in/email`, `forget-password`, `email-otp/send-verification-otp` (ex.: 5 tentativas / 5 min por IP+email). Camada 2: rate limit de borda (Vercel/AWS WAF ou `express-rate-limit` na frente do Express) como defesa em profundidade. |
| **Enumeração de usuário** | Respostas genéricas em login/reset ("se esse email existir, enviamos instruções"), nunca "email não encontrado". |
| **Sessão sensível** | Exigir sessão "fresca" (reautenticação ou re-verificação de código nos últimos 15 min) para: mudar email, mudar senha, excluir conta, exportar todos os dados. |
| **Auditoria** | Tabela `consent_log` (seção 7) + log estruturado (pino, já usado no `api-server`) de eventos de auth (login, falha de login, reset, exclusão de conta) — nunca logar senha/token em texto claro. |
| **Transporte/infra** | Cookies `Secure` (HTTPS obrigatório mesmo em dev container via mkcert/proxy local), `CORS` com origin explícita (não wildcard) porque `credentials: true` é incompatível com `*`. |

### 5.1 LGPD — atenção especial: dado religioso é dado sensível

A LGPD (Art. 5º, II) classifica **dado sobre convicção religiosa como dado pessoal sensível**. O simples fato de alguém ter uma conta em "Umbanda Ponto Organizer" já revela filiação religiosa. Isso muda o tratamento em relação a um SaaS genérico:

- **Base legal**: consentimento **específico e destacado** (Art. 11, I) — não basta um checkbox genérico de "Termos de Uso". Recomenda-se **dois consentimentos separados** no cadastro:
  1. Aceite de Termos de Uso / Política de Privacidade (genérico).
  2. "Entendo que os dados desta conta estão associados à minha prática/interesse na Umbanda e autorizo o tratamento para esta finalidade" (específico, Art. 11-I).
- **Minimização**: coletar só email (+ nome opcional). Não pedir CPF/telefone sem necessidade concreta (ex.: só se/quando existir cobrança).
- **Direitos do titular**:
  - Acesso/portabilidade: `GET /api/account/export` reaproveitando o formato já existente de `exportarDados()` — o app **já tem** essa funcionalidade, só precisa de uma versão server-side.
  - Eliminação: `DELETE /api/account` com **soft-delete + janela de 30 dias** (email de confirmação, cancelável) antes do hard delete em cascata — evita perda acidental/maliciosa.
- **Registro de consentimento**: tabela `consent_log` (versão da política aceita, timestamp, IP, user agent) — evidência em caso de auditoria.
- **Papéis**: hoje o dono do produto (sabormane@gmail.com) é o controlador; provedores terceiros (Google/Apple OAuth, provedor de email transacional tipo Resend/SES) são operadores — checar DPA/termos desses fornecedores antes de ir a produção. Preferir provedor de email com datacenter em região adequada (ex.: AWS SES `sa-east-1`) se possível, já que o plano de hospedagem é AWS.
- **Não usar** os emails coletados para nada além da finalidade declarada (nada de "compartilhar com parceiros" sem novo consentimento específico).

---

## 6. Onboarding: "usar sem conta" → "criar conta e migrar dados locais"

Princípio: **a promessa atual do app (funciona sem login) não pode ser quebrada.** Conta é 100% opt-in.

1. **Dia 1 (hoje)**: app abre direto em modo local, sem qualquer tela de auth no caminho crítico.
2. Na tela de Configurações/Backup (onde já existe export/import JSON), adicionar um card: **"Fazer backup na nuvem e sincronizar entre aparelhos"** com botão "Criar conta".
3. Ativar finalmente as rotas reais com `wouter` (já instalado, hoje não usado): `/entrar`, `/criar-conta`, `/verificar-email`, e proteger `/app/*` conforme sessão.
4. Tela de cadastro oferece, nesta ordem de destaque: **código por email (OTP)** → Google → email+senha.
5. **Pós-signup + verificado**, o client detecta `localStorage['pontos-umbanda-data']` não vazio e ainda não migrado, e mostra modal: *"Encontramos N pontos salvos neste aparelho. Deseja migrar para sua conta?"* com contagem de orixás/subcategorias/pontos/favoritos.
6. Confirmado → reaproveita **100% da função `exportarDados()` já existente** → `POST /api/account/import-local-data` com o `AppData` inteiro + um `clientMigrationId` (idempotency key).
7. Servidor, dentro de **uma transação Drizzle**: gera novo UUID para cada entidade, preserva o ID antigo em `legacyId` (rastreabilidade/debug — cobre tanto os IDs semânticos do seed, ex. `sub-oxossi-louvacao`, quanto os `timestamp-random` gerados em runtime), insere como registros `ownerId = user.id`, marca `users.migratedFromLocalStorageAt = now()`.
8. **Idempotência**: se o endpoint for chamado de novo para o mesmo `clientMigrationId` ou se `migratedFromLocalStorageAt` já estiver setado, retorna 409 e oferece "mesclar mesmo assim" como ação **explícita separada** — nunca duplica automaticamente.
9. **Nunca apagar o localStorage automaticamente** após migrar — o dado tem valor de confiança; oferecer "Apagar dados locais agora que estão na nuvem" como ação opcional na tela de sucesso.
10. **Falha no meio do import** → transação inteira revertida (Postgres), localStorage permanece intacto, UI mostra erro claro.
11. **Segundo dispositivo** faz login sem dado local → puxa direto os dados da conta via API, sem modal de migração.
12. **Edge case (dado local em dois aparelhos diferentes antes de criar conta)**: no 2º aparelho, se o servidor já tem dados **e** o localStorage local também não está vazio, oferecer "Mesclar" (por título+subcategoria, como dedup aproximada) em vez de sobrescrever — sempre com preview e confirmação explícita, nunca automático.

---

## 7. Tabelas (Drizzle) — estilo do repositório (`@workspace/db`)

Novo pacote de workspace `lib/auth` (`@workspace/auth`) hospeda a configuração do Better-Auth; o **schema Drizzle** gerado por ele vive em `lib/db/src/schema/auth.ts`, reexportado por `lib/db/src/schema/index.ts` (hoje vazio) — segue exatamente o padrão já documentado no placeholder do arquivo.

```ts
// lib/db/src/schema/auth.ts
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),

  // Campos de produto (além do schema padrão do Better-Auth)
  plan: text("plan").notNull().default("free"), // billing detalhado fica em doc de planos/pagamento
  migratedFromLocalStorageAt: timestamp("migrated_from_local_storage_at"),
  privacyPolicyVersion: text("privacy_policy_version"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),   // id do usuário no provedor (ex.: sub do Google)
  providerId: text("provider_id").notNull(), // 'credential' | 'google' | 'apple'
  password: text("password"),                // hash — só quando providerId = 'credential'
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(), // email (ou email+propósito)
  value: text("value").notNull(),           // token/código, hasheado
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// LGPD: registro de consentimento (obrigatório dado o caráter sensível/religioso do dado)
export const consentLog = pgTable("consent_log", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  consentType: text("consent_type").notNull(), // 'terms' | 'privacy' | 'religious_data'
  policyVersion: text("policy_version").notNull(),
  acceptedAt: timestamp("accepted_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});
```

> Nota: as tabelas de domínio (`orixas`, `subcategorias`, `pontos`, `user_ponto_state`) pertencem à seção de modelagem de dados/sync, não a esta seção de auth — aqui só cabe registrar que elas ganharão `ownerId: text("owner_id").references(() => user.id)`.

---

## 8. Como conectar ao monorepo (Express + Drizzle + Orval)

### 8.1 Novo pacote `lib/auth`

```ts
// lib/auth/src/index.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP, magicLink } from "better-auth/plugins";
import { db } from "@workspace/db";
import * as schema from "@workspace/db/schema";
import { sendVerificationEmail, sendResetPasswordEmail, sendOtpEmail, sendMagicLinkEmail } from "./email";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL!,
  trustedOrigins: [process.env.FRONTEND_URL!],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => sendResetPasswordEmail(user.email, url),
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => sendVerificationEmail(user.email, url),
    autoSignInAfterVerification: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    // apple: { ... } — habilitar quando houver app nativo iOS
  },
  account: { accountLinking: { enabled: true, trustedProviders: ["google"] } },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 },
  },
  rateLimit: { enabled: true, window: 60, max: 10 },
  plugins: [
    emailOTP({ sendVerificationOTP: async ({ email, otp }) => sendOtpEmail(email, otp) }),
    magicLink({ sendMagicLink: async ({ email, url }) => sendMagicLinkEmail(email, url) }),
    // organization(), // fase B2B "terreiro" (dirigente/ogã/médium)
  ],
});
```

### 8.2 Montagem no `api-server`

```ts
// artifacts/api-server/src/app.ts
import { toNodeHandler } from "better-auth/node";
import { auth } from "@workspace/auth";

// IMPORTANTE: montar ANTES do express.json() — o Better-Auth faz seu próprio body parsing
app.all("/api/auth/*", toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use("/api", router); // rotas de domínio continuam aqui
```

```ts
// artifacts/api-server/src/middlewares/require-auth.ts
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "@workspace/auth";
import type { RequestHandler } from "express";

export const requireAuth: RequestHandler = async (req, res, next) => {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session) return res.status(401).json({ error: "unauthorized" });
  (req as any).user = session.user;
  (req as any).session = session.session;
  next();
};
```

### 8.3 Onde o pipeline OpenAPI/Orval entra (e onde não entra)

As rotas `/api/auth/*` são geridas inteiramente pelo Better-Auth e **não devem** ser modeladas em `lib/api-spec/openapi.yaml` — usar o cliente oficial (`better-auth/client` + `better-auth/react`, hooks `useSession`, `signIn`, `signOut`) no frontend para essas chamadas. O pipeline Orval (`openapi.yaml` → React Query hooks em `lib/api-client-react` + Zod em `lib/api-zod`) continua reservado só para as rotas de **domínio** (orixás, pontos, migração de dados locais, futura sync) — essas sim ganham `requireAuth` como middleware e schemas Zod validados.

### 8.4 Variáveis de ambiente novas

```
DATABASE_URL=...                # já existe
BETTER_AUTH_SECRET=...          # gerar com openssl rand -base64 32
BETTER_AUTH_URL=https://api.pontosdeumbanda.app
FRONTEND_URL=https://pontosdeumbanda.app
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
RESEND_API_KEY=...              # ou SMTP_* — envio de email transacional (OTP/verificação/reset)
EMAIL_FROM="Umbanda Ponto Organizer <contato@pontosdeumbanda.app>"
```

Adicionar `better-auth` ao `catalog` do `pnpm-workspace.yaml` com versão pinada — **não** incluir em `minimumReleaseAgeExclude` (é pacote crítico de segurança, deve respeitar a janela de 1 dia como qualquer outro).

### 8.5 Dev container

`docker-compose` do futuro `.devcontainer` deve subir Postgres local + `api-server` com essas envs (secret de dev fixo, `BETTER_AUTH_URL=http://localhost:PORT`), permitindo `pnpm --filter @workspace/db push` criar as tabelas de auth junto com as de domínio no primeiro boot — sem infra externa para desenvolver o fluxo de login.

---

## 9. Fora de escopo aqui (apontado, não desenvolvido)

- Modelagem completa de `orixas`/`subcategorias`/`pontos` multi-tenant e estratégia de sync (documento de dados/migração).
- Planos/assinatura/Stripe (`user.plan` é só um campo placeholder).
- Plugin `organization` do Better-Auth para o workspace de terreiro (papéis dirigente/ogã/médium) — desenhar quando o eixo B2B for priorizado.


**Decisões desta frente:**

- **Biblioteca de auth: Better-Auth self-hosted (não Auth.js, não Lucia, não Clerk/Supabase Auth)** → Adotar Better-Auth com adapter Drizzle sobre o Postgres já provisionado em @workspace/db, montado como middleware dentro de artifacts/api-server
  - _Racional:_ Zero vendor lock-in, schema padrão (user/session/account/verification) casa literalmente com o que o produto pediu, cobre email+senha/magic-link/OTP/social via plugins oficiais, e tem plugin de organization pronto para a futura conta coletiva de terreiro (eixo B2B identificado na pesquisa de mercado)
- **Modelo de sessão** → Cookie httpOnly + Secure + SameSite=Lax com sessão persistida em tabela session no Postgres (default do Better-Auth); adotar plugin bearer/JWT só quando existir cliente nativo/mobile
  - _Racional:_ Permite revogação instantânea de sessão (importante dado o caráter sensível/religioso dos dados) e evita os problemas de blocklist de JWT stateless; resolver cross-origin via proxy no vercel.json em vez de SameSite=None
- **Hashing de senha** → Usar o default scrypt do Better-Auth; documentar caminho de swap para argon2id se auditoria de segurança futura exigir
  - _Racional:_ scrypt é memory-hard e não exige binding nativo (node-argon2), o que simplifica build multi-arch em Docker/dev container; bcrypt descartado por limitações (truncamento em 72 bytes, sem parâmetro de memória)
- **Método de login primário** → Priorizar Email OTP (código de 6 dígitos) como método de destaque, com magic link e email+senha como alternativas, e Google como opção de baixa fricção
  - _Racional:_ Persona (ogã/dirigente) não é necessariamente tech-savvy e frequentemente lê o email num aparelho diferente do celular usado na gira (PWA mobile-first) — código digitável é mais robusto que link clicável nesse cenário
- **Consentimento LGPD** → Exigir dois consentimentos separados no cadastro: Termos/Privacidade genéricos + consentimento específico para dado sensível religioso (Art. 11-I da LGPD), registrados em tabela consent_log
  - _Racional:_ A LGPD classifica dado sobre convicção religiosa como dado pessoal sensível (Art. 5º-II); a mera existência de uma conta no app já revela filiação religiosa, exigindo base legal reforçada além de um checkbox genérico
- **Migração de dados locais** → Fluxo opt-in explícito pós-verificação de email: reaproveitar exportarDados() existente, endpoint transacional POST /api/account/import-local-data com idempotency key, nunca apagar localStorage automaticamente
  - _Racional:_ Preserva a promessa atual de 'funciona sem conta', evita perda de confiança/dado em caso de falha, e cobre o edge case de dado local em múltiplos dispositivos antes da criação da conta via fluxo de merge explícito

**Questões abertas:** (Login social Apple entra em qual milestone — só quando/se existir app nativo iOS (não é obrigatório para PWA), ou o dono quer priorizar mesmo assim por paridade de marca?); (Qual provedor de email transacional usar (Resend, AWS SES, Postmark)? Afeta custo, DX e residência de dados (relevante dado o caráter sensível do dado religioso).); (Login pré-verificação de email deve ser permitido (menor fricção) ou bloqueado até verificar (mais seguro)? Este documento assume permitido com features sensíveis gateadas.); (O plugin organization (workspace de terreiro com papéis) deve ser desenhado agora junto com a auth individual, ou fica para uma fase 2 depois que a conta pessoal estiver validada com usuários reais?); (Qual a política de retenção de sessões/logs de auth expirados (job de limpeza periódico) e por quanto tempo manter dados de contas soft-deletadas antes do hard delete?)

---

### 7.x Monetização, Planos e Paywall — Blueprint Estratégico

## Monetização, Planos e Paywall

### 1. Princípio-guia (posicionamento antes de preço)

A decisão mais importante desta seção não é o valor da assinatura — é **o que exatamente está sendo cobrado**. Pontos cantados são tradição oral, sem autoria, patrimônio coletivo da comunidade. Cobrar "pela letra" é, além de eticamente frágil, comercialmente arriscado: expõe o produto à acusação de mercantilizar o sagrado, num público historicamente vítima de intolerância e desconfiado de exploração.

**Regra inegociável de produto:** o acervo curado que já vem seedado (os ~248/384 pontos) e qualquer ponto que o usuário cadastre são **sempre grátis de ver, buscar e favoritar**. Nunca colocamos um cadeado em cima de uma letra. O que se cobra é a **ferramenta ao redor**: nuvem, sincronização entre dispositivos, backup versionado, modo apresentação mãos-livres, PDF e — o eixo mais forte — o **workspace coletivo do terreiro**.

Frase-âncora para toda a comunicação de marketing e telas de upgrade:

> "As cantigas são de todos e sempre serão gratuitas aqui. O que você assina é a ferramenta que organiza, guarda na nuvem e preserva o repertório da sua casa."

Isso reposiciona o gesto de pagar de "comprar fé" para "sustentar a preservação e a organização" — o mesmo enquadramento moral de doação/manutenção que os terreiros já entendem.

**Diretriz sobre anúncios:** o concorrente maduro ("Pontos Cantados de Umbanda") monetiza com ads e vende o "premium sem anúncios". Recomendo **não** replicar ads dentro da experiência ritual (tela de ponto, modo apresentação, gira em andamento). Ads em cima de conteúdo religioso durante o uso ritual reforçam exatamente a percepção de mercantilização que queremos evitar, e o ganho por impressão no Brasil é baixo. Se houver ads algum dia, que fiquem restritos a telas de descoberta/institucionais — não é o caminho recomendado no MVP.

---

### 2. Modelo escolhido

**Freemium com assinatura recorrente (mensal/anual), acrescido de um tier vitalício "Apoiador" e um tier B2B "Terreiro/Casa".**

Justificativa dos quatro componentes:

- **Freemium generoso** — o app hoje já entrega valor real 100% local. Manter isso grátis é o motor de aquisição orgânica (boca a boca em grupos de WhatsApp de terreiro). Fricção baixa: não exigir conta para usar o grátis.
- **Recorrência mensal/anual** — receita previsível. Anual com desconto forte porque o público é sensível a preço e a cobrança recorrente mensal no cartão tem alto churn e alta taxa de recusa/estorno no Brasil.
- **Vitalício "Apoiador"** — crucial neste domínio. Muitos praticantes rejeitam "assinatura para sempre" mas topam um pagamento único via **Pix** enquadrado como apoio à preservação. Gera caixa antecipado (importante para bootstrap) e converte quem nunca assinaria recorrência. É também o produto emocionalmente mais alinhado ("ajudei a preservar").
- **B2B Terreiro** — a maior disposição a pagar coletiva e o fosso competitivo real (nenhum concorrente faz "workspace da casa"). Dilui o custo entre os membros.

---

### 3. Tiers concretos

| | **Grátis** (Devoto) | **Pessoal / Pro** (Ogã) | **Terreiro / Casa** (B2B) |
|---|---|---|---|
| **Preço** | R$ 0 | R$ 9,90/mês · R$ 79,90/ano · Vitalício R$ 249 | R$ 39,90/mês · R$ 399/ano |
| **Conta obrigatória** | Não (opcional p/ backup) | Sim | Sim (dono cria a casa) |
| **Acervo curado seedado** | Completo | Completo | Completo |
| **Pontos autorais** | Ilimitados **no dispositivo** | Ilimitados **na nuvem** | Ilimitados, compartilhados na casa |
| **Dispositivos / sync** | 1 (localStorage) | Multi-dispositivo (sync nuvem) | Multi-dispositivo por membro |
| **Backup** | Manual JSON (já existe) | Automático, versionado na nuvem | Automático + histórico da casa |
| **Busca, favoritos, filtros, drag-drop** | Sim | Sim | Sim |
| **Modo Apresentação / Karaokê** (tela cheia, letra grande, auto-scroll, mãos-livres) | Prévia limitada (ex.: só favoritos) | Completo | Completo |
| **Setlist da Gira do dia** | Não | Pessoal | **Compartilhado em tempo real** com a casa |
| **Export PDF** (caderno/setlist) | Não | Sim | Sim |
| **Papéis e permissões** | — | — | Dirigente (admin), Ogã (editor), Médium (leitor) |
| **Membros** | — | 1 | Até 15 (add-on acima disso) |
| **Selo Apoiador / preservação** | — | Vitalício | Incluído |

Notas de desenho:
- **O grátis é honesto e útil** — é literalmente o app de hoje + acervo. Não degradamos o que já existe; apenas o que é novo (nuvem, apresentação completa, PDF, terreiro) é pago. Isso protege a reputação.
- **Gancho de conversão do Pro:** o par "sync multi-dispositivo + modo apresentação mãos-livres" é a dor #1 do ogã (canta com as mãos no atabaque, celular no chão, gira em andamento). É o recurso que justifica pagar sozinho.
- **Gancho do Terreiro:** "repertório oficial da casa padronizado + gira do dia que todos veem" + o apelo de **preservação do acervo** (risco real de perda quando um dirigente falece). Esse é o argumento emocional de maior peso.
- **Tier social opcional:** considerar conceder Terreiro grátis (ou simbólico) a casas comprovadamente sem condição — reforça a marca como aliada da comunidade, não exploradora. Ver openQuestions.

---

### 4. Trial

- **Trial de 14 dias do Pro, sem cartão**, ativado no signup. No Brasil, exigir cartão para trial derruba conversão (baixa bancarização de crédito, medo de cobrança automática). Sem cartão → mais ativação, e cobramos via Pix/cartão só na conversão explícita.
- **Terreiro:** trial de 14 dias para a casa inteira (todos os membros convidados testam junto). O valor coletivo só aparece com vários membros dentro, então o trial precisa cobrir o onboarding do grupo.
- No fim do trial, a conta **rebaixa para Grátis sem perder dados** (os pontos autorais continuam visíveis e exportáveis; só congela sync/apresentação/PDF). Nunca "sequestrar" o conteúdo do usuário — reforça confiança e é coerente com o posicionamento.

---

### 5. Gateway de pagamento

**Recomendação: Mercado Pago como gateway primário. Stripe fica como opção secundária/futura.**

Racional, ponto a ponto:

- **Pix é obrigatório** (é o meio dominante no Brasil, instantâneo, sem taxa de cartão para o usuário) e **boleto é importante** para o anual e para quem não tem cartão. Mercado Pago tem os dois nativos, com fluxo já familiar ao público (todo mundo tem app do Mercado Pago/Mercado Livre → confiança e menos fricção).
- **Recorrência:** Mercado Pago **Assinaturas (Preapproval API)** cobre cartão recorrente. Para o **vitalício**, usamos Pix/boleto avulso (pagamento único) — que é justamente onde o Pix brilha.
- **Stripe** só recentemente habilitou Pix no Brasil e sua força é cartão internacional/DX superior; mas Pix recorrente ("Pix Automático", regulado pelo BCB) ainda é imaturo em ambos e cartão recorrente tem alta recusa aqui. Como o ticket é baixo e o público é 100% nacional, a familiaridade e o Pix/boleto do Mercado Pago pesam mais que a DX do Stripe.
- **Pagar.me** é uma terceira via válida (boa API, Pix/boleto/cartão, subadquirência) — fica como alternativa se as taxas do Mercado Pago incomodarem em escala.

**Arquitetura de integração (agnóstica ao gateway):** isolar o provedor atrás de uma interface `PaymentProvider` em `lib/` (ou um pacote `@workspace/billing`), para poder trocar Mercado Pago↔Stripe/Pagar.me sem tocar na lógica de assinatura. O que o resto do sistema conhece é o **estado da assinatura** no nosso banco — o gateway só alimenta esse estado via webhook.

> Atenção supply-chain: `pnpm-workspace.yaml` tem `minimumReleaseAge: 1440`. O SDK do Mercado Pago (`mercadopago`) precisará ser adicionado ao `catalog` e respeitará essa quarentena — planejar a versão com antecedência. Há resíduo legado `stripe-replit-sync` no exclude que deve ser removido na limpeza do Replit.

---

### 6. Feature-gating no código (alinhado ao scaffold existente)

O scaffold já tem tudo o que precisamos: `lib/db` (Drizzle + node-postgres, schema barrel **vazio** hoje em `lib/db/src/schema/index.ts`), `api-server` (Express 5 com router em `/api`, respostas validadas por Zod de `@workspace/api-zod`), e o pipeline **Orval** que gera hooks React Query (`@workspace/api-client-react`) + Zod (`@workspace/api-zod`) a partir de `lib/api-spec/openapi.yaml`. Reaproveitamos esse encanamento inteiro.

**Fonte da verdade = nosso banco, não o gateway.** O gateway dispara webhooks; nós materializamos o estado em `subscriptions` e derivamos *entitlements* (o que o usuário pode fazer). Frontend e backend nunca perguntam ao gateway em tempo de request.

#### 6.1 Schema Drizzle (`lib/db/src/schema/billing.ts`)

```ts
import { pgTable, text, integer, timestamp, jsonb, uuid, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";       // criado na trilha de auth
import { terreirosTable } from "./terreiros"; // criado na trilha B2B

// Catálogo de planos — seedado, raramente muda. Features/limites em JSON
// para não exigir migração a cada ajuste de packaging.
export const plansTable = pgTable("plans", {
  code: text("code").primaryKey(),            // 'free' | 'pro' | 'pro_lifetime' | 'terreiro'
  nome: text("nome").notNull(),
  precoMensalCents: integer("preco_mensal_cents"),   // null = não recorrente/free
  precoAnualCents: integer("preco_anual_cents"),
  scope: text("scope").notNull(),             // 'user' | 'terreiro'
  features: jsonb("features").$type<Record<string, boolean>>().notNull(),
  limites: jsonb("limites").$type<Record<string, number>>().notNull(), // ex.: { membros: 15 }
});

export const subStatus = pgEnum("sub_status", [
  "trialing", "active", "past_due", "canceled", "expired",
]);
export const billingInterval = pgEnum("billing_interval", ["month", "year", "lifetime"]);

export const subscriptionsTable = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  // exatamente UM destes é preenchido, conforme plans.scope
  userId: uuid("user_id").references(() => usersTable.id),
  terreiroId: uuid("terreiro_id").references(() => terreirosTable.id),
  planCode: text("plan_code").notNull().references(() => plansTable.code),
  status: subStatus("status").notNull().default("trialing"),
  interval: billingInterval("interval").notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
  cancelAtPeriodEnd: text("cancel_at_period_end"),
  // acoplamento com o gateway, isolado
  provider: text("provider").notNull().default("mercadopago"),
  providerSubId: text("provider_sub_id"),     // id da preapproval
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Log de eventos do gateway — idempotência e auditoria de pagamento
export const billingEventsTable = pgTable("billing_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: text("provider").notNull(),
  providerEventId: text("provider_event_id").notNull().unique(), // dedupe de webhook
  type: text("type").notNull(),
  payload: jsonb("payload").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable);
export type Subscription = typeof subscriptionsTable.$inferSelect;
export type Plan = typeof plansTable.$inferSelect;
```

E ligar no barrel hoje vazio (`lib/db/src/schema/index.ts`), trocando o `export {}` por:

```ts
export * from "./users";
export * from "./terreiros";
export * from "./billing";
// ... demais tabelas (orixas, subcategorias, pontos, user_ponto_state)
```

#### 6.2 Derivação de *entitlements* (serviço no backend)

O resto do código nunca lê `subscriptions` diretamente — pergunta ao serviço de entitlements, que resolve "usuário pertence a um terreiro pago? tem Pro pessoal? trial ativo?" e devolve um objeto plano de capacidades.

```ts
// artifacts/api-server/src/lib/entitlements.ts
export type Entitlements = {
  plan: "free" | "pro" | "terreiro";
  features: {
    cloudSync: boolean;
    apresentacaoCompleta: boolean;
    exportPdf: boolean;
    setlistCompartilhado: boolean;
  };
  limites: { membros: number };
};

export async function getEntitlements(userId: string): Promise<Entitlements> {
  // 1) assinatura de terreiro do qual é membro tem precedência
  // 2) senão, assinatura pessoal (pro/lifetime) ativa ou em trial
  // 3) senão, free
  const sub = await resolveActiveSubscription(userId); // status in (trialing, active)
  const plan = sub ? await getPlan(sub.planCode) : FREE_PLAN;
  return { plan: plan.scope === "terreiro" ? "terreiro" : plan.code as any,
           features: plan.features as any, limites: plan.limites as any };
}
```

#### 6.3 Checagem no backend (middleware Express 5)

Segue o padrão já usado em `routes/health.ts` (router em `/api`, validação Zod). O gate é **server-side e autoritativo** — o frontend só espelha.

```ts
// artifacts/api-server/src/middleware/requireFeature.ts
export const requireFeature = (feature: keyof Entitlements["features"]) =>
  async (req, res, next) => {
    const ent = await getEntitlements(req.userId); // setado pelo middleware de auth
    if (!ent.features[feature]) {
      return res.status(402).json({ error: "upgrade_required", feature, plan: ent.plan });
    }
    next();
  };

// uso:
router.post("/pontos/:id/export-pdf", requireFeature("exportPdf"), exportPdfHandler);
router.put("/terreiros/:id/setlist",  requireFeature("setlistCompartilhado"), setSetlist);
```

Regra: todo recurso pago tem o gate **no endpoint que o executa** (gerar PDF, gravar setlist, sincronizar). Nunca confiar só no frontend — mesmo que a UI esconda o botão, o backend recusa com **HTTP 402** (`Payment Required`, semântica perfeita aqui).

#### 6.4 Checagem no frontend (React 19 + React Query via Orval)

Adicionar `GET /api/me/entitlements` ao `openapi.yaml`, rodar `orval` (pipeline já montado) → nasce o hook `useGetMeEntitlements()`. Envolver a UI com um provider e um componente `<Gate>`:

```tsx
// src/billing/Gate.tsx
export function Gate({ feature, children, fallback }: {
  feature: keyof Entitlements["features"];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const { data } = useEntitlements();            // wrapper do hook gerado pelo Orval
  if (data?.features[feature]) return <>{children}</>;
  return <>{fallback ?? <UpgradeCTA feature={feature} />}</>;
}

// uso na TelaSubcategorias / CardPonto:
<Gate feature="apresentacaoCompleta"
      fallback={<BotaoApresentacao bloqueado onClick={abrirPaywall} />}>
  <BotaoApresentacao />
</Gate>
```

O `<UpgradeCTA>` abre o **paywall** (uma tela/sheet com os tiers, preços e botão "Assinar com Pix"). Importante: o paywall aparece **no ponto de fricção** (usuário tentou usar o recurso), não como parede na entrada do app.

#### 6.5 Webhook do gateway

Nova rota (segue o mesmo router `/api`), idempotente via `billing_events.providerEventId`:

```ts
// artifacts/api-server/src/routes/webhooks.ts
router.post("/webhooks/mercadopago", verifyMpSignature, async (req, res) => {
  const evt = req.body;
  const inserted = await recordEventOnce(evt.id, evt);   // ON CONFLICT DO NOTHING
  if (!inserted) return res.sendStatus(200);             // já processado
  await syncSubscriptionFromProvider(evt);               // atualiza subscriptions
  res.sendStatus(200);
});
```

Fluxo de compra: frontend chama `POST /api/billing/checkout` → backend cria preapproval/preferência no Mercado Pago → devolve URL/QR Pix → usuário paga → **webhook** confirma → `subscriptions.status = active` → próximo `GET /me/entitlements` já libera. Nunca liberar recurso no retorno do checkout (não confiável); só via webhook.

---

### 7. Interação com a migração de dados (dependência crítica)

O gating de plano **depende** da trilha de auth + banco multi-tenant estar de pé (hoje inexistente: sem `users`, sem sync, dados presos no localStorage). Sequência recomendada:

1. Auth + `users` + sync do repertório pessoal para a nuvem (transforma o app local no Pro).
2. `plans`/`subscriptions` + entitlements + paywall (esta seção).
3. Terreiro (papéis, membership, setlist compartilhado) — desbloqueia o B2B.

Ou seja: **billing não é a primeira coisa a construir** — é o que fecha o funil depois que sync e conta existem. Cobrar por "nuvem" antes de a nuvem existir é impossível. O único recurso pago que já poderia ser gated hoje sem backend completo é o **modo apresentação** e o **PDF** (ambos client-side), mas sem conta não há a quem cobrar — então billing entra junto com auth/sync.

---

### 8. Projeção simples de receita (ILUSTRATIVA)

Aviso metodológico honesto: **não há TAM confiável** para praticantes de Umbanda (censos subdeclaram religiões afro-brasileiras por estigma). Os números abaixo são **cenários de sensibilidade sobre uma base de usuários ativos hipotética**, não previsão. Servem para calibrar metas de conversão, não para promessa de faturamento.

Premissas de ticket (blended, considerando mix mensal/anual/vitalício amortizado):
- Pro efetivo ≈ **R$ 7/mês** por assinante (peso do anual e do vitalício amortizado em ~24 meses puxa abaixo do preço de tabela).
- Terreiro efetivo ≈ **R$ 33/mês** por casa.

| Cenário | MAU | Conv. Pro | Assinantes Pro | Receita Pro/mês | Terreiros | Receita Terreiro/mês | **MRR total** | **ARR aprox.** |
|---|---|---|---|---|---|---|---|---|
| Conservador | 5.000 | 1,5% | 75 | R$ 525 | 10 | R$ 330 | **~R$ 855** | ~R$ 10 mil |
| Base | 15.000 | 3% | 450 | R$ 3.150 | 40 | R$ 1.320 | **~R$ 4.470** | ~R$ 54 mil |
| Otimista | 40.000 | 5% | 2.000 | R$ 14.000 | 150 | R$ 4.950 | **~R$ 18.950** | ~R$ 227 mil |

Leituras estratégicas:
- **B2C sozinho é receita modesta** com ticket baixo — coerente com o perfil de baixa disposição a pagar individual observado nos concorrentes. Serve para cobrir custo de infra e validar, não para ser negócio grande sozinho.
- **O terreiro carrega desproporcionalmente** o valor por unidade (R$ 33 vs R$ 7) e é onde o produto tem fosso competitivo. Cada 100 terreiros pagantes ≈ toda a base Pro do cenário base. **A tese de negócio deve mirar o B2B**, com o B2C funcionando como funil de aquisição barato que traz os dirigentes para dentro.
- Vitalício/Apoiador não aparece como MRR mas gera **caixa antecipado** que ajuda a bancar o desenvolvimento inicial — tratar como financiamento, não como receita recorrente.

---

### 9. Sensibilidade religiosa — checklist de execução

- Nunca colocar cadeado sobre uma letra individual. Paywall só sobre ferramenta/nuvem/coletivo.
- Linguagem do paywall: "sustente a preservação", "guarde o repertório da sua casa" — nunca "desbloqueie os pontos".
- Sem ads sobre conteúdo ritual.
- Tier social/gratuito para casas sem condição (a decidir) — sinaliza que o produto serve a comunidade.
- Modo apresentação e qualquer superfície pública precisam respeitar sensibilidade entre linhas/nações (Exu/Pomba-Gira fora de contexto, variantes de casa) — isso é política de conteúdo, mas afeta o que se pode "compartilhar" nos tiers pagos.


**Decisões desta frente:**

- **Cobrar por conteúdo (letras dos pontos) vs. cobrar pela ferramenta ao redor** → Nunca colocar paywall sobre letras. Cobrar exclusivamente por nuvem/sync, backup versionado, modo apresentação completo, export PDF e workspace do terreiro. Acervo seedado e pontos autorais sempre grátis de ver/buscar/favoritar.
  - _Racional:_ Pontos são tradição oral sem autoria, patrimônio coletivo. Cobrar pela letra é eticamente frágil e comercialmente arriscado num público vítima de intolerância e desconfiado de exploração do sagrado. Reposicionar o pagamento como sustentação da ferramenta/preservação neutraliza a objeção de mercantilização.
- **Modelo de monetização** → Freemium generoso + assinatura recorrente mensal/anual (Pro) + tier vitalício 'Apoiador' via Pix + tier B2B 'Terreiro/Casa'.
  - _Racional:_ Grátis útil = motor de aquisição orgânica (WhatsApp de terreiro). Anual reduz churn. Vitalício via Pix converte quem rejeita recorrência e gera caixa antecipado para bootstrap. B2B é o maior valor por unidade e o único fosso competitivo real (nenhum concorrente faz workspace da casa).
- **Tiers e preços em BRL** → Grátis (R$0); Pessoal/Pro R$9,90/mês, R$79,90/ano, Vitalício R$249; Terreiro R$39,90/mês, R$399/ano (até 15 membros).
  - _Racional:_ Público sensível a preço, ticket individual baixo confirmado pelos concorrentes. Anual com desconto forte porque cartão recorrente tem alto churn/recusa no Brasil. Terreiro dilui custo entre membros e captura a disposição a pagar coletiva.
- **Gateway de pagamento (Stripe vs Mercado Pago vs Pagar.me)** → Mercado Pago como primário (Pix + boleto nativos, Assinaturas/Preapproval para cartão recorrente, familiaridade do público). Isolar atrás de interface PaymentProvider para trocar depois. Stripe/Pagar.me secundários.
  - _Racional:_ Pix é dominante e boleto essencial no Brasil; público 100% nacional já confia no Mercado Pago. Stripe só recentemente tem Pix e sua vantagem (cartão internacional/DX) é irrelevante aqui. Vitalício usa Pix avulso, onde o Pix brilha.
- **Arquitetura de feature-gating** → Fonte da verdade no nosso Postgres (tabelas plans/subscriptions/billing_events em Drizzle no barrel hoje vazio). Gateway alimenta estado só via webhook idempotente. Serviço getEntitlements deriva capacidades. Middleware requireFeature autoritativo no Express (HTTP 402). Frontend espelha via GET /api/me/entitlements (hook Orval) e componente <Gate>.
  - _Racional:_ Reaproveita todo o scaffold existente (Drizzle+pg, Express 5 /api router com Zod, pipeline Orval OpenAPI→React Query). Gate server-side é inviolável; frontend nunca é autoritativo. Features/limites em JSONB evitam migração a cada ajuste de packaging.
- **Trial** → 14 dias do Pro sem exigir cartão; Terreiro com trial da casa inteira. No fim, rebaixa para Grátis sem apagar/sequestrar dados (congela só sync/apresentação/PDF).
  - _Racional:_ Exigir cartão para trial derruba conversão no Brasil (baixa bancarização de crédito, medo de cobrança automática). Nunca reter o conteúdo do usuário reforça confiança, coerente com o posicionamento anti-mercantilização.
- **Sequenciamento vs. resto da infra** → Billing entra na fase 2, junto com auth/sync — depois de users e sync do repertório para a nuvem existirem, antes/junto do Terreiro. Não é a primeira coisa a construir.
  - _Racional:_ Não dá para cobrar por 'nuvem' antes de a nuvem existir; e sem conta não há a quem cobrar. O gating de plano depende do banco multi-tenant e da auth, ambos inexistentes hoje (dados presos no localStorage).
- **Anúncios** → Não usar ads sobre conteúdo/experiência ritual no MVP. Se algum dia, restringir a telas institucionais/descoberta.
  - _Racional:_ O concorrente maduro usa ads, mas ads sobre conteúdo religioso durante uso ritual reforçam a percepção de mercantilização que queremos evitar, e o CPM no Brasil é baixo demais para compensar o risco de marca.

**Questões abertas:** (Vamos oferecer um tier Terreiro gratuito ou simbólico para casas comprovadamente sem condição financeira? Se sim, qual o critério de elegibilidade e como evitar abuso — isso é forte para a marca (aliada da comunidade) mas reduz receita B2B?); (Qual o preço-âncora real que o público aceita? Precisamos de pesquisa primária com dirigentes e ogãs (grupos de WhatsApp) antes de fixar R$9,90/R$39,90 — os números atuais são inferência, não validação.); (O tier vitalício 'Apoiador' deve ter teto de vagas/edição limitada (ex.: 'apoiadores fundadores') para gerar urgência e caixa inicial, ou fica permanente? Vitalício permanente barato pode canibalizar a recorrência.); (Até quantos membros o Terreiro base cobre (proposto 15) e qual o modelo acima disso — add-on por membro, tier maior, ou ilimitado? Terreiros variam de 5 a 100+ membros.); (Como tratar quem já é usuário do app grátis local hoje na virada para contas na nuvem — migração gratuita vitalícia de recurso? desconto de early adopter? Isso afeta goodwill e receita.); (Qual a política de conteúdo para o que pode ser compartilhado nos tiers pagos (setlist compartilhado, repertório da casa) considerando sensibilidade entre linhas/nações e pontos de Exu/Pomba-Gira fora de contexto — quem modera e sob que regras?); (Assumimos o risco reputacional de qualquer cobrança neste domínio, mesmo bem posicionada? Vale um teste qualitativo com lideranças respeitadas da comunidade antes do lançamento comercial, para blindar a marca?); (Aceitamos Pix Automático (recorrente, regulado pelo BCB) assim que maduro no Mercado Pago, ou mantemos cartão como único meio recorrente e Pix só para anual/vitalício avulso?); (Qual a meta de negócio real: cobrir custo de infra e servir a comunidade (lifestyle/impacto) ou construir receita relevante? Isso muda quanto investir no B2B/terreiro vs. manter simples no B2C.)

---

### 7.x Schema Postgres (Drizzle ORM) para o Umbanda Ponto Organizer multi-usuário

## Schema Postgres (Drizzle ORM) — biblioteca canônica + dados por-usuário + multi-tenant de terreiros

Esta seção projeta o schema completo que preenche `lib/db/src/schema/` (hoje vazio — `export {}`), reaproveitando o setup já existente: `drizzle-orm@^0.45.1`, `drizzle-zod@^0.8.3`, `pg`, `drizzle.config.ts` apontando para `postgresql`, e os scripts `push`/`push-force`. Node 24 garante `gen_random_uuid()` no Postgres e `crypto` no runtime, então **não precisamos de extensões extras** (nem `uuid-ossp` nem `pgcrypto` manual — `gen_random_uuid()` é core desde o PG 13).

O ponto arquitetural central é resolver o "problema estrutural nº 1" já identificado pelo time: hoje `favorito` e `ordem` vivem **dentro** da entidade de conteúdo (`Ponto`), o que impede que dois usuários tenham favoritos/ordenações diferentes do mesmo ponto. A solução é separar **conteúdo** (compartilhável, potencialmente canônico) de **estado do usuário** (favorito, ordem, notas), e introduzir um discriminador de escopo em todo conteúdo.

---

### 1. Princípios do modelo

1. **Escopo de conteúdo (discriminador único).** Toda tabela de conteúdo (`orixas`, `subcategorias`, `pontos`) carrega `escopo ∈ {canonical, user, org}` + colunas de dono (`dono_user_id`, `org_id`) governadas por CHECK. Isso cobre os três casos pedidos numa só tabela: (a) biblioteca canônica/pública, (b) pontos privados do usuário, (c) pontos do terreiro. Evita triplicar tabelas e mantém FKs simples (um `ponto` referencia uma `subcategoria`, independente do escopo de cada um).
2. **Estado por-usuário fora do conteúdo.** `user_ponto_state`, `user_orixa_state`, `user_subcategoria_state` guardam favorito, ordem (posição), ocultar e anotações — chaveados por `(user_id, <conteudo>_id)`. A biblioteca canônica é **compartilhada por FK**, não copiada por conta.
3. **Copy-on-write + dedup por hash.** Um ponto pessoal que nasceu de um canônico guarda `origem_ponto_id` e um `conteudo_hash` (sha256 da letra normalizada). Se a letra não divergiu do canônico, o usuário **não ganha uma cópia** — só uma linha em `user_ponto_state` apontando para o canônico. Isso mata a duplicação massiva de texto que aconteceria se cada signup clonasse os 248–384 pontos.
4. **Ordenação tolerante a merge.** Trocamos o inteiro denso reindexado (que reescreve a lista inteira e causa last-write-wins destrutivo em multi-device) por **posição fracionária** (`posicao text`, índice fracionário estilo LexoRank). Inserir entre A e B só grava uma linha.
5. **Multi-tenant leve.** `organizacoes` (terreiros) + `membros_organizacao` (papéis). Espaço pessoal **não** é um "org de um" — é `escopo='user'`. Isso deixa o caminho B2C simples e o B2B aditivo.
6. **Auditoria e soft-delete transversais.** `criado_em`/`atualizado_em`/`removido_em` em todas as tabelas de negócio + tabela `registro_auditoria` append-only.

---

### 2. Estratégia de IDs e mapeamento na migração

**Decisão: PK = `uuid` gerada no servidor via `gen_random_uuid()`** (default no DDL, não no cliente). Motivos: os IDs atuais são inseguros como PK global — misturam slugs semânticos fixos (`sub-oxossi-louvacao`, `lo-1`) com `Date.now()-random` gerado no cliente (`1774886896028-q58etyt`), que colidem entre dispositivos/contas.

Preservamos os IDs antigos em **duas** colunas com papéis distintos:

- **`slug text`** — identificador estável, legível, para URLs públicas e para *matching* na migração (`lo-1`, `exu`). Único **apenas** entre linhas canônicas (índice parcial `WHERE escopo='canonical'`), porque dois usuários podem ter um `lo-1` pessoal.
- **`legacy_id text`** — o ID exato que veio do `localStorage` daquele usuário, guardado para rastreabilidade e idempotência do import. Único por `(dono_user_id, legacy_id)`.

Sobre **UUIDv7 vs v4**: para localidade de índice (inserts append-friendly) o v7 é superior. Como Node 24 ainda não tem `randomUUID({version:7})` nativo e o repo tem política `minimumReleaseAge=1440` contra novas deps, a recomendação para o **primeiro corte é v4 via `gen_random_uuid()`** e, se o volume justificar, migrar o default para uma função SQL `uuid_generate_v7()` (10 linhas de PL/pgSQL, sem dependência npm). Nenhuma linha de código de aplicação muda — só o `DEFAULT` da coluna.

---

### 3. DDL conceitual (mapa de tabelas)

```
AUTH / IDENTIDADE
  users                     (id, email, senha_hash, nome, email_verificado_em, imagem_url)
  contas                    (OAuth: provider, provider_account_id) 1—N users
  sessoes                   (token, user_id, expira_em)
  tokens_verificacao        (email verify / reset)

MULTI-TENANT
  organizacoes              (terreiro/casa: nome, slug, tipo, criado_por)
  membros_organizacao       (org_id, user_id, papel, status)  PK composta

CONTEÚDO (escopo: canonical | user | org)
  orixas                    (escopo, dono_user_id?, org_id?, slug, nome, cor, emoji)
  subcategorias             (orixa_id, escopo, dono_user_id?, org_id?, slug, nome)
  pontos                    (subcategoria_id, escopo, dono?/org?, titulo, letra,
                             conteudo_hash, origem_ponto_id?, versao_atual_id?)
  ponto_revisoes            (ponto_id, versao, titulo, letra, conteudo_hash) — histórico

ESTADO POR-USUÁRIO  (favorito + ordem + overrides)
  user_ponto_state          (user_id, ponto_id, favorito, posicao, oculto, anotacao) PK composta
  user_orixa_state          (user_id, orixa_id, posicao, oculto, nome/cor/emoji custom)
  user_subcategoria_state   (user_id, subcategoria_id, posicao, oculto, nome custom)

COLEÇÕES / SETLIST DA GIRA
  colecoes                  (escopo, dono?/org?, nome, tipo[setlist|playlist], data_gira)
  colecao_itens             (colecao_id, ponto_id, posicao, nota)

COMPARTILHAMENTO
  compartilhamentos         (recurso_tipo, recurso_id, alvo_tipo[user|org|link],
                             alvo_user_id?/alvo_org_id?/token?, permissao, expira_em)

PLANOS / ASSINATURAS (Stripe)
  planos                    (codigo, nome, preco_centavos, intervalo, limites jsonb, stripe_price_id)
  assinaturas              (assinante_user_id?/org_id?, plano_id, status, stripe_*)
  eventos_faturamento       (log idempotente de webhooks Stripe)

AUDITORIA
  registro_auditoria        (ator_user_id, org_id?, acao, recurso_tipo, recurso_id,
                             dados_antes jsonb, dados_depois jsonb)
```

Organização de arquivos (o padrão que o próprio placeholder pede — "one export per file"): `lib/db/src/schema/_shared.ts`, `auth.ts`, `org.ts`, `conteudo.ts`, `estado-usuario.ts`, `colecoes.ts`, `compartilhamento.ts`, `faturamento.ts`, `auditoria.ts`, e `index.ts` re-exportando tudo (`export * from "./auth"` etc.).

---

### 4. Drizzle — colunas compartilhadas e enums

`lib/db/src/schema/_shared.ts`:

```ts
import { sql } from "drizzle-orm";
import { pgEnum, timestamp, uuid } from "drizzle-orm/pg-core";

export const escopoConteudo = pgEnum("escopo_conteudo", ["canonical", "user", "org"]);
export const visibilidade   = pgEnum("visibilidade",   ["publico", "nao_listado", "privado"]);

// factory: retorna um NOVO column builder a cada tabela
export const pk = () => uuid("id").primaryKey().default(sql`gen_random_uuid()`);

export const timestamps = {
  criadoEm:     timestamp("criado_em",     { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
  removidoEm:   timestamp("removido_em",   { withTimezone: true }), // soft-delete
};
```

> `atualizadoEm` deve ser mantido por trigger `BEFORE UPDATE` (uma função `set_atualizado_em()` aplicada a todas as tabelas) ou setado explicitamente no repositório — o Drizzle não atualiza `defaultNow()` em UPDATE.

---

### 5. Drizzle — auth e multi-tenant

`auth.ts` (shape compatível com o adapter Drizzle do Auth.js / Lucia, para não reinventar sessão):

```ts
import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, uniqueIndex, index, primaryKey } from "drizzle-orm/pg-core";
import { pk, timestamps } from "./_shared";

export const users = pgTable("users", {
  id: pk(),
  nome: text("nome"),
  email: text("email").notNull(),
  emailVerificadoEm: timestamp("email_verificado_em", { withTimezone: true }),
  senhaHash: text("senha_hash"),          // null = só OAuth
  imagemUrl: text("imagem_url"),
  ...timestamps,
}, (t) => [
  // e-mail case-insensitive único (evita citext; índice funcional)
  uniqueIndex("users_email_uk").on(sql`lower(${t.email})`),
]);

export const contas = pgTable("contas", {
  id: pk(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),                 // "google", "credentials"...
  providerAccountId: text("provider_account_id").notNull(),
  ...timestamps,
}, (t) => [
  uniqueIndex("contas_provider_uk").on(t.provider, t.providerAccountId),
  index("contas_user_idx").on(t.userId),
]);

export const sessoes = pgTable("sessoes", {
  id: text("id").primaryKey(),                          // token opaco
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiraEm: timestamp("expira_em", { withTimezone: true }).notNull(),
  criadoEm: timestamps.criadoEm,
}, (t) => [ index("sessoes_user_idx").on(t.userId) ]);
```

`org.ts`:

```ts
import { pgTable, text, uuid, pgEnum, uniqueIndex, index, primaryKey } from "drizzle-orm/pg-core";
import { pk, timestamps } from "./_shared";
import { users } from "./auth";

export const papelMembro  = pgEnum("papel_membro",  ["proprietario", "dirigente", "editor", "leitor"]);
export const statusMembro = pgEnum("status_membro", ["ativo", "convidado", "suspenso"]);

export const organizacoes = pgTable("organizacoes", {
  id: pk(),
  nome: text("nome").notNull(),
  slug: text("slug").notNull(),
  criadoPor: uuid("criado_por").references(() => users.id, { onDelete: "set null" }),
  ...timestamps,
}, (t) => [ uniqueIndex("org_slug_uk").on(t.slug) ]);

export const membrosOrganizacao = pgTable("membros_organizacao", {
  orgId:  uuid("org_id").notNull().references(() => organizacoes.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  papel:  papelMembro("papel").notNull().default("leitor"),
  status: statusMembro("status").notNull().default("convidado"),
  convidadoPor: uuid("convidado_por").references(() => users.id, { onDelete: "set null" }),
  criadoEm: timestamps.criadoEm,
}, (t) => [
  primaryKey({ columns: [t.orgId, t.userId] }),
  index("membros_user_idx").on(t.userId),
]);
```

Mapeamento de papéis para o domínio: **dirigente** (pai/mãe de santo) = admin do repertório; **editor** (ogã/curimbeiro) edita letras/ordem; **leitor** (médium/cambone) só consulta. `proprietario` é quem criou/paga a org.

---

### 6. Drizzle — conteúdo com escopo (o núcleo)

`conteudo.ts`. Note o CHECK que garante a coerência escopo↔dono, o índice parcial de slug canônico, o self-FK de `origem_ponto_id` e a unicidade `(dono_user_id, legacy_id)` para import idempotente:

```ts
import { sql } from "drizzle-orm";
import {
  pgTable, text, integer, uuid, index, uniqueIndex, check, type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { pk, timestamps, escopoConteudo, visibilidade } from "./_shared";
import { users } from "./auth";
import { organizacoes } from "./org";

// CHECK reutilizável: escopo coerente com colunas de dono
const checkEscopo = (t: { escopo: AnyPgColumn; donoUserId: AnyPgColumn; orgId: AnyPgColumn }, nome: string) =>
  check(nome, sql`
    (${t.escopo} = 'canonical' AND ${t.donoUserId} IS NULL     AND ${t.orgId} IS NULL)
 OR (${t.escopo} = 'user'      AND ${t.donoUserId} IS NOT NULL AND ${t.orgId} IS NULL)
 OR (${t.escopo} = 'org'       AND ${t.orgId}      IS NOT NULL AND ${t.donoUserId} IS NULL)`);

export const orixas = pgTable("orixas", {
  id: pk(),
  escopo: escopoConteudo("escopo").notNull().default("user"),
  donoUserId: uuid("dono_user_id").references(() => users.id, { onDelete: "cascade" }),
  orgId: uuid("org_id").references(() => organizacoes.id, { onDelete: "cascade" }),
  criadoPor: uuid("criado_por").references(() => users.id, { onDelete: "set null" }),
  slug: text("slug"),
  legacyId: text("legacy_id"),
  nome: text("nome").notNull(),
  cor: text("cor").notNull().default("#64748b"),
  emoji: text("emoji").notNull().default("🕯️"),
  posicaoPadrao: text("posicao_padrao"),   // ordem canônica (fracionária)
  ...timestamps,
}, (t) => [
  checkEscopo(t, "orixas_escopo_ck"),
  uniqueIndex("orixas_canonical_slug_uk").on(t.slug).where(sql`${t.escopo} = 'canonical'`),
  uniqueIndex("orixas_dono_legacy_uk").on(t.donoUserId, t.legacyId).where(sql`${t.donoUserId} IS NOT NULL`),
  index("orixas_dono_idx").on(t.donoUserId),
  index("orixas_org_idx").on(t.orgId),
]);

export const subcategorias = pgTable("subcategorias", {
  id: pk(),
  orixaId: uuid("orixa_id").notNull().references(() => orixas.id, { onDelete: "cascade" }),
  escopo: escopoConteudo("escopo").notNull().default("user"),
  donoUserId: uuid("dono_user_id").references(() => users.id, { onDelete: "cascade" }),
  orgId: uuid("org_id").references(() => organizacoes.id, { onDelete: "cascade" }),
  criadoPor: uuid("criado_por").references(() => users.id, { onDelete: "set null" }),
  slug: text("slug"),
  legacyId: text("legacy_id"),
  nome: text("nome").notNull(),
  posicaoPadrao: text("posicao_padrao"),
  ...timestamps,
}, (t) => [
  checkEscopo(t, "subcategorias_escopo_ck"),
  index("subs_orixa_idx").on(t.orixaId),
  index("subs_dono_idx").on(t.donoUserId),
  uniqueIndex("subs_dono_legacy_uk").on(t.donoUserId, t.legacyId).where(sql`${t.donoUserId} IS NOT NULL`),
]);

export const pontos = pgTable("pontos", {
  id: pk(),
  subcategoriaId: uuid("subcategoria_id").notNull().references(() => subcategorias.id, { onDelete: "cascade" }),
  escopo: escopoConteudo("escopo").notNull().default("user"),
  donoUserId: uuid("dono_user_id").references(() => users.id, { onDelete: "cascade" }),
  orgId: uuid("org_id").references(() => organizacoes.id, { onDelete: "cascade" }),
  criadoPor: uuid("criado_por").references(() => users.id, { onDelete: "set null" }),
  visibilidade: visibilidade("visibilidade").notNull().default("privado"),
  titulo: text("titulo").notNull(),
  letra: text("letra").notNull(),
  conteudoHash: text("conteudo_hash").notNull(),                 // sha256(letra normalizada)
  origemPontoId: uuid("origem_ponto_id").references((): AnyPgColumn => pontos.id, { onDelete: "set null" }),
  versaoAtualId: uuid("versao_atual_id"),                        // -> ponto_revisoes.id (FK adicionada depois p/ evitar ciclo)
  slug: text("slug"),
  legacyId: text("legacy_id"),
  ...timestamps,
}, (t) => [
  checkEscopo(t, "pontos_escopo_ck"),
  index("pontos_sub_idx").on(t.subcategoriaId),
  index("pontos_dono_idx").on(t.donoUserId),
  index("pontos_org_idx").on(t.orgId),
  index("pontos_hash_idx").on(t.conteudoHash),                  // dedup / achar "mesma letra"
  index("pontos_origem_idx").on(t.origemPontoId),
  uniqueIndex("pontos_dono_legacy_uk").on(t.donoUserId, t.legacyId).where(sql`${t.donoUserId} IS NOT NULL`),
  // busca textual pt-BR (usada pela busca em tempo real de TelaSubcategorias)
  index("pontos_busca_idx").using("gin",
    sql`to_tsvector('portuguese', ${t.titulo} || ' ' || ${t.letra})`),
]);
```

`schema/index.ts` passa a ser:

```ts
export * from "./_shared";
export * from "./auth";
export * from "./org";
export * from "./conteudo";
export * from "./estado-usuario";
export * from "./colecoes";
export * from "./compartilhamento";
export * from "./faturamento";
export * from "./auditoria";
```

---

### 7. Drizzle — versionamento de letras

`ponto_revisoes` é append-only; `pontos.versao_atual_id` aponta para a corrente (denormalização para leitura rápida — a `letra`/`titulo` também ficam em `pontos` para o hot path). Toda edição da letra insere uma revisão nova.

```ts
export const pontoRevisoes = pgTable("ponto_revisoes", {
  id: pk(),
  pontoId: uuid("ponto_id").notNull().references(() => pontos.id, { onDelete: "cascade" }),
  versao: integer("versao").notNull(),
  titulo: text("titulo").notNull(),
  letra: text("letra").notNull(),
  conteudoHash: text("conteudo_hash").notNull(),
  criadoPor: uuid("criado_por").references(() => users.id, { onDelete: "set null" }),
  criadoEm: timestamps.criadoEm,
}, (t) => [
  uniqueIndex("ponto_rev_uk").on(t.pontoId, t.versao),
  index("ponto_rev_ponto_idx").on(t.pontoId),
]);
```

A FK circular `pontos.versao_atual_id → ponto_revisoes.id` sai do `pgTable` (senão vira ciclo de import) e entra na migração como `ALTER TABLE`. Com `drizzle-kit push` isso pode ficar num arquivo SQL manual em `lib/db/drizzle/` ou, mais limpo, deixar `versao_atual_id` sem FK e garantir integridade na aplicação (é uma denormalização, tolerável).

---

### 8. Drizzle — estado por-usuário (favorito + ordem)

Aqui mora a correção do problema nº 1. `posicao text` é o índice fracionário — a ordem **do usuário** para aquele ponto dentro da subcategoria. `oculto` permite esconder um ponto canônico sem deletá-lo. `anotacao` é a nota pessoal (killer feature de baixo custo).

```ts
import { sql } from "drizzle-orm";
import { pgTable, text, boolean, uuid, timestamp, index, primaryKey } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { pontos, orixas, subcategorias } from "./conteudo";

export const userPontoState = pgTable("user_ponto_state", {
  userId:  uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  pontoId: uuid("ponto_id").notNull().references(() => pontos.id, { onDelete: "cascade" }),
  favorito: boolean("favorito").notNull().default(false),
  posicao: text("posicao"),                 // ordem fracionária por-usuário
  oculto: boolean("oculto").notNull().default(false),
  anotacao: text("anotacao"),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  primaryKey({ columns: [t.userId, t.pontoId] }),
  // index parcial só de favoritos: lista "meus favoritos" fica barata
  index("ups_fav_idx").on(t.userId).where(sql`${t.favorito}`),
]);

export const userOrixaState = pgTable("user_orixa_state", {
  userId:  uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orixaId: uuid("orixa_id").notNull().references(() => orixas.id, { onDelete: "cascade" }),
  posicao: text("posicao"),
  oculto: boolean("oculto").notNull().default(false),
  nomeCustom: text("nome_custom"), corCustom: text("cor_custom"), emojiCustom: text("emoji_custom"),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [ primaryKey({ columns: [t.userId, t.orixaId] }) ]);

export const userSubcategoriaState = pgTable("user_subcategoria_state", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subcategoriaId: uuid("subcategoria_id").notNull().references(() => subcategorias.id, { onDelete: "cascade" }),
  posicao: text("posicao"),
  oculto: boolean("oculto").notNull().default(false),
  nomeCustom: text("nome_custom"),
  atualizadoEm: timestamp("atualizado_em", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [ primaryKey({ columns: [t.userId, t.subcategoriaId] }) ]);
```

**Sobre a ordem fracionária.** Gera-se uma string entre a anterior e a próxima (base-62). Inserir/reordenar toca **uma** linha, não a lista inteira — resolve write-conflict multi-device. Helper mínimo, sem dependência (respeita `minimumReleaseAge`):

```ts
// entre "a" e "b" (ambos base-62, ou null nas pontas) -> nova posição no meio
export function posicaoEntre(a: string | null, b: string | null): string { /* midpoint base62 */ }
```

Alternativa mais simples porém que degrada: `posicao double precision` com midpoint `(a+b)/2` (esgota precisão após ~50 inserts no mesmo ponto). Recomendo a string.

---

### 9. Drizzle — coleções / setlist da gira, compartilhamento, faturamento, auditoria

`colecoes.ts` — a "setlist da gira do dia", que a análise de mercado apontou como o eixo B2B mais defensável:

```ts
export const tipoColecao = pgEnum("tipo_colecao", ["setlist", "playlist"]);

export const colecoes = pgTable("colecoes", {
  id: pk(),
  escopo: escopoConteudo("escopo").notNull().default("user"),
  donoUserId: uuid("dono_user_id").references(() => users.id, { onDelete: "cascade" }),
  orgId: uuid("org_id").references(() => organizacoes.id, { onDelete: "cascade" }),
  criadoPor: uuid("criado_por").references(() => users.id, { onDelete: "set null" }),
  nome: text("nome").notNull(),
  tipo: tipoColecao("tipo").notNull().default("playlist"),
  dataGira: date("data_gira"),
  visibilidade: visibilidade("visibilidade").notNull().default("privado"),
  ...timestamps,
}, (t) => [ checkEscopo(t, "colecoes_escopo_ck"), index("colecoes_org_idx").on(t.orgId) ]);

export const colecaoItens = pgTable("colecao_itens", {
  id: pk(),
  colecaoId: uuid("colecao_id").notNull().references(() => colecoes.id, { onDelete: "cascade" }),
  pontoId: uuid("ponto_id").notNull().references(() => pontos.id, { onDelete: "cascade" }),
  posicao: text("posicao").notNull(),
  nota: text("nota"),
  criadoEm: timestamps.criadoEm,
}, (t) => [
  index("col_itens_colecao_idx").on(t.colecaoId),
  uniqueIndex("col_itens_uk").on(t.colecaoId, t.pontoId),
]);
```

`compartilhamento.ts` — unifica share-para-usuário, share-para-org e link público com token:

```ts
export const recursoTipo = pgEnum("recurso_tipo", ["ponto", "colecao"]);
export const alvoTipo    = pgEnum("alvo_tipo",    ["user", "org", "link"]);
export const permissao   = pgEnum("permissao",    ["ler", "editar"]);

export const compartilhamentos = pgTable("compartilhamentos", {
  id: pk(),
  recursoTipo: recursoTipo("recurso_tipo").notNull(),
  recursoId: uuid("recurso_id").notNull(),
  alvoTipo: alvoTipo("alvo_tipo").notNull(),
  alvoUserId: uuid("alvo_user_id").references(() => users.id, { onDelete: "cascade" }),
  alvoOrgId: uuid("alvo_org_id").references(() => organizacoes.id, { onDelete: "cascade" }),
  token: text("token"),                       // preenchido quando alvo_tipo='link'
  permissao: permissao("permissao").notNull().default("ler"),
  criadoPor: uuid("criado_por").references(() => users.id, { onDelete: "set null" }),
  expiraEm: timestamp("expira_em", { withTimezone: true }),
  ...timestamps,
}, (t) => [
  index("compart_recurso_idx").on(t.recursoTipo, t.recursoId),
  uniqueIndex("compart_token_uk").on(t.token).where(sql`${t.token} IS NOT NULL`),
]);
```

`faturamento.ts` — planos e assinaturas (usuário **ou** org), com log idempotente de webhooks:

```ts
export const intervaloPlano   = pgEnum("intervalo_plano",   ["mensal", "anual", "unico"]);
export const statusAssinatura = pgEnum("status_assinatura", ["trial", "ativa", "inadimplente", "cancelada", "expirada"]);

export const planos = pgTable("planos", {
  id: pk(),
  codigo: text("codigo").notNull(),           // "gratis" | "pessoal" | "terreiro"
  nome: text("nome").notNull(),
  precoCentavos: integer("preco_centavos").notNull().default(0),
  intervalo: intervaloPlano("intervalo").notNull().default("mensal"),
  limites: jsonb("limites").$type<{ maxPontos?: number; maxMembros?: number; sync?: boolean }>().notNull().default({}),
  stripePriceId: text("stripe_price_id"),
  ...timestamps,
}, (t) => [ uniqueIndex("planos_codigo_uk").on(t.codigo) ]);

export const assinaturas = pgTable("assinaturas", {
  id: pk(),
  assinanteUserId: uuid("assinante_user_id").references(() => users.id, { onDelete: "set null" }),
  orgId: uuid("org_id").references(() => organizacoes.id, { onDelete: "set null" }),
  planoId: uuid("plano_id").notNull().references(() => planos.id),
  status: statusAssinatura("status").notNull().default("trial"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  periodoFim: timestamp("periodo_fim", { withTimezone: true }),
  cancelarNoFim: boolean("cancelar_no_fim").notNull().default(false),
  ...timestamps,
}, (t) => [
  // um assinante OU uma org, nunca ambos/nenhum
  check("assinatura_alvo_ck", sql`(${t.assinanteUserId} IS NULL) <> (${t.orgId} IS NULL)`),
  uniqueIndex("assinatura_stripe_uk").on(t.stripeSubscriptionId).where(sql`${t.stripeSubscriptionId} IS NOT NULL`),
]);

export const eventosFaturamento = pgTable("eventos_faturamento", {
  id: pk(),
  stripeEventId: text("stripe_event_id").notNull(),
  tipo: text("tipo").notNull(),
  payload: jsonb("payload").notNull(),
  processadoEm: timestamp("processado_em", { withTimezone: true }),
  criadoEm: timestamps.criadoEm,
}, (t) => [ uniqueIndex("eventos_stripe_uk").on(t.stripeEventId) ]); // idempotência do webhook
```

`auditoria.ts`:

```ts
export const registroAuditoria = pgTable("registro_auditoria", {
  id: pk(),
  atorUserId: uuid("ator_user_id").references(() => users.id, { onDelete: "set null" }),
  orgId: uuid("org_id").references(() => organizacoes.id, { onDelete: "set null" }),
  acao: text("acao").notNull(),               // "ponto.editar", "membro.convidar"...
  recursoTipo: text("recurso_tipo").notNull(),
  recursoId: uuid("recurso_id"),
  dadosAntes: jsonb("dados_antes"),
  dadosDepois: jsonb("dados_depois"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  criadoEm: timestamps.criadoEm,
}, (t) => [
  index("audit_recurso_idx").on(t.recursoTipo, t.recursoId),
  index("audit_org_idx").on(t.orgId, t.criadoEm),
]);
```

---

### 10. Isolamento por tenant / Row-Level Security

**Estratégia recomendada: isolamento na camada de aplicação como linha primária + RLS como defesa em profundidade.**

- **Primário (app):** o middleware de auth do `api-server` (Express 5) resolve `userId` + orgs do usuário a partir da sessão e **todo** repositório filtra por escopo. Ex.: "meus pontos" = `escopo='user' AND dono_user_id = :me`; "pontos do terreiro" exige membership; canônicos são lidos por qualquer um. O Drizzle não conhece tenant sozinho — isso é responsabilidade de uma camada fina de repositórios.
- **Defesa em profundidade (RLS):** ligar RLS nas tabelas sensíveis e abrir cada transação com `SET LOCAL app.user_id` / `SET LOCAL app.org_ids`, para que um bug de query jamais vaze conteúdo entre contas. Wrapper no `db`:

```ts
export async function comTenant<T>(userId: string, orgIds: string[], fn: (tx) => Promise<T>) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.user_id', ${userId}, true)`);
    await tx.execute(sql`SELECT set_config('app.org_ids', ${orgIds.join(",")}, true)`);
    return fn(tx);
  });
}
```

Política de exemplo para `pontos` (drizzle 0.45 expõe `pgPolicy` + `.enableRLS()`, então dá para versionar junto do schema):

```sql
ALTER TABLE pontos ENABLE ROW LEVEL SECURITY;

CREATE POLICY pontos_leitura ON pontos FOR SELECT USING (
     escopo = 'canonical'
  OR dono_user_id = current_setting('app.user_id', true)::uuid
  OR org_id = ANY (string_to_array(current_setting('app.org_ids', true), ',')::uuid[])
);

CREATE POLICY pontos_escrita ON pontos FOR ALL USING (
     dono_user_id = current_setting('app.user_id', true)::uuid
  OR org_id = ANY (string_to_array(current_setting('app.org_ids', true), ',')::uuid[])
);
```

Importante: a app **não pode** conectar como superuser/owner da tabela (RLS é ignorado para eles) — criar um role `app_rw` sem `BYPASSRLS`. O seed canônico roda com role privilegiado (bypass), o tráfego de request roda com `app_rw`.

---

### 11. Migração 1 — semear a biblioteca canônica (248 seed + 384 do JSON)

**Fonte da verdade canônica = `pontos-completo.json`** (confirmado: 12 orixás, 42 subcategorias, **384 pontos** — superset dos ~248 hardcoded em `storage.ts`). Os 248 do `storage.ts` são apenas o que um usuário-legado tem no navegador; entram pelo fluxo de import (Migração 2), **não** no seed.

Reconciliação e dedup por hash de conteúdo. Script `lib/db/src/seed/seed-canonico.ts`:

```ts
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { db } from "../index";
import { orixas, subcategorias, pontos } from "../schema";

export function hashLetra(letra: string): string {
  const normal = letra.replace(/\r\n/g, "\n").trim().replace(/[ \t]+/g, " ").toLowerCase();
  return createHash("sha256").update(normal).digest("hex");
}

const dados = JSON.parse(await readFile(new URL("../../../pontos-completo.json", import.meta.url), "utf8"));

await db.transaction(async (tx) => {
  const idOrixa = new Map<string, string>();     // legacy id -> uuid novo
  for (const o of dados.orixas) {
    const [row] = await tx.insert(orixas).values({
      escopo: "canonical", slug: o.id, legacyId: o.id,
      nome: o.nome, cor: o.cor, emoji: o.emoji,
      posicaoPadrao: String(o.ordem).padStart(6, "0"),
    }).returning({ id: orixas.id });
    idOrixa.set(o.id, row.id);
  }

  const idSub = new Map<string, string>();
  for (const s of dados.subcategorias) {
    const slug = /^\d/.test(s.id)               // ids timestamp-random viram slug legível
      ? `${s.orixaId}-${s.nome.toLowerCase().replace(/\s+/g, "-")}` : s.id;
    const [row] = await tx.insert(subcategorias).values({
      escopo: "canonical", orixaId: idOrixa.get(s.orixaId)!, slug, legacyId: s.id,
      nome: s.nome, posicaoPadrao: String(s.ordem).padStart(6, "0"),
    }).returning({ id: subcategorias.id });
    idSub.set(s.id, row.id);
  }

  // dedup: se duas subcategorias trazem a MESMA letra, mantém a 1ª e não reinsere
  const vistos = new Set<string>();
  for (const p of dados.pontos) {
    const h = hashLetra(p.letra);
    if (vistos.has(h)) continue;                 // letra idêntica já semeada
    vistos.add(h);
    await tx.insert(pontos).values({
      escopo: "canonical", visibilidade: "publico",
      subcategoriaId: idSub.get(p.subcategoriaId)!,
      slug: p.id, legacyId: p.id, titulo: p.titulo, letra: p.letra, conteudoHash: h,
    });
  }
});
```

Rodar via `pnpm --filter @workspace/db exec tsx src/seed/seed-canonico.ts` (com `DATABASE_URL` do dev container). O `conteudoHash` semeado é o que permite, no import, reconhecer "esse ponto do usuário é o canônico X".

> Nota de reconciliação: `criadoEm` (epoch ms, ex. `1774882639699`) do JSON é convertido para `timestamptz` só se você quiser preservar a data original; caso contrário `defaultNow()` basta para conteúdo canônico. IDs semânticos (`lo-1`, `sub-oxossi-louvacao`) viram `slug`, nunca PK.

---

### 12. Migração 2 — importar o localStorage de um usuário existente

Endpoint `POST /api/me/importar` (nova rota no `api-server`, protegida por sessão). Body = exatamente o `AppData` que `exportarDados()` já produz (`{orixas, subcategorias, pontos}`) — reaproveita o formato de export/import que o app **já tem**, agora como payload de onboarding. Lógica:

```ts
export async function importarAppData(userId: string, data: AppData) {
  return db.transaction(async (tx) => {
    // idempotência: se legacyId já existe p/ esse user, reusa
    const mapOrixa = new Map<string, string>();
    for (const o of data.orixas) {
      // tenta casar com canônico por slug; senão cria orixá pessoal
      const canon = await tx.query.orixas.findFirst({
        where: (x, { and, eq }) => and(eq(x.escopo, "canonical"), eq(x.slug, o.id)),
      });
      if (canon) {
        mapOrixa.set(o.id, canon.id);
        await tx.insert(userOrixaState).values({
          userId, orixaId: canon.id, posicao: String(o.ordem),
          nomeCustom: o.nome !== canon.nome ? o.nome : null,
        }).onConflictDoNothing();
      } else {
        const [row] = await tx.insert(orixas).values({
          escopo: "user", donoUserId: userId, criadoPor: userId,
          legacyId: o.id, nome: o.nome, cor: o.cor, emoji: o.emoji,
        }).returning({ id: orixas.id });
        mapOrixa.set(o.id, row.id);
      }
    }
    // ... subcategorias: mesma lógica (canônica -> user_subcategoria_state; senão escopo=user)

    for (const p of data.pontos) {
      const h = hashLetra(p.letra);
      const canon = await tx.query.pontos.findFirst({
        where: (x, { and, eq }) => and(eq(x.escopo, "canonical"), eq(x.conteudoHash, h)),
      });
      if (canon) {
        // NÃO duplica a letra: só grava o estado do usuário sobre o canônico
        await tx.insert(userPontoState).values({
          userId, pontoId: canon.id, favorito: p.favorito, posicao: String(p.ordem),
        }).onConflictDoUpdate({
          target: [userPontoState.userId, userPontoState.pontoId],
          set: { favorito: p.favorito, posicao: String(p.ordem) },
        });
      } else {
        // ponto autoral ou letra divergente -> cópia pessoal editável
        const origem = /* opcional: casar por slug legado p/ setar origemPontoId */ null;
        const [row] = await tx.insert(pontos).values({
          escopo: "user", donoUserId: userId, criadoPor: userId,
          subcategoriaId: mapSub.get(p.subcategoriaId)!,
          legacyId: p.id, titulo: p.titulo, letra: p.letra, conteudoHash: h, origemPontoId: origem,
        }).onConflictDoNothing({ target: [pontos.donoUserId, pontos.legacyId] })
          .returning({ id: pontos.id });
        if (row) await tx.insert(userPontoState).values({
          userId, pontoId: row.id, favorito: p.favorito, posicao: String(p.ordem),
        });
      }
    }
  });
}
```

Propriedades: **idempotente** (reimportar não duplica, via `(dono_user_id, legacy_id)` e `onConflict`); **dedup** (favorito/ordem sobre canônico não gera cópia de texto); **preserva favorito e ordem por-usuário** exatamente onde eles agora pertencem. No frontend, isso troca o `importarDados()` que faz `window.location.reload()` por uma chamada de rede + invalidação de cache do React Query (deps `@tanstack/react-query` e `@workspace/api-client-react` já instaladas, hoje mortas).

---

### 13. Encaixe no scaffold e drizzle-kit

- **Dev (rápido):** `pnpm --filter @workspace/db push` já existe e funciona assim que `schema/index.ts` tiver tabelas — ideal dentro do dev container com Postgres local.
- **Prod (recomendado adicionar):** trocar/complementar `push` por migrations versionadas — adicionar scripts `"generate": "drizzle-kit generate"` e `"migrate": "drizzle-kit migrate"` no `lib/db/package.json`, e commitar `lib/db/drizzle/` (o `.replit` já tenta `pnpm --filter db push` no `post-merge` — apontar para `migrate` em produção).
- **drizzle-zod → OpenAPI/Orval:** para cada tabela, gerar `createInsertSchema`/`createSelectSchema` (o placeholder já sugere isso) e usar esses schemas Zod tanto na validação das rotas Express quanto como fonte para expandir `lib/api-spec/openapi.yaml` além do `/healthz` — mantendo o pipeline Orval (React Query + `api-zod`) que já está montado.

```ts
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
export const inserirPonto = createInsertSchema(pontos).omit({ id: true, conteudoHash: true, criadoEm: true, atualizadoEm: true });
export const selecionarPonto = createSelectSchema(pontos);
export type InserirPonto = typeof inserirPonto._type;
export type Ponto = typeof pontos.$inferSelect;
```

Assim o schema Drizzle vira a única fonte de verdade que propaga tipos até os hooks React Query no frontend.

**Decisões desta frente:**

- **Como representar biblioteca canônica vs pontos privados vs pontos do terreiro** → Uma única tabela por entidade (orixas/subcategorias/pontos) com discriminador escopo ∈ {canonical,user,org} + colunas dono_user_id/org_id governadas por um CHECK de coerência. Não criar tabelas separadas por escopo.
  - _Racional:_ Mantém FKs triviais (um ponto referencia uma subcategoria sem se importar com o escopo de cada), evita triplicar CRUD e queries, e o CHECK garante que canônico não tem dono e user/org têm exatamente o dono certo. É o padrão de tenancy discriminado, mais simples de manter que 3 tabelas espelhadas.
- **Onde guardar favorito e ordem (hoje embutidos no Ponto)** → Mover para tabelas de estado por-usuário: user_ponto_state (PK userId+pontoId) com favorito/posicao/oculto/anotacao, e user_orixa_state / user_subcategoria_state para ordenação e overrides da taxonomia.
  - _Racional:_ Enquanto favorito/ordem viverem dentro do Ponto compartilhável, dois usuários não podem ter favoritos ou ordens diferentes da mesma letra — é o bloqueador nº1 do multi-usuário. Separar também permite a biblioteca canônica ser lida por FK sem cópia por conta.
- **Estratégia de ordenação (hoje inteiro denso reindexado)** → Posição fracionária em coluna text (índice fracionário base-62 estilo LexoRank), armazenada no estado por-usuário e nos itens de coleção; helper posicaoEntre() sem dependência externa.
  - _Racional:_ O inteiro reindexado reescreve a lista inteira a cada reorder e causa last-write-wins destrutivo em multi-device. A posição fracionária toca uma linha por operação e tolera merge, respeitando a política minimumReleaseAge (sem novas deps).
- **Estratégia de IDs (hoje slugs semânticos + timestamp-random do cliente)** → PK uuid gerada no servidor via gen_random_uuid() (v4 no primeiro corte; caminho aberto para v7 via função SQL). Preservar os IDs antigos como slug (URLs/matching, único só entre canônicos) e legacy_id (rastreabilidade/idempotência, único por dono_user_id).
  - _Racional:_ Os IDs atuais colidem entre dispositivos e contas — inaceitáveis como PK compartilhada. gen_random_uuid() é core no PG13+ (sem extensão) e Node 24 traz crypto. Manter slug+legacy_id separa 'identidade de exibição/migração' de 'identidade de banco'.
- **Deduplicação de letras entre usuários** → conteudo_hash (sha256 da letra normalizada) em pontos e ponto_revisoes + copy-on-write: ponto pessoal que não divergiu do canônico não vira cópia, só uma linha em user_ponto_state apontando ao canônico. origem_ponto_id registra a proveniência quando há cópia.
  - _Racional:_ Sem isso, cada signup clonaria 248–384 pontos, gerando duplicação massiva de texto e nenhuma forma de reconhecer que 'letra X' é a mesma entre terreiros. O hash é a chave de reconciliação usada tanto no seed quanto no import.
- **Multi-tenant (terreiro) vs espaço pessoal** → organizacoes + membros_organizacao (PK org_id+user_id, papel: proprietario/dirigente/editor/leitor). Espaço pessoal é escopo='user', NÃO um 'org de um membro'.
  - _Racional:_ Mantém o caminho B2C leve e o B2B puramente aditivo. Os papéis mapeiam direto no domínio: dirigente=admin do repertório, ogã=editor, médium=leitor — que é o eixo de monetização mais defensável segundo a análise de mercado.
- **Versionamento/edição de letras** → Tabela append-only ponto_revisoes (ponto_id, versao única, titulo, letra, hash, criado_por) + denormalização letra/titulo/versao_atual_id em pontos para o hot path de leitura.
  - _Racional:_ Preserva o acervo (risco real de perda de tradição oral) e dá trilha de quem editou o quê, sem penalizar a leitura. A FK circular versao_atual_id fica fora do pgTable (ALTER TABLE) ou sem FK, para evitar ciclo de import.
- **Fonte do seed canônico e reconciliação 248 vs 384** → pontos-completo.json (superset, 384 pontos) é a biblioteca canônica; os ~248 hardcoded em storage.ts entram só pelo fluxo de import de usuário-legado, com dedup por hash no seed.
  - _Racional:_ O JSON é comprovadamente superset do seed em uso e é um dataset órfão (não importado por nenhum código). Semear a partir dele evita reconciliar dois seeds divergentes; o hash garante que letras idênticas não sejam semeadas duas vezes.
- **Isolamento por tenant / RLS** → Isolamento na camada de aplicação (repositórios sempre filtram por sessão) como linha primária + RLS como defesa em profundidade: ENABLE RLS nas tabelas sensíveis, SET LOCAL app.user_id/app.org_ids por transação, role app_rw sem BYPASSRLS para o tráfego (seed roda com role privilegiado).
  - _Racional:_ O Drizzle não conhece tenant sozinho, então a app é a fonte primária de escopo; RLS garante que um bug de query jamais vaze conteúdo entre contas. Rodar o request como role sem bypass é o que torna a RLS efetiva.
- **Planos/assinaturas e como plugar no pipeline existente** → planos (limites em jsonb) + assinaturas (assinante_user_id XOR org_id via CHECK, campos Stripe) + eventos_faturamento (log idempotente por stripe_event_id). Gerar Zod via drizzle-zod por tabela e alimentar OpenAPI/Orval; usar drizzle-kit generate+migrate em prod (push só em dev).
  - _Racional:_ Assinatura por usuário OU por terreiro cobre B2C e B2B com uma tabela; o log idempotente é requisito de webhook Stripe. drizzle-zod como fonte única propaga tipos até os hooks React Query já instalados (hoje mortos), reaproveitando todo o pipeline Orval existente.

**Questões abertas:** (Tiers e limites concretos dos planos (max de pontos/coleções no grátis, se sync multi-dispositivo é feature paga, preço por terreiro vs por usuário) — decisão de produto/precificação, não técnica.); (A biblioteca canônica será curada/moderada por vocês (conteúdo oficial) ou aberta a contribuição da comunidade? Isso define se precisamos de fila de moderação e status de publicação nos pontos canônicos — relevante pela sensibilidade religiosa (letras de Exu/Pomba-Gira, variações entre linhas).); (Conteúdo de terreiro (escopo=org) pode virar público/canônico? Se sim, precisamos de um fluxo de promoção org->canonical com curadoria e atribuição.); (Política de retenção do registro_auditoria e das revisões de letra (LGPD): por quanto tempo guardar dados_antes/depois e IP/user-agent, e o que fazer no delete de conta.); (Ao aceitar v7 de UUID no futuro: preferem uma função SQL uuid_generate_v7() (zero deps, respeita minimumReleaseAge) ou aceitam uma dependência npm dedicada?); (Fusão de contas: se um usuário anônimo (localStorage) importa e depois faz login com outro método, há merge de dois conjuntos de dados? Define se legacy_id precisa ser único por conta ou por dispositivo.)

---

### 7.x API e Estrategia Offline-First / Sync

## API e Estrategia Offline-First / Sync

Esta secao define como o "Umbanda Ponto Organizer" sai de um app 100% localStorage para um produto com **conta + nuvem + sync multi-dispositivo**, sem reescrever o app de uma vez e reaproveitando ao maximo o scaffold que ja existe (Express 5, Drizzle, OpenAPI/Orval, React Query, custom-fetch com suporte a bearer token).

---

### 1. Estilo de API: REST (OpenAPI/Orval) — mantido, tRPC descartado

**Recomendacao: continuar com REST descrito em `lib/api-spec/openapi.yaml` e gerado via Orval.** Nao migrar para tRPC.

Motivos concretos, ancorados no que ja existe:

- **O pipeline ja esta montado e funcional.** `orval.config.ts` gera dois artefatos sincronizados a partir de um unico `openapi.yaml`: hooks React Query (`lib/api-client-react/src/generated`) e schemas Zod (`lib/api-zod/src/generated`). O backend ja consome `@workspace/api-zod` na rota `/healthz`. Trocar por tRPC jogaria fora esse investimento e a validacao Zod compartilhada ponta-a-ponta.
- **O mutator `custom-fetch.ts` ja resolve os dois problemas dificeis do produto**: `setBaseUrl()` (frontend na Vercel chamando a API em outro host) e `setAuthTokenGetter()` (injeta `Authorization: Bearer <token>` em toda request). Isso e exatamente o que precisamos para auth — nao ha nada a construir na camada de transporte.
- **REST/OpenAPI e melhor para as fronteiras que o produto vai ter**: webhooks Stripe (Stripe fala HTTP puro, nao tRPC), futura app mobile/Expo (o mutator ja tem comentarios prevendo Expo), integracoes B2B de terreiro. tRPC brilha em monorepo TS fim-a-fim, mas cria acoplamento ruim nessas bordas.
- **O accept header ja e `application/json, application/problem+json`** — ou seja, o padrao de erro ja previsto e **RFC 7807 (Problem Details)**. Vamos padronizar todos os erros nesse formato.

Consequencia pratica: **toda nova entidade e um novo path no `openapi.yaml` + `orval` para regenerar**. O contrato e a fonte da verdade. Nenhuma rota deve ser escrita "na mao" no cliente.

---

### 2. Modelo de dados no servidor (a decisao estrutural que destrava tudo)

Antes dos endpoints, a correcao que o time de dados ja identificou e **pre-requisito de sync**: separar *conteudo* de *estado-por-usuario*.

Hoje `favorito` e `ordem` vivem dentro de `Ponto`. Se dois dispositivos do mesmo usuario (celular + web) reordenarem, ha conflito destrutivo; e se o ponto virar catalogo compartilhado, favoritos vazam entre usuarios. Solucao: `favorito` e `ordem` saem para tabelas de estado por usuario.

Tabelas Drizzle minimas (`lib/db/src/schema/`, hoje vazio). Campos de sync em **negrito**:

```ts
// schema/users.ts
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  plano: text("plano").notNull().default("free"), // free | pro | terreiro
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull().defaultNow(),
});

// schema/pontos.ts  (CONTEUDO — sem favorito/ordem)
export const pontos = pgTable("pontos", {
  id: text("id").primaryKey(),               // ULID gerado no cliente (ver §3)
  ownerId: uuid("owner_id").references(() => users.id), // NULL = catalogo global
  subcategoriaId: text("subcategoria_id").notNull(),
  titulo: text("titulo").notNull(),
  letra: text("letra").notNull(),
  legacyId: text("legacy_id"),               // rastreabilidade do id local antigo
  criadoEm: timestamp("criado_em", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(), // AUTORITATIVO do servidor
  deletedAt: timestamp("deleted_at", { withTimezone: true }),           // TOMBSTONE (soft-delete)
});

// schema/user_ponto_state.ts  (ESTADO POR USUARIO — resolve conflito e privacidade)
export const userPontoState = pgTable("user_ponto_state", {
  userId: uuid("user_id").notNull().references(() => users.id),
  pontoId: text("ponto_id").notNull(),
  favorito: boolean("favorito").notNull().default(false),
  ordem: text("ordem").notNull(),   // rank fracionario (string LexoRank), NAO inteiro denso
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (t) => ({ pk: primaryKey({ columns: [t.userId, t.pontoId] }) }));
```

`orixas` e `subcategorias` seguem o mesmo padrao (`ownerId`, `updatedAt`, `deletedAt`), com `ordem` movida para `user_orixa_state`/`user_subcategoria_state`. `orixas`/`subcategorias`/`pontos` com `ownerId = NULL` sao o **catalogo global** (seed a partir de `pontos-completo.json`, 384 pontos); com `ownerId` preenchido sao autorais do usuario.

Regra de ouro: **todo registro sincronizavel tem `id` estavel, `updatedAt` (do servidor) e `deletedAt`**. Isso e o que habilita delta pull + tombstones (§3).

---

### 3. Estrategia de sincronizacao

Duas perguntas do enunciado: (a) LWW por campo vs `updatedAt` + tombstones; (b) fila offline + reconciliacao.

#### 3a. Modelo de conflito: `updatedAt` + tombstones, com LWW **por entidade** — e LWW por campo so onde importa

**Recomendacao:** nao adotar CRDT nem LWW-por-campo generalizado no primeiro corte. Usar:

- **`updatedAt` server-authoritative + tombstones (`deletedAt`)** como base. O servidor carimba `updatedAt` no momento do commit (nao confia no relogio do cliente para ordenar). Cliente manda seu `updatedAt` local so como referencia de conflito.
- **LWW por entidade** (o registro inteiro vence pelo `updatedAt` mais recente) para conteudo autoral (letra, titulo). Simples e suficiente: um usuario editando a mesma letra em dois lugares e raro e o "ultimo a salvar vence" e aceitavel.
- **A separacao em `user_*_state` ja elimina a maior fonte de conflito.** `favorito` e `ordem` sao por-usuario; o unico conflito possivel e o mesmo usuario em dois dispositivos, e ai LWW por linha `(userId, pontoId)` resolve bem.
- **`ordem` como rank fracionario (string), nao inteiro denso.** Hoje um reorder reindexa todo o array `0..n-1` (`context.tsx`), o que gera conflito em cada item ao sincronizar. Com fractional indexing (ex. biblioteca `fractional-indexing` / LexoRank), mover um item altera **so o rank daquele item** — dois dispositivos reordenando itens diferentes fazem merge limpo, sem tocar os vizinhos.

Por que **nao** LWW-por-campo em tudo: exige guardar `updatedAt` por campo (multiplica o schema e o payload) e so paga a pena quando dois campos independentes da mesma entidade sao editados concorrentemente com frequencia — nao e o caso aqui. Fica como evolucao futura se surgir demanda real.

#### 3b. Protocolo: delta pull (`since`) + push de fila de mutacoes (idempotente)

Dois endpoints formam o coracao do sync:

**Pull (baixar mudancas):** `GET /api/v1/sync/changes?since=<cursor>`
- `since` e um cursor opaco (recomendo o `updatedAt` do servidor em formato ordenavel, ou um `bigint` de sequencia). Na primeira sync, `since` vazio = full snapshot.
- Retorna todos os registros (de todas as entidades do usuario + catalogo) com `updatedAt > since`, **incluindo tombstones** (registros com `deletedAt` != null), para o cliente apagar localmente o que foi removido em outro dispositivo.
- Retorna `nextCursor` para a proxima chamada.

**Push (subir mutacoes offline):** `POST /api/v1/sync/mutations`
- Corpo = a fila de mutacoes acumulada offline (envelope abaixo). Cada mutacao carrega um `mutationId` (ULID) usado como **chave de idempotencia**: reenviar a mesma fila (retry apos rede cair) nao duplica nada. O servidor mantem uma tabela `processed_mutations(mutationId)` e ignora repetidas.
- O servidor aplica cada mutacao, resolve conflito por `updatedAt`, e retorna o resultado autoritativo (o `updatedAt` final e eventuais rejeicoes por conflito), que o cliente reconcilia.

Envelope de mutacao (o mesmo shape gravado na fila IndexedDB e enviado no push):

```jsonc
{
  "mutations": [
    {
      "mutationId": "01J8Z...",          // ULID, idempotencia
      "entidade": "ponto",               // ponto | orixa | subcategoria | ponto_state | ...
      "op": "upsert",                    // upsert | delete
      "id": "01J8Y...",                  // ULID do registro (gerado no cliente na criacao)
      "baseUpdatedAt": "2026-07-01T...", // updatedAt que o cliente tinha (deteccao de conflito)
      "patch": { "titulo": "...", "letra": "..." },
      "clientTs": "2026-07-07T10:00:00Z" // relogio local, so telemetria/ordenacao intra-fila
    }
  ]
}
```

**IDs: ULID gerado no cliente (trocar `gerarId()`).** Hoje `gerarId()` = `Date.now()-random`, colide entre dispositivos e nao serve como PK compartilhada. ULID resolve: e globalmente unico, ordenavel por tempo (bom para indices) e — critico para offline — **o cliente gera o id na hora da criacao, sem round-trip ao servidor**. Uma mutacao criada offline ja nasce com o id final; ao sincronizar nao precisa remapear id temporario -> id do servidor. Guardar o id local antigo em `legacyId` na migracao.

#### 3c. Reconciliacao ao reconectar (fluxo)

1. **Push primeiro:** envia a fila de mutacoes pendentes (`POST /sync/mutations`). Servidor aplica e devolve `updatedAt` autoritativos + conflitos.
2. **Aplica retorno:** para cada mutacao aceita, marca como sincronizada e atualiza o `updatedAt` local com o do servidor. Para conflitos (servidor tinha `updatedAt` maior que `baseUpdatedAt`), o servidor venceu — cliente descarta a versao local daquele campo/entidade.
3. **Pull depois:** `GET /sync/changes?since=<ultimoCursor>` traz tudo que mudou em outros dispositivos (inclusive tombstones), aplica no IndexedDB, atualiza cursor.
4. **UI reflete:** o Context passa a ler do IndexedDB (ver §4); a tela re-renderiza com o estado reconciliado.

Sobre os campos citados: **`criadoEm`** permanece imutavel (definido na criacao, so telemetria/exibicao). **`updatedAt`** e o eixo de todo o sync (server-authoritative). **`ordem`** vira rank fracionario para merge sem conflito. Nenhum deles deve continuar sendo inteiro/relogio-local como hoje.

---

### 4. UX offline do PWA (IndexedDB + Service Worker + Background Sync)

O app hoje e offline por acaso (localStorage sincrono). Para sync robusto, precisa de offline **por design**:

- **Migrar de localStorage para IndexedDB** como store local. localStorage e sincrono, limitado a ~5MB e so string; com 384+ pontos por usuario + fila de mutacoes + catalogo, IndexedDB (assincrono, sem esse teto) e o certo. Usar uma lib fina (`idb` ou `dexie`). O `AppData` blob atual vira object stores: `pontos`, `orixas`, `subcategorias`, `user_state`, e uma store dedicada `outbox` (a fila de mutacoes).
- **O Context vira async e otimista.** Hoje `context.tsx` grava sincrono e re-renderiza. Novo fluxo por mutacao: (1) aplica otimista no IndexedDB + estado; (2) enfileira o envelope na `outbox`; (3) dispara sync (ou registra Background Sync se offline). A UI ganha estados de `salvando/erro/pendente` que hoje inexistem — recomendo um badge global "N alteracoes pendentes" em vez de spinner por item (menos intrusivo, coerente com o uso durante a gira).
- **Service Worker (ja existe via `vite-plugin-pwa`)**: manter cache do app-shell (ja funciona). Adicionar cache **stale-while-revalidate** para o catalogo global (conteudo read-mostly) e **network-only** para endpoints de sync/mutacao.
- **Background Sync API**: registrar uma sync tag (ex. `sync-outbox`) quando um push falha por estar offline. O SW acorda e drena a `outbox` quando a conectividade volta, mesmo com o app fechado. Fallback para navegadores sem Background Sync (iOS Safari nao suporta): drenar a `outbox` no `visibilitychange`/`online` event e no proximo boot do app. Como iOS e relevante para o publico (muitos ogas em iPhone), esse fallback nao e opcional.
- **Leitura durante a gira nunca depende de rede.** Requisito de dominio: achar o ponto em tempo real, ambiente barulhento, conexao ruim no terreiro. Toda leitura serve do IndexedDB; a rede so sincroniza em background.

---

### 5. Versionamento de API

- **Prefixo de versao na URL: `/api/v1/...`.** Hoje o router monta em `/api` (`app.ts`); adicionar o segmento `v1`. Barato, explicito, e o mutator `custom-fetch` (baseUrl `/api`) acomoda sem mudanca.
- **`openapi.yaml` `info.version`** acompanha (hoje `0.1.0`). **Atencao:** o `titleTransformer` forca `info.title = "Api"` e os imports dependem disso — nao mexer no title, so no version.
- **Politica de compatibilidade:** mudancas **aditivas** (novo campo opcional, novo endpoint) nao sao breaking e ficam em `v1`. Mudancas **breaking** (remover/renomear campo, mudar semantica) abrem `v2` e `v1` fica em suporte por um periodo. Como cliente e servidor compartilham os tipos gerados pelo Orval, um deploy coordenado e o caminho normal; `v2` so quando ha clientes antigos instalados (PWA/mobile) que nao atualizam na hora.
- **Versao de schema do sync:** incluir `schemaVersion` no payload de sync para o cliente saber migrar o IndexedDB local quando o shape evolui (algo que hoje nao existe — nao ha migracao de schema no localStorage).

---

### 6. Webhooks de pagamento (Stripe)

Fluxo de billing alinhado ao plano free/pro/terreiro:

- **Checkout:** `POST /api/v1/billing/checkout` cria uma Stripe Checkout Session e retorna a URL; o front redireciona. **Nunca** confiar no redirect de sucesso para liberar plano — a fonte da verdade e o webhook.
- **Webhook:** `POST /api/v1/webhooks/stripe` — pontos criticos:
  - **Raw body:** a verificacao de assinatura Stripe (`stripe.webhooks.constructEvent`) exige o corpo **cru**, mas `app.ts` faz `express.json()` global que consome o body. Registrar essa rota **antes** do `express.json()` com `express.raw({ type: 'application/json' })`, ou excluir o path do parser JSON. Este e o erro classico #1 de integracao Stripe — deixar documentado no scaffold.
  - **Verificacao de assinatura** com `STRIPE_WEBHOOK_SECRET` (nova env; hoje nao ha `.env`, so `DATABASE_URL` exigida).
  - **Idempotencia:** Stripe reentrega eventos. Tabela `stripe_events(id primary key)`; se o `event.id` ja existe, retorna `200` sem reprocessar.
  - **Eventos a tratar:** `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted` -> atualizam `users.plano` e um registro `subscriptions`. Responder `2xx` rapido (idealmente enfileirar processamento pesado) para Stripe nao marcar como falha e reenviar.
- **Sensibilidade de dominio:** o publico e sensivel a "mercantilizar o sagrado". Recomendo billing discreto, ticket baixo, e o eixo B2B (conta de terreiro dividindo custo entre membros) como plano principal — isso e produto, nao so tecnica, mas afeta o schema (`subscriptions` precisa suportar assinatura por terreiro/grupo, nao so por usuario). Reservar `ownerId`/`terreiroId` desde ja.

---

### 7. Plano incremental — menor passo de "localStorage-only" para "conta + nuvem"

O objetivo e evitar big-bang. A sequencia abaixo entrega valor a cada etapa e **so a Etapa 2 exige reescrever o Context**.

**Etapa 0 — Preparar o schema local (sem backend, sem risco).**
No `types.ts`/`storage.ts`: trocar `gerarId()` por ULID; adicionar `updatedAt` e `deletedAt` (soft-delete) a `Ponto/Subcategoria/Orixa`; migrar `favorito`/`ordem` conceitualmente para um sub-objeto de estado. Escrever a migracao do blob localStorage existente (preserva `legacyId`). Ainda 100% offline, mas ja no formato sincronizavel. Deletar `ModalReorganizar.tsx` (codigo morto).

**Etapa 1 — Conta + nuvem via SNAPSHOT (o menor passo real).**
Este e o "conta + nuvem" com esforco minimo, reaproveitando o formato `AppData` que o export/import ja usa:
- Backend: criar tabelas `users` + `sessions` + `snapshots(userId, blob jsonb, updatedAt)`. Auth simples (magic-link por email ou email+senha). Dois endpoints: `PUT /api/v1/me/snapshot` (sobe o `AppData` inteiro) e `GET /api/v1/me/snapshot`.
- Expandir `openapi.yaml` com esses paths + rodar `orval`. O cliente ja tem React Query e o `setAuthTokenGetter` prontos.
- Frontend: tela de login (usar `wouter`, ja instalado e nao usado, para `/login` e auth-gating). Apos login, `GET snapshot`; ao fechar/em intervalos, `PUT snapshot`. LWW no blob inteiro guardado por `updatedAt` (se o servidor tem `updatedAt` maior, avisa "dados mais novos na nuvem").
- **Resultado:** usuario loga, seus dados vao para a nuvem e voltam em outro dispositivo. Nao e sync fino (o blob inteiro sobe/desce, ultimo a salvar vence o documento todo), mas ja e "backup em nuvem + multi-dispositivo basico" — exatamente o que um plano freemium vende — **sem reescrever o Context** (a escrita continua sendo do blob, so ganhou um `PUT` remoto). E o corte de menor risco.

**Etapa 2 — Sync incremental (a reescrita controlada do Context).**
- Migrar store local para IndexedDB + `outbox` (§4). Context vira async/otimista.
- Quebrar o snapshot em entidades: tabelas Drizzle granulares (§2) + endpoints CRUD + `GET /sync/changes` e `POST /sync/mutations` (§3). Regenerar Orval.
- Background Sync + fallback iOS. Aqui o produto ganha sync de verdade, tolerante a offline e a dois dispositivos simultaneos.

**Etapa 3 — Produto: catalogo, favoritos por usuario, terreiros, billing.**
- Seed do catalogo global a partir de `pontos-completo.json` (reconciliar com o seed em uso). Favoritos/ordem ja em `user_*_state`. Colecoes/setlists (a "gira do dia"). Papeis de terreiro (dirigente/oga/medium). Stripe (§6).

---

### 8. Exemplos de contrato de endpoints

Erros sempre em **RFC 7807** (`application/problem+json`, ja no accept header do mutator).

**Auth**
```
POST /api/v1/auth/magic-link      { email }                  -> 202  (envia email)
POST /api/v1/auth/verify          { token }                  -> 200  { accessToken, refreshToken, user }
POST /api/v1/auth/refresh         { refreshToken }           -> 200  { accessToken }
POST /api/v1/auth/logout          (Bearer)                   -> 204
GET  /api/v1/me                   (Bearer)                   -> 200  { id, email, plano }
```

**Pontos CRUD** (Bearer; id e ULID gerado no cliente para permitir criacao offline)
```
GET    /api/v1/pontos?subcategoriaId=...   -> 200 { items: Ponto[], nextCursor }
POST   /api/v1/pontos    { id, subcategoriaId, titulo, letra, criadoEm }
                         -> 201 { ...Ponto, updatedAt }          // servidor carimba updatedAt
PATCH  /api/v1/pontos/{id}  { patch, baseUpdatedAt }
                         -> 200 Ponto  |  409 problem+json (conflito, retorna versao do servidor)
DELETE /api/v1/pontos/{id}                -> 204                 // soft-delete: seta deletedAt
```

**Favoritos / estado por usuario** (nao mexe no conteudo)
```
PUT /api/v1/pontos/{id}/state  { favorito, ordem }  -> 200 { pontoId, favorito, ordem, updatedAt }
```

**Colecoes / setlists** ("gira do dia" — feature B2B chave)
```
POST /api/v1/colecoes            { id, nome }               -> 201 Colecao
POST /api/v1/colecoes/{id}/itens { pontoId, ordem }         -> 201 ItemColecao
GET  /api/v1/colecoes/{id}                                  -> 200 { ...Colecao, itens: [] }
```

**Sync (coracao do offline-first)**
```
GET  /api/v1/sync/changes?since=<cursor>
     -> 200 {
          nextCursor: "opaque",
          orixas:        Orixa[],          // inclui tombstones (deletedAt != null)
          subcategorias: Subcategoria[],
          pontos:        Ponto[],
          userState:     UserPontoState[]
        }

POST /api/v1/sync/mutations
     { mutations: [ { mutationId, entidade, op, id, baseUpdatedAt, patch } ] }
     -> 200 {
          results: [
            { mutationId, status: "applied", id, updatedAt },
            { mutationId, status: "conflict", id, server: { ...registroAtual } },
            { mutationId, status: "duplicate" }   // idempotencia: ja processado
          ],
          nextCursor: "opaque"
        }
```

**Billing / webhooks**
```
POST /api/v1/billing/checkout   (Bearer) { plano }   -> 200 { checkoutUrl }
POST /api/v1/webhooks/stripe    (raw body, Stripe-Signature)  -> 200 {received:true}
     // fora do express.json(); verifica assinatura; idempotente por event.id
```

Cada bloco acima entra como `paths` + `components/schemas` no `openapi.yaml` e e materializado pelo `orval` nos dois pacotes (`api-client-react`, `api-zod`) — o backend valida a entrada com o schema Zod gerado, exatamente como `/healthz` ja faz hoje com `HealthCheckResponse.parse()`.


**Decisões desta frente:**

- **Estilo de API: REST (OpenAPI/Orval) vs tRPC** → Manter REST descrito em openapi.yaml e gerado por Orval; nao migrar para tRPC
  - _Racional:_ O pipeline Orval ja gera hooks React Query + schemas Zod sincronizados, o backend ja consome @workspace/api-zod, e o custom-fetch.ts ja implementa setBaseUrl + setAuthTokenGetter (bearer) e accept problem+json. REST tambem e obrigatorio nas bordas (webhooks Stripe, futura app Expo/mobile, integracoes B2B) onde tRPC atrapalharia. Migrar jogaria fora esse investimento.
- **Modelo de conflito de sync: LWW-por-campo vs updatedAt+tombstones** → updatedAt server-authoritative + tombstones (deletedAt) + LWW por entidade; separar favorito/ordem em tabelas user_*_state; NAO adotar LWW-por-campo nem CRDT no primeiro corte
  - _Racional:_ A maior fonte de conflito (favorito/ordem embutidos no Ponto) desaparece ao mover esse estado para tabelas por-usuario; sobra so o mesmo usuario em dois dispositivos, resolvido por LWW da linha (userId,pontoId). LWW-por-campo multiplica schema/payload e so paga em edicao concorrente frequente de campos independentes, que nao e o caso. Servidor carimba updatedAt para nao confiar no relogio do cliente.
- **Campo ordem: inteiro denso reindexado vs rank fracionario** → Trocar ordem inteiro (reindexa 0..n-1 a cada reorder, como em context.tsx) por rank fracionario string (fractional-indexing/LexoRank)
  - _Racional:_ Reindexar o array inteiro faz cada reorder tocar todos os itens, gerando conflito em massa no sync. Com rank fracionario, mover um item altera so o rank daquele item, permitindo merge limpo de reorders concorrentes em dispositivos diferentes.
- **Geracao de IDs: gerarId() client-side vs ULID** → Substituir gerarId() (Date.now()-random) por ULID gerado no cliente; preservar id antigo em legacyId na migracao
  - _Racional:_ gerarId() colide entre dispositivos e nao serve como PK compartilhada. ULID e globalmente unico, ordenavel por tempo (bom indice) e permite criar registros offline ja com o id final, sem round-trip nem remapeamento de id temporario ao sincronizar.
- **Protocolo de sync** → Delta pull GET /sync/changes?since=<cursor> (inclui tombstones) + push POST /sync/mutations com fila de mutacoes idempotente por mutationId (ULID)
  - _Racional:_ Delta pull minimiza trafego e traz tombstones para apagar localmente o que outro dispositivo removeu; push idempotente por mutationId torna o retry apos queda de rede seguro (tabela processed_mutations ignora repetidas). Reconciliacao: push primeiro, aplica updatedAt autoritativo/conflitos, depois pull.
- **Armazenamento local offline: localStorage vs IndexedDB** → Migrar de localStorage para IndexedDB (lib idb/dexie), com object stores por entidade + store outbox para a fila de mutacoes; Context vira async/otimista
  - _Racional:_ localStorage e sincrono, string-only e limitado a ~5MB; com 384+ pontos + catalogo + fila de mutacoes isso estoura e nao suporta a fila/estados de sync. IndexedDB e assincrono e sem esse teto. Leitura durante a gira sempre serve do IndexedDB, nunca depende de rede.
- **Background sync e suporte iOS** → Usar Background Sync API (tag sync-outbox) para drenar a outbox com o app fechado, com fallback obrigatorio via eventos online/visibilitychange/boot para iOS Safari
  - _Racional:_ Background Sync acorda o service worker quando a rede volta, mas iOS Safari nao o suporta e o publico (muitos ogas em iPhone) e relevante, entao o fallback nao e opcional.
- **Versionamento de API** → Prefixo /api/v1 na URL (router hoje monta em /api); mudancas aditivas ficam em v1, breaking abre v2; incluir schemaVersion no payload de sync; NAO alterar info.title (o titleTransformer forca 'Api' e os imports dependem disso)
  - _Racional:_ Prefixo de URL e explicito, barato e acomodado pelo custom-fetch (baseUrl /api). schemaVersion permite migrar o IndexedDB local quando o shape evolui, algo inexistente hoje no localStorage.
- **Webhooks Stripe: parsing e idempotencia** → Registrar POST /webhooks/stripe com express.raw ANTES do express.json() global de app.ts, verificar assinatura com STRIPE_WEBHOOK_SECRET, e deduplicar por event.id numa tabela stripe_events; liberar plano so pelo webhook, nunca pelo redirect de sucesso
  - _Racional:_ A verificacao de assinatura Stripe exige o body cru, mas app.ts faz express.json() global que o consome (erro classico #1). Stripe reentrega eventos, entao o processamento precisa ser idempotente. O redirect de sucesso nao e confiavel como fonte da verdade do pagamento.
- **Menor passo de localStorage-only para conta+nuvem** → Etapa 1 via SNAPSHOT: tabelas users/sessions/snapshots(jsonb), auth simples, endpoints PUT/GET /me/snapshot que sobem/baixam o AppData inteiro (reaproveitando o formato do export/import), LWW no blob por updatedAt; adiar o sync fino e a reescrita do Context para a Etapa 2
  - _Racional:_ Entrega backup em nuvem + multi-dispositivo basico (o que um freemium vende) sem reescrever o Context: a escrita continua sendo do blob, so ganha um PUT remoto. Reusa o formato AppData que export/import ja produz e o React Query + setAuthTokenGetter ja prontos. E o corte de menor risco antes do sync incremental.
- **Separacao conteudo vs estado-por-usuario no schema** → Tirar favorito e ordem de Ponto/Subcategoria/Orixa e coloca-los em user_ponto_state/user_subcategoria_state/user_orixa_state; conteudo com ownerId NULL = catalogo global, ownerId preenchido = autoral
  - _Racional:_ Pre-requisito de sync e de multi-tenant: com favorito/ordem embutidos no conteudo, dois usuarios nao podem ter favoritos/ordenacoes distintos do mesmo ponto e ha conflito destrutivo entre dispositivos. Separar habilita catalogo compartilhado sem vazar preferencia e reduz drasticamente conflitos de sync.

**Questões abertas:** (Modelo de monetizacao principal: B2C freemium individual (backup/sync/busca avancada) ou B2B por terreiro (conta coletiva com papeis dirigente/oga/medium dividindo custo)? Isso muda o schema de subscriptions (por usuario vs por terreiro/grupo) e precisa ser reservado desde ja.); (O catalogo de pontos sera compartilhado globalmente entre usuarios (dedup de letras, catalogo curado) ou cada usuario/terreiro tem sua copia isolada? Define se pontos tem ownerId NULL (global) e se ha necessidade de moderacao/curadoria de conteudo entre vertentes (risco de sensibilidade religiosa).); (Estrategia de auth: magic-link por email, email+senha, ou OAuth social? Afeta a UI de login, o schema de sessions e o fluxo de verificacao.); (Provedor de hospedagem definitivo do backend (o dono cogitou AWS): Vercel Functions, Railway, Fly.io ou AWS ECS/RDS? Afeta como o api-server e deployado (hoje so o frontend vai para Vercel) e onde o Postgres roda.); (Ao reconciliar pontos-completo.json (384 pontos) com o seed em uso em storage.ts (248 pontos) para o catalogo central, quando os IDs coincidem (ex. lo-1) mas o conteudo pode ter divergido, qual versao e a canonica?); (Politica de retencao/expiracao de tombstones: por quanto tempo manter registros com deletedAt antes de purgar, considerando que um dispositivo pode ficar offline por muito tempo e ainda precisar do delta de exclusao?)

---

### 7.x Blueprint de Mudanças no Frontend — Umbanda Ponto Organizer como Produto

# Mudanças no Frontend (React 19) para suportar produto

> Escopo: só o app `artifacts/pontos-umbanda`. Assume que o backend evolui em paralelo conforme as outras seções do blueprint (tabelas em `lib/db`, rotas em `api-server`, spec em `lib/api-spec/openapi.yaml` + codegen Orval para `lib/api-client-react`). Aqui desenho **como o frontend absorve isso sem reescrever o que já funciona**.

## 0. Princípio norteador

O app atual funciona 100% síncrono sobre um Context que lê/escreve um blob único em `localStorage`. Não dá pra simplesmente "plugar rede" nesse Context — ele não tem estados de loading/erro, e todo componente assume que `dados` está sempre populado e que mutações são instantâneas. A estratégia é:

1. **Isolar a persistência atrás de uma interface de repositório** (`DataRepository`), com uma implementação local (o `storage.ts` de hoje, quase inalterado) e uma implementação remota (React Query + client gerado por Orval), escolhidas em runtime conforme o estado de autenticação.
2. **Preservar a superfície pública de `useApp()`** o máximo possível, para que `TelaOrixas`, `TelaSubcategorias`, `CardPonto` e os modais continuem consumindo `dados` + funções de mutação praticamente do jeito que consomem hoje. O que muda é o *interior* do Provider, não a API que os componentes chamam.
3. **Local-first continua sendo o modo padrão**, inclusive para usuário logado (cache otimista + sync em segundo plano) — é isso que mantém o app usável offline na gira, que é o cenário de uso real (ogã cantando com o celular, sinal ruim no salão do terreiro).
4. Nada disso é big-bang: cada fase abaixo é shippable e não quebra o app atual em produção.

## 1. Arquitetura alvo (visão de camadas)

```
App.tsx
 └─ QueryClientProvider (@tanstack/react-query)
     └─ AuthProvider (src/state/auth-context.tsx)      [NOVO]
         └─ Router (wouter)                             [NOVO — já instalado, nunca usado]
             └─ AppProvider (src/context.tsx)            [REFATORADO]
                 └─ Rotas: Home, Subcategorias, Login, Cadastro, Conta,
                           Planos, Terreiro, Apresentacao, Compartilhado
```

Camada de dados:

```
src/repository/
  types.ts     -> interface DataRepository (contrato único)
  local.ts     -> LocalRepository  (ex-storage.ts, quase igual, agora "async-shaped")
  remote.ts    -> RemoteRepository (usa @workspace/api-client-react gerado por Orval)
  index.ts     -> factory: escolhe local vs remoto conforme sessão
src/storage.ts -> vira um re-export fino de local.ts por 1-2 releases (compat), depois remove
```

## 2. Roteamento real (wouter)

`wouter` já está no `package.json` e nunca foi importado — é a peça mais barata de destravar primeiro, porque tudo o resto (auth-gating, deep link para paywall, link de compartilhamento, voltar do modo apresentação) depende de haver uma URL real.

**Muda `src/App.tsx`**, que hoje é só um `useState<Orixa|null>` alternando duas telas:

```tsx
// src/App.tsx (novo)
import { Router, Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { AuthProvider } from "@/state/auth-context";
import { AppProvider } from "@/context";
import { InstallBanner } from "@/components/InstallBanner";
import { TelaOrixas } from "@/pages/TelaOrixas";
import { TelaSubcategorias } from "@/pages/TelaSubcategorias";
import { Login, Cadastro, Conta, Planos, Terreiro, Apresentacao, Compartilhado } from "@/pages";
import { RotaProtegida } from "@/components/RotaProtegida";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <Router>
            <Switch>
              <Route path="/" component={TelaOrixas} />
              <Route path="/orixa/:orixaId" component={TelaSubcategorias} />
              <Route path="/login" component={Login} />
              <Route path="/cadastro" component={Cadastro} />
              <Route path="/compartilhado/:token" component={Compartilhado} />
              <Route path="/apresentacao" component={Apresentacao} />
              <Route path="/conta">{() => <RotaProtegida><Conta /></RotaProtegida>}</Route>
              <Route path="/terreiro">{() => <RotaProtegida><Terreiro /></RotaProtegida>}</Route>
              <Route path="/planos" component={Planos} />
            </Switch>
          </Router>
          <InstallBanner />
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
```

Pontos importantes:
- `/orixa/:orixaId` substitui o `useState` local em `AppInner` — `TelaSubcategorias` passa a ler `orixaId` via `useParams()` do wouter e buscar o orixá em `dados.orixas`, em vez de receber `orixa` por prop. Isso também resolve de graça o "voltar" (histórico do navegador/gesto do celular) que hoje é reimplementado à mão com `onVoltar`.
- Isso é uma mudança mecânica e de baixo risco: `TelaOrixas` troca `onSelectOrixa={setOrixaSelecionado}` por `onSelectOrixa={(o) => navigate(`/orixa/${o.id}`)}` (hook `useLocation` do wouter).
- `RotaProtegida` é um componente simples: se `auth.status === "carregando"` mostra skeleton; se `status === "anonimo"` redireciona para `/login?next=/conta`; senão renderiza `children`.

## 3. Camada de repositório — refatorar `storage.ts`

Hoje `storage.ts` (1351 linhas, ~1300 delas são o seed hardcoded) mistura três responsabilidades: **dados semente**, **persistência local** e **serialização de import/export**. Separar:

```
src/data/seed.ts          -> ORIXAS_PADRAO, SUBCATEGORIAS_PADRAO, PONTOS_PADRAO (as ~1300 linhas, movidas 1:1)
src/repository/local.ts   -> carregarDados/salvarDados/exportarDados/importarDados/gerarId (quase idênticos)
src/repository/types.ts   -> interface DataRepository
src/repository/remote.ts  -> implementação que fala com a API via api-client-react
src/repository/index.ts   -> useRepository() — factory reativa ao estado de auth
```

`src/repository/types.ts` (contrato único que Local e Remote implementam):

```ts
export interface DataRepository {
  carregar(): Promise<AppData>;
  // CRUD granular (não blob inteiro) — já compatível com o formato
  // de endpoints REST/OpenAPI que o backend vai expor por entidade
  orixas: EntidadeRepo<Orixa, NovoOrixaInput>;
  subcategorias: EntidadeRepo<Subcategoria, NovaSubcategoriaInput>;
  pontos: EntidadeRepo<Ponto, NovoPontoInput> & {
    toggleFavorito(id: string): Promise<Ponto>;
    mover(id: string, novaSubcategoriaId: string, posicao?: number): Promise<Ponto>;
  };
  reordenar(tipo: "orixas" | "subcategorias" | "pontos", escopoId: string | null, ids: string[]): Promise<void>;
  exportar(): Promise<Blob>;
  importar(arquivo: File): Promise<{ importados: number; conflitos: number }>;
}

interface EntidadeRepo<T, TInput> {
  criar(input: TInput): Promise<T>;
  atualizar(id: string, patch: Partial<TInput>): Promise<T>;
  excluir(id: string): Promise<void>;
}
```

**Por que granular e não "salvar o blob inteiro"**: o backend real (quando existir) vai expor endpoints por entidade (`POST /pontos`, `PATCH /pontos/:id`, ...), gerados via OpenAPI/Orval — não um `PUT /app-data`. Se a interface do frontend já for granular desde a versão local, o dia que `RemoteRepository` for implementado ele só chama os hooks do Orval 1:1, sem reinventar payloads. `LocalRepository` implementa a mesma interface operando sobre o blob em memória (igual hoje), só que devolvendo `Promise` — no navegador isso resolve na mesma tick, é "assíncrono de mentirinha" só para uniformizar a assinatura.

`src/repository/local.ts` — a função `salvarDados` de hoje (`storage.ts:1313`) fica praticamente igual, só passa a ser chamada internamente pelos métodos do `EntidadeRepo`. `gerarId()` (`storage.ts:1349`, hoje `${Date.now()}-${random}`) **deve trocar por `crypto.randomUUID()`** já nesta fase — é grátis, remove o risco de colisão entre dispositivos, e evita ter que reescrever IDs na migração para o backend depois.

`src/repository/index.ts`:

```ts
export function useRepository(): DataRepository {
  const { status } = useAuth();
  return useMemo(
    () => (status === "autenticado" ? remoteRepository : localRepository),
    [status]
  );
}
```

## 4. `context.tsx` — o que muda por dentro, o que não muda por fora

`AppContextType` (hoje 20 funções síncronas, `context.tsx:5-31`) **mantém a mesma lista de nomes de função** que os componentes já chamam (`adicionarPonto`, `toggleFavorito`, `reordenarPontos`, etc.) para não forçar reescrita de `TelaOrixas.tsx`, `TelaSubcategorias.tsx`, `CardPonto.tsx` e os 5 modais. O que muda:

1. Cada função de mutação passa a chamar `repository.pontos.criar(...)` etc. em vez de montar o objeto e chamar `atualizar()` direto no `localStorage`.
2. Adiciona **optimistic update**: atualiza `dados` no estado local imediatamente (igual hoje, sensação de app instantâneo é mantida), dispara a chamada ao repositório em paralelo, e se falhar (`RemoteRepository` lança erro), reverte o estado e dispara um toast de erro (`sonner`, já é dependência instalada e não usada).
3. Adiciona ao `AppContextType`: `carregando: boolean`, `erro: string | null`, `sincronizando: boolean` — necessários porque com `RemoteRepository` o `carregar()` inicial é uma chamada de rede real.

```tsx
// src/context.tsx (trecho ilustrativo da nova adicionarPonto)
const adicionarPonto = useCallback(
  async (subcategoriaId: string, titulo: string, letra: string) => {
    const otimista: Ponto = { id: crypto.randomUUID(), subcategoriaId, titulo, letra,
      favorito: false, ordem: contarPontos(subcategoriaId), criadoEm: Date.now() };
    setDados((d) => ({ ...d, pontos: [...d.pontos, otimista] }));
    try {
      const salvo = await repository.pontos.criar({ subcategoriaId, titulo, letra });
      setDados((d) => ({ ...d, pontos: d.pontos.map((p) => (p.id === otimista.id ? salvo : p)) }));
    } catch (e) {
      setDados((d) => ({ ...d, pontos: d.pontos.filter((p) => p.id !== otimista.id) }));
      toast.error("Não deu para salvar. Verifique sua conexão.");
    }
  },
  [repository]
);
```

Para `LocalRepository`, esse fluxo colapsa de volta ao comportamento atual (resolve na hora, nunca erra) — **zero regressão para quem usa sem conta**.

### Carga inicial (`carregarDados`)

Hoje `AppProvider` inicializa com `useState<AppData>(() => carregarDados())` — síncrono, nunca vazio. Com `RemoteRepository`, a carga inicial é assíncrona. Estratégia (evita tela em branco e mantém offline-first):

- Estado inicial continua sendo o snapshot do `localStorage` (cache local), nunca `undefined`.
- Um `useEffect` dispara `repository.carregar()` em background quando `status === "autenticado"`; ao resolver, faz merge/replace e seta `sincronizando = false`.
- Isso é literalmente o padrão *stale-while-revalidate* do React Query — por isso a recomendação da próxima seção é implementar `RemoteRepository` **usando os hooks gerados pelo Orval por baixo dos panos**, e o `AppProvider` consumir esse cache do React Query, não reimplementar cache própria.

## 5. React Query convivendo com o Context (não substituindo)

`@tanstack/react-query` e `@workspace/api-client-react` já estão no `package.json` do app, instalados e nunca importados — isso já era antecipado no scaffold. A divisão de responsabilidade:

- **React Query é dono de tudo que é "servidor"**: sessão/auth, dados de conta, plano/assinatura, membros do terreiro, dados compartilhados públicos, e (quando `RemoteRepository` existir) o cache de orixás/subcategorias/pontos remotos.
- **O Context (`AppProvider`) continua dono do estado de UI derivado que os componentes consomem hoje** (`orixaSelecionado`, `subcategoriaSelecionada`, e o array `dados` já resolvido) — ele vira essencialmente um adaptador fino sobre o React Query + `LocalRepository`, não um substituto dele.
- Não colocar tudo em React Query direto nos componentes agora — isso obrigaria reescrever `TelaOrixas`/`TelaSubcategorias`/`CardPonto` para lidar com `isLoading`/`isError` em 15+ lugares de uma vez. Colocar React Query **atrás do repositório**, o Context absorve o loading/error uma vez só, e os componentes de conteúdo continuam simples.
- Onde React Query aparece **diretamente** nos componentes (sem passar pelo Context): telas novas que são puramente "tela de servidor" — `Conta.tsx`, `Planos.tsx`, `Terreiro.tsx`, `Login.tsx`/`Cadastro.tsx`. Essas não têm equivalente local/offline, então não faz sentido esconder atrás do repositório — usam hooks gerados direto no estilo `useHealthCheck` (ex.: `useGetTerreiroMembros()`, `useCreateAssinatura()`).

`src/lib/query-client.ts` (novo):

```ts
import { QueryClient } from "@tanstack/react-query";
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});
```

E em `src/main.tsx` ou `App.tsx`, configurar o `custom-fetch.ts` do `api-client-react` (já suporta isso nativamente — `setBaseUrl` e `setAuthTokenGetter`, vistos em `lib/api-client-react/src/custom-fetch.ts:28-42`) uma vez, no boot:

```ts
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";
setBaseUrl(import.meta.env.VITE_API_URL ?? ""); // vazio = mesmo host (Vercel rewrite /api)
setAuthTokenGetter(() => getSessaoAtual()?.token ?? null);
```

Isso significa que **nenhuma rota nova precisa de fetch manual** — basta o backend expor o endpoint no `openapi.yaml`, rodar `orval` em `lib/api-spec`, e o hook React Query já sai pronto e autenticado.

## 6. Autenticação: login, cadastro, "continuar sem conta"

### Novo: `src/state/auth-context.tsx`

```ts
type AuthStatus = "carregando" | "anonimo" | "autenticado";
interface AuthState {
  status: AuthStatus;
  usuario: Usuario | null; // { id, email, nome, plano, terreiroId? }
  login(email: string, senha: string): Promise<void>;
  cadastrar(email: string, senha: string, nome: string): Promise<void>;
  continuarSemConta(): void; // apenas seta status = "anonimo", explícito e persistido
  logout(): void;
}
```

- Estado inicial é `"carregando"` (tenta restaurar sessão via cookie/refresh-token ou token em `localStorage` + `GET /api/auth/me`). Se não houver sessão nem escolha prévia, mostra uma **tela de decisão** (não um modal bloqueante forçado) na primeira visita: "Entrar", "Criar conta" ou "Continuar sem conta" — grava a escolha "anonimo" em `localStorage` (chave separada, ex. `auth-choice`) para não repetir esse prompt a cada visita.
- **"Continuar sem conta" é e continua sendo o caminho padrão/zero-fricção** — reflete o app de hoje. Ele não é uma tela obrigatória de bloqueio; é oferecida, e se o usuário nunca decidir, depois de N interações (ex.: 2ª sessão, ou ao tentar uma feature que precisa de nuvem) reforça-se um convite discreto, não um paywall agressivo — coerente com a sensibilidade religiosa levantada na pesquisa de mercado (evitar parecer que está monetizando algo sagrado de forma invasiva).

### Novas páginas

- `src/pages/Login.tsx` — formulário simples (react-hook-form + zod, já instalados e não usados), chama `auth.login`. Estado de erro inline ("e-mail ou senha inválidos"), estado de loading no botão.
- `src/pages/Cadastro.tsx` — mesmo padrão + campo nome. **Após cadastro bem-sucedido, dispara o fluxo de migração de dados locais (seção 7) antes de navegar para `/`.**
- Ambas ficam acessíveis sem `RotaProtegida` (óbvio) e têm link cruzado + "Continuar sem conta" sempre visível — nunca forçar criação de conta para usar o app básico, isso mataria a base de usuários atual que já confia no app funcionar offline.

### Migração incremental (super importante): app já funciona sem login hoje

Essa fase **não exige que o usuário crie conta**. Enquanto `RemoteRepository`/backend de auth não existirem, `AuthProvider` pode simplesmente resolver sempre para `status: "anonimo"` e as rotas `/login`/`/cadastro` ficam com um formulário funcional mas apontando para endpoints que ainda não existem (ou nem são montadas nessa fase — ver roadmap). O ponto é: o roteamento e a divisão Context/Repository podem ser feitos e mergeados **antes** do backend de auth existir, sem risco.

## 7. Migrar dados locais ao criar conta

Fluxo concreto (`src/pages/Cadastro.tsx` + endpoint futuro `POST /api/importar`):

1. Usuário sem conta usa o app normalmente → dados em `localStorage['pontos-umbanda-data']`.
2. Cria conta. Imediatamente após `cadastrar()` resolver, o front verifica `localStorage.getItem('pontos-umbanda-data')`. Se existir e tiver conteúdo além do seed padrão (comparar contagem de pontos, ou um flag `personalizado: true` gravado sempre que houver qualquer mutação do usuário — precisa adicionar esse flag em `AppData` já na fase da seção 3), mostra uma tela de confirmação: **"Encontramos N pontos salvos neste aparelho. Quer levá-los para sua conta?"** com preview (contagem por orixá) e duas opções: "Importar tudo" / "Começar do zero na conta".
3. Se "Importar tudo": reaproveita literalmente o formato `AppData` que hoje já é usado em `exportarDados()`/`importarDados()` (`storage.ts:1317-1347`) como payload — não é preciso inventar um formato novo, o back recebe o mesmo JSON que o botão de backup já gera hoje. Backend faz o mapeamento de IDs antigos (`legacyId`) para novos e reconcilia com o catálogo padrão (evita duplicar os ~248 pontos seed se o usuário não os alterou — comparar por conteúdo/slug, não por ID).
4. Após importar com sucesso, `localStorage['pontos-umbanda-data']` local **não é apagado automaticamente** — vira um fallback offline. Ele passa a ser tratado como cache local do `RemoteRepository`, não mais como fonte de verdade.
5. Esse é o único fluxo de UI verdadeiramente novo e sensível — é o momento onde o usuário mais teme perder trabalho manual (pontos digitados à mão, favoritos organizados). Deve ter um estado de "importação em progresso" explícito e nunca apagar o localStorage antes de confirmação de sucesso do servidor.

## 8. Conta / perfil

`src/pages/Conta.tsx` (rota protegida): nome, e-mail, plano atual (com CTA para `/planos` se free), botão "sair", e — importante para reter a confiança de quem já usa export/import — **mantém visível o botão de export JSON manual** (`exportarDados`) mesmo para usuário logado, como "seu backup pessoal, além da nuvem". Não remover essa função nunca: é o mecanismo de portabilidade/confiança que o público de nicho religioso valoriza ("meus dados não ficam reféns do app").

## 9. Planos / upgrade / paywall

### Client-side feature gating

Novo hook `src/hooks/use-plano.ts`:

```ts
type Plano = "gratis" | "premium" | "terreiro";
const LIMITES: Record<Plano, { syncNuvem: boolean; membrosTerreiro: number; apresentacaoSemMarca: boolean }> = {
  gratis:   { syncNuvem: false, membrosTerreiro: 0, apresentacaoSemMarca: false },
  premium:  { syncNuvem: true,  membrosTerreiro: 0, apresentacaoSemMarca: true  },
  terreiro: { syncNuvem: true,  membrosTerreiro: 20, apresentacaoSemMarca: true },
};
export function usePlano() {
  const { usuario } = useAuth();
  const plano = usuario?.plano ?? "gratis";
  return { plano, limites: LIMITES[plano], podeUsar: (f: keyof typeof LIMITES[Plano]) => Boolean(LIMITES[plano][f]) };
}
```

- **Regra de ouro: gating no cliente é só UX, nunca segurança.** Toda checagem de plano precisa ser reforçada no backend (o endpoint real rejeita/limita, não confia no client). O client só decide o que mostrar/esconder para dar feedback rápido.
- Componente `src/components/PaywallGate.tsx`: wrapper que renderiza `children` se `podeUsar(feature)`, senão renderiza um card de upsell com CTA para `/planos`. Usado em pontos específicos: botão "Sincronizar" (se free), botão "Convidar membro" na tela de Terreiro, marca d'água no modo apresentação.
- `src/pages/Planos.tsx`: comparação de planos (Grátis / Premium individual / Terreiro), integrado a Stripe futuramente (fora de escopo frontend imediato — hoje `pnpm-workspace.yaml` já exclui `stripe-replit-sync` da política de idade mínima, sinal de que a integração é esperada). Nesta fase o frontend só precisa de: tela de planos, botão "assinar" chamando `POST /api/assinaturas/checkout` (gerado via Orval quando existir) que devolve uma URL do Stripe Checkout para redirect — **não implementar formulário de cartão no frontend**, delegar 100% ao Checkout hospedado do Stripe.

## 10. Gestão do terreiro / membros (B2B — maior potencial comercial segundo a pesquisa)

Novo conceito no domínio, novo tipo em `types.ts`:

```ts
export interface Terreiro { id: string; nome: string; donoId: string; criadoEm: number; }
export interface Membro { id: string; terreiroId: string; usuarioId: string; papel: "dirigente" | "oga" | "medium"; convidadoEm: number; aceitoEm?: number; }
```

`src/pages/Terreiro.tsx` (rota protegida, só visível se `usuario.terreiroId` existir ou plano permitir criar um):
- Lista de membros com papel, convite por e-mail (`POST /api/terreiros/:id/convites`), remoção de membro (só `dirigente`).
- Toggle "repertório oficial da casa" — quando ativo, o `RemoteRepository` desse usuário passa a apontar para o acervo do `terreiroId` em vez do acervo pessoal (mesmo mecanismo de repositório da seção 3, só troca o parâmetro de escopo/tenant nas chamadas). Isso é o motivo de o `DataRepository` da seção 3 já não assumir "um usuário = um acervo" implicitamente — o escopo (pessoal vs terreiro) deve ser um parâmetro explícito passado pro repositório, não codificado.
- Papel `medium` vê o repertório do terreiro em modo leitura (mutações desabilitadas na UI — botões de editar/excluir ocultos condicionados a `papel !== "dirigente" && papel !== "oga"`), reforçado no backend.

## 11. Compartilhar ponto / coleção

Dois níveis, cada um shippable independentemente:

**Nível 0 (sem backend, hoje)**: `ModalCompartilhar.tsx` para um único ponto gera um link tipo `/compartilhado?p=<base64 do {titulo,letra}>` — funciona sem nenhuma infra nova, útil para compartilhar uma letra pontual via WhatsApp (canal de aquisição mais provável desse público, conforme a pesquisa de mercado). Rota pública `src/pages/Compartilhado.tsx` decodifica e mostra somente leitura, com CTA "Organize seus pontos também" → `/`. Limitação clara: não escala para coleções grandes (limite de tamanho de URL), e não é um "link estável" (se o autor editar a letra depois, o link antigo não atualiza).

**Nível 1 (com backend, quando `colecoes`/tokens existirem)**: `POST /api/pontos/:id/compartilhar` e `POST /api/colecoes/:id/compartilhar` devolvem um token curto persistido; `/compartilhado/:token` busca via React Query (`useGetCompartilhado(token)`, gerado por Orval) meta dados sempre atualizados, com configurações de expiração/revogação geridas em `Conta.tsx`. Essa é a via que suporta compartilhar **coleção** (setlist) inteira, não só ponto avulso.

## 12. Modo apresentação / karaokê (cantar na gira)

Esse é o único fluxo que **não depende de nenhuma peça de backend nova** e pode ser entregue já na v1 — é puro frontend sobre os dados que já existem hoje.

- Em `TelaSubcategorias.tsx`, adicionar seleção múltipla de pontos (reaproveita o padrão de seleção que já existe para "organizar por grupo") + botão "Apresentar" que navega para `/apresentacao` passando a lista de IDs selecionados via estado de navegação do wouter (ou querystring `?pontos=id1,id2,id3`).
- `src/pages/Apresentacao.tsx`: tela cheia (`requestFullscreen` + `screen.wakeLock` API para não deixar a tela apagar durante a gira — crítico, ninguém quer ficar tocando a tela suja de vela/água durante o ritual), fonte grande, alto contraste, navegação por swipe/tap (próximo ponto) e teclas de seta, contador "3 de 12", e opcionalmente destaque de linha estilo karaokê com scroll automático controlável (velocidade ajustável, não sincronizado a áudio — sem transcrição/beat-tracking nesta fase, complexidade desnecessária para v1).
- Sem estado de servidor: os dados já estão no `AppData` local/remoto já carregado pelo Context — a tela só consome `dados.pontos` filtrado pelos IDs da querystring. Zero dependência de rede em tempo real (importante: durante a gira, wifi/dados do salão costuma ser ruim ou inexistente — reforça o valor do offline-first).
- Persistir a seleção como "coleção" nomeada e reutilizável ("Setlist de sexta") é a extensão natural, mas **fica pro Nível 1 de compartilhamento** (seção 11) — v1 do modo apresentação é puramente efêmero/local, sem precisar de tabela `colecoes` no banco ainda.

## 13. Estados de loading / erro / sync — padrão a aplicar em todo lugar novo

Como o app hoje nunca teve estado assíncrono, definir 3 padrões reutilizáveis (novos componentes em `src/components/estado/`):

- **`<CarregandoTela />`**: skeleton de tela cheia, só usado em rotas 100% servidor (`Conta`, `Terreiro`, `Planos`) na primeira carga sem cache.
- **`<IndicadorSync />`**: badge discreto (ex. no header) — "Sincronizado" / "Sincronizando…" / "Offline, alterações pendentes" — para o `AppProvider` quando `sincronizando = true` ou quando `navigator.onLine === false`. Nunca bloqueia a tela — o usuário continua editando localmente mesmo sem rede (fila de mutações otimistas da seção 4, retry automático quando `online` voltar via listener de `window.addEventListener('online', ...)`).
- **Erros de mutação**: toast (`sonner`) não-bloqueante + rollback silencioso do optimistic update, nunca um modal de erro que trava a tela — coerente com o app atual, que nunca falha (é só localStorage).
- Erros de rota/dado ausente: reaproveitar `src/pages/not-found.tsx` (já existe, 21 linhas) para 404 de app; criar variante para "link de compartilhamento expirado/inválido" na página `Compartilhado.tsx`.

## 14. Tabela — arquivos existentes que mudam

| Arquivo | Mudança |
|---|---|
| `src/App.tsx` | Passa a montar `QueryClientProvider` + `AuthProvider` + `Router` (wouter) com rotas reais, substituindo o `useState<Orixa\|null>` local. |
| `src/context.tsx` | Mutações passam a chamar `repository.*` (async, otimistas) em vez de `salvarDados` direto; `AppContextType` ganha `carregando`, `erro`, `sincronizando`; carga inicial vira stale-while-revalidate. Nomes de função existentes são preservados. |
| `src/storage.ts` | Divide em `src/data/seed.ts` (dados hardcoded) + `src/repository/local.ts` (persistência) + `src/repository/types.ts`. Arquivo original vira um re-export fino por 1-2 releases, depois é removido. `gerarId()` troca para `crypto.randomUUID()`. |
| `src/types.ts` | Ganha `Usuario`, `Terreiro`, `Membro`, `Colecao`; `AppData`/`Ponto`/`Subcategoria`/`Orixa` ganham campos opcionais de sync (`personalizado?`, e futuramente `updatedAt`, `deletedAt`) preparando a migração descrita na outra seção do blueprint (dados/migração). |
| `src/pages/TelaOrixas.tsx` | `onSelectOrixa` passa a navegar (`navigate(`/orixa/${id}`)`) em vez de `setState` local; ganha link para `/conta`/`/planos` no header (estado "logado" vs "convidado"). |
| `src/pages/TelaSubcategorias.tsx` | Recebe `orixaId` via `useParams()` do wouter em vez de prop `orixa`; ganha seleção múltipla + botão "Apresentar" (seção 12) e botão "Compartilhar" por ponto (via `CardPonto`). |
| `src/components/CardPonto.tsx` | Ganha ação "Compartilhar" (abre `ModalCompartilhar`) ao lado de editar/excluir/mover. |
| `src/components/ModalReorganizar.tsx` | Hoje é código morto (nunca importado) — **remover** nesta refatoração em vez de carregar dívida técnica para o produto novo, já que a mesma lógica está reimplementada inline em `TelaSubcategorias.tsx`. |
| `src/main.tsx` | Provavelmente inalterado (o `QueryClientProvider` fica dentro de `App.tsx`), mas é onde `setBaseUrl`/`setAuthTokenGetter` do `custom-fetch.ts` podem ser chamados uma vez no boot, antes do `createRoot`. |

### Arquivos novos

```
src/state/auth-context.tsx
src/repository/{types,local,remote,index}.ts
src/data/seed.ts
src/lib/query-client.ts
src/pages/{Login,Cadastro,Conta,Planos,Terreiro,Apresentacao,Compartilhado}.tsx
src/components/{RotaProtegida,PaywallGate,ModalCompartilhar,IndicadorSync,CarregandoTela}.tsx
src/hooks/use-plano.ts
```

## 15. Roadmap incremental (nenhuma etapa quebra o app em produção)

1. **Fase 1 — Fundação sem backend novo** (só frontend): introduzir wouter de verdade (`App.tsx`, rotas `/` e `/orixa/:id`), extrair `DataRepository`/`LocalRepository` de `storage.ts` mantendo comportamento idêntico, trocar `gerarId()` por `crypto.randomUUID()`, remover `ModalReorganizar.tsx` morto, adicionar modo apresentação (seção 12, zero backend) e compartilhamento Nível 0 via URL (seção 11). **Shippa valor real (modo apresentação) sem esperar nenhuma linha de backend.**
2. **Fase 2 — Auth mínima**: backend ganha `users`, `POST /auth/cadastro|login|logout`, sessão via cookie httpOnly ou JWT; frontend ganha `AuthProvider` real, telas `Login`/`Cadastro` funcionais, `RotaProtegida`, tela de decisão "continuar sem conta". Ainda sem sync remoto de pontos — só autenticação existe.
3. **Fase 3 — Migração de dados + sync remoto**: backend ganha tabelas de conteúdo (`orixas`,`subcategorias`,`pontos`, escopadas por `ownerId`) + endpoint de importação em lote; frontend implementa `RemoteRepository`, fluxo de migração (seção 7), `IndicadorSync`. Usuário logado passa a ter dados na nuvem; anônimo continua 100% local sem regressão.
4. **Fase 4 — Terreiro/membros**: backend ganha `terreiros`/`memberships`; frontend ganha `Terreiro.tsx`, papéis, escopo de repositório configurável (pessoal vs terreiro).
5. **Fase 5 — Planos/paywall real**: Stripe Checkout, `usuario.plano` vindo do backend, `PaywallGate` aplicado nos pontos definidos na seção 9, `Planos.tsx`.
6. **Fase 6 — Compartilhamento Nível 1**: tokens persistidos, coleções nomeadas/compartilháveis, página `Compartilhado.tsx` via React Query.

Cada fase é um PR (ou conjunto pequeno de PRs) independentemente deployável no Vercel atual — nenhuma exige derrubar o app existente, e um usuário que nunca cria conta não percebe diferença de comportamento em nenhuma fase.


**Decisões desta frente:**

- **Introduzir wouter de verdade já na Fase 1, antes de qualquer backend de auth** → Trocar o useState local em App.tsx por rotas wouter (/ e /orixa/:id) imediatamente, mesmo sem login existir ainda
  - _Racional:_ Toda feature nova (auth-gating, paywall, deep link de compartilhamento, /apresentacao) depende de haver URL real; wouter já está instalado e não usado, então o custo é baixo e destrava tudo depois.
- **Preservar a superfície pública de useApp() ao refatorar context.tsx** → Manter os mesmos nomes de função (adicionarPonto, toggleFavorito, reordenarPontos...) mesmo que por dentro passem a ser async/otimistas
  - _Racional:_ Evita reescrever TelaOrixas, TelaSubcategorias, CardPonto e os 5 modais; o risco fica isolado dentro do Provider, que é testável em isolamento.
- **Repositório com CRUD granular por entidade, não blob único** → DataRepository.pontos.criar/atualizar/excluir em vez de salvar(AppData) inteiro
  - _Racional:_ O backend real vai expor endpoints por entidade via OpenAPI/Orval; desenhar o contrato do frontend já granular evita reescrever tudo quando RemoteRepository for implementado — LocalRepository de hoje só precisa simular a mesma forma.
- **Modo apresentação/karaokê entregável na Fase 1, sem esperar backend** → Construir como feature 100% local (consome dados.pontos já carregado, seleção efêmera via querystring)
  - _Racional:_ É a feature de maior valor percebido na gira (uso real do produto) e não tem nenhuma dependência de servidor — ótimo primeiro incremento visível de 'virar produto' sem esperar auth/paywall.
- **Compartilhamento em dois níveis (URL-encoded sem backend, depois token persistido com backend)** → Nível 0 (base64 na URL) primeiro, Nível 1 (tokens via API) só quando colecoes/tokens existirem no banco
  - _Racional:_ Permite entregar 'compartilhar ponto' no WhatsApp (canal de aquisição mais provável, segundo a pesquisa de mercado) sem esperar nenhuma tabela nova; a limitação de tamanho de URL é aceitável para ponto avulso.
- **Gating de plano é só UX no cliente; a garantia real é sempre no backend** → usePlano()/PaywallGate controlam apenas o que a UI mostra/permite clicar; todo endpoint sensível reforça o limite de plano no servidor
  - _Racional:_ Client-side gating é trivialmente contornável (DevTools); tratar como UX evita a falsa sensação de segurança e deixa claro no design que o backend é a fonte de verdade de autorização.
- **'Continuar sem conta' permanece o caminho padrão e de menor fricção, não uma opção escondida** → Tela de decisão inicial oferece Entrar/Criar conta/Continuar sem conta lado a lado, sem dark pattern; escolha 'anônimo' é lembrada e não repete o prompt
  - _Racional:_ A base de usuários atual já confia no app funcionar 100% offline; forçar conta mataria a adoção existente e soa mal dado o risco de 'mercantilização de algo sagrado' levantado na pesquisa de domínio.

**Questões abertas:** (O acervo 'oficial do terreiro' (Fase 4) deve ser um fork editável independente do acervo pessoal de cada membro, ou uma view compartilhada em tempo real onde qualquer edição do dirigente aparece para todos imediatamente? Isso muda o desenho do escopo no DataRepository.); (Quando o usuário sem conta finalmente cria uma, e o backend detecta que boa parte dos ~248 pontos seed são idênticos ao catálogo padrão, o produto deve silenciosamente deduplicar (mapear para o catálogo global) ou sempre criar cópia pessoal editável? Afeta diretamente o fluxo de migração da seção 7 e o UX de 'edições meus vs. do catálogo'.); (O modo apresentação/karaokê deve, em versão futura, sincronizar entre dispositivos (ex.: ogã no tablet segue o que o dirigente está mostrando no celular)? Isso mudaria de feature puramente local para algo com estado remoto em tempo real (WebSocket/polling), impacto grande de arquitetura.); (Planos: o preço e os limites exatos por tier (grátis/premium/terreiro) — a tabela de LIMITES proposta na seção 9 é um placeholder de arquitetura, não uma proposta de pricing.); (Convite de membro do terreiro deve exigir que o convidado já tenha conta, ou pode gerar um link de convite que cria a conta no mesmo fluxo (reduzindo fricção para ogãs menos digitais)?); (Vale a pena investir em app nativo (ou wrapper) mais adiante dado que o PWA já existe, considerando o cenário de uso em salão de terreiro com conectividade ruim — Wake Lock e fullscreen do modo apresentação funcionam de forma confiável em todos os navegadores mobile alvo?)

---

### 7.x Dev Container — Umbanda Ponto Organizer

## Dev Container — infra local 100% dentro do container

Requisito atendido: **nenhuma ferramenta precisa ser instalada no host** (nem Node, nem pnpm, nem Postgres). Tudo roda dentro do dev container via Docker Compose. Arquivos criados no repo:

```
.devcontainer/
├── devcontainer.json
├── docker-compose.yml
└── Dockerfile
.env.example        (novo, raiz do repo)
```

### Como abrir e rodar (uso diário)

**Pré-requisitos no host**: apenas Docker Desktop (ou Docker Engine) e VS Code com a extensão *Dev Containers* (`ms-vscode-remote.remote-containers`). Nada de Node/pnpm/Postgres local.

1. Abra a pasta do repo no VS Code.
2. `Cmd+Shift+P` → **"Dev Containers: Reopen in Container"**.
3. Primeira vez: o VS Code builda a imagem (`Dockerfile`), sobe `app` + `db` via `docker-compose.yml`, e roda automaticamente `postCreateCommand` (`pnpm install` + `pnpm --filter @workspace/db run push`). Acompanhe o log na aba "Dev Containers".
4. Terminal integrado do VS Code já abre **dentro** do container, como usuário `node`, em `/workspace` (bind mount do repo).
5. Rodar o frontend: `pnpm --filter @workspace/pontos-umbanda dev` → abre em `http://localhost:3000` (porta já forwardada para o host).
6. Rodar o backend: `pnpm --filter @workspace/api-server dev` → `http://localhost:3001`.
7. Conectar direto no Postgres do host (se quiser um client externo tipo TablePlus/DBeaver): `postgresql://umbanda:umbanda@localhost:5432/umbanda` (porta 5432 também forwardada).

**Sem VS Code** (CLI, CI local, outro editor): com o [`@devcontainers/cli`](https://github.com/devcontainers/cli) instalado no host:
```bash
devcontainer up --workspace-folder .
devcontainer exec --workspace-folder . pnpm --filter @workspace/pontos-umbanda dev
```
Ou, mais cru, direto no Docker Compose:
```bash
docker compose -f .devcontainer/docker-compose.yml up -d
docker compose -f .devcontainer/docker-compose.yml exec app bash
# dentro do container:
pnpm install && pnpm --filter @workspace/db run push
```

**Ferramentas opcionais de banco (Adminer/pgweb)** — não sobem por padrão para não gastar recursos à toa:
```bash
docker compose -f .devcontainer/docker-compose.yml --profile tools up -d adminer pgweb
# Adminer:  http://localhost:8080  (sistema=PostgreSQL, servidor=db, user/senha/db=umbanda)
# pgweb:    http://localhost:8081
```

**Rodar as tabelas manualmente** (o `postStartCommand` já faz isso a cada start, mas útil após editar o schema):
```bash
pnpm --filter @workspace/db run push          # aplica o schema no Postgres
pnpm --filter @workspace/db run push-force     # idem, forçando (perde dados divergentes)
```

**Seed de dados** — comando previsto, mas o script em si depende do schema Drizzle (`lib/db/src/schema/index.ts`), que hoje está **vazio** (placeholder, ver bloco de dados/migração do time). Convenção sugerida para quando as tabelas existirem:
```bash
pnpm --filter @workspace/db run seed
```
Isso exige adicionar em `lib/db/package.json`:
```json
"scripts": {
  "seed": "tsx src/seed.ts"
}
```
e um `lib/db/src/seed.ts` que leia `pontos-completo.json`/`storage.ts` (fonte reconciliada, ver achados do time de dados) e faça upsert no catálogo. Isso é entregável de outra frente do blueprint (modelagem de dados) — aqui deixo o *hook* de infra pronto (`postCreateCommand`/`postStartCommand` já citam o padrão `pnpm --filter @workspace/db run push`; adicionar `&& pnpm --filter @workspace/db run seed` no `postCreateCommand` assim que o script existir é uma linha).

---

### `.devcontainer/devcontainer.json`

```jsonc
// .devcontainer/devcontainer.json
//
// Requisito firme do dono do produto: TODA a infra local roda e é instalada
// dentro deste dev container. Não instale Node/pnpm/Postgres no host — abra
// o repo no VS Code e use "Reopen in Container" (ou o CLI @devcontainers/cli).
{
  "name": "Umbanda Ponto Organizer",

  // Usa o docker-compose ao lado (app + Postgres + ferramentas opcionais).
  "dockerComposeFile": "docker-compose.yml",
  "service": "app",
  "workspaceFolder": "/workspace",

  // Ao fechar o VS Code, derruba os containers do compose (o volume do
  // Postgres persiste mesmo assim — só o container para).
  "shutdownAction": "stopCompose",

  "remoteUser": "node",

  // Portas do monorepo: 3000 = vite (frontend), 3001 = api-server (Express),
  // 5432 = Postgres. 8080/8081 = Adminer/pgweb (só sobem com --profile tools).
  "forwardPorts": [3000, 3001, 5432, 8080, 8081],
  "portsAttributes": {
    "3000": {
      "label": "Frontend (Vite - pontos-umbanda)",
      "onAutoForward": "notify"
    },
    "3001": {
      "label": "API server (Express)",
      "onAutoForward": "silent"
    },
    "5432": {
      "label": "PostgreSQL",
      "onAutoForward": "silent"
    },
    "8080": {
      "label": "Adminer (opcional)",
      "onAutoForward": "ignore"
    },
    "8081": {
      "label": "pgweb (opcional)",
      "onAutoForward": "ignore"
    }
  },

  // DATABASE_URL já resolvida para o serviço "db" do compose — nenhum .env
  // manual é necessário para rodar Drizzle push/seed dentro do container.
  "containerEnv": {
    "DATABASE_URL": "postgresql://umbanda:umbanda@db:5432/umbanda",
    "PORT": "3001"
  },

  // Roda uma única vez, na criação do container:
  //   1) instala TODAS as deps do monorepo (respeita pnpm-workspace.yaml,
  //      catalog, minimumReleaseAge e os overrides de esbuild linux-x64
  //      — que aqui dentro do container linux nem precisam de exceção)
  //   2) aplica o schema Drizzle no Postgres do compose (cria as tabelas)
  "postCreateCommand": "pnpm install && pnpm --filter @workspace/db run push",

  // Roda toda vez que o container (re)inicia (rebuild, restart da máquina, etc.):
  // reaplica o schema — idempotente, útil se o volume do pnpm-store mudou
  // mas o container foi recriado, ou se o schema.ts foi editado offline.
  "postStartCommand": "pnpm --filter @workspace/db run push",

  "customizations": {
    "vscode": {
      "extensions": [
        // Lint/format
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "editorconfig.editorconfig",
        // Tailwind 4 (autocomplete de classes, preview de cor)
        "bradlc.vscode-tailwindcss",
        // Drizzle ORM (visualização de schema)
        "rphlmr.vscode-drizzle-orm",
        // OpenAPI (lib/api-spec/openapi.yaml usado pelo pipeline Orval)
        "42crunch.vscode-openapi",
        // Postgres direto do editor
        "ms-ossdata.vscode-pgsql",
        // Qualidade de vida
        "eamodio.gitlens",
        "mikestead.dotenv",
        "christian-kohler.path-intellisense"
      ],
      "settings": {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "esbenp.prettier-vscode",
        "editor.codeActionsOnSave": {
          "source.fixAll.eslint": "explicit"
        },
        "typescript.tsdk": "node_modules/typescript/lib",
        "tailwindCSS.experimental.classRegex": [
          ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
          ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
        ],
        "files.watcherExclude": {
          "**/node_modules/**": true,
          "**/dist/**": true
        }
      }
    }
  },

  "features": {}
}
```

### `.devcontainer/docker-compose.yml`

```yaml
# .devcontainer/docker-compose.yml
#
# Orquestra TODA a infra local do projeto dentro do dev container:
#   - app     : container onde você trabalha (Node 24 + pnpm), monta o repo inteiro
#   - db      : Postgres 16 com volume persistente
#   - adminer : UI web para inspecionar o Postgres (opcional, profile "tools")
#   - pgweb   : UI web alternativa para o Postgres (opcional, profile "tools")
#
# O VS Code (via devcontainer.json) sobe este compose e anexa ao serviço "app".
# Os serviços opcionais (adminer/pgweb) só sobem se você pedir explicitamente:
#   docker compose --profile tools up -d adminer pgweb

services:
  app:
    build:
      context: ..
      dockerfile: .devcontainer/Dockerfile
    init: true
    command: sleep infinity
    volumes:
      # Bind mount do repo inteiro — editar no host (VS Code) reflete direto no container.
      - ..:/workspace:cached
      # Volume nomeado para o pnpm store: cache de pacotes sobrevive a rebuilds
      # do container e evita poluir/baguncar node_modules do host com binários linux.
      - pnpm-store:/pnpm
    environment:
      NODE_ENV: development
      # DATABASE_URL já resolvida para o serviço "db" deste compose (nome de host = "db").
      DATABASE_URL: postgresql://umbanda:umbanda@db:5432/umbanda
      # Portas padrão usadas pelos scripts dev do monorepo.
      PORT: "3001"
      VITE_PORT: "3000"
    ports:
      - "3000:3000" # frontend (pontos-umbanda / vite dev server)
      - "3001:3001" # api-server (Express)
    depends_on:
      db:
        condition: service_healthy
    networks:
      - umbanda-net

  db:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: umbanda
      POSTGRES_PASSWORD: umbanda
      POSTGRES_DB: umbanda
    volumes:
      # Volume nomeado = dados do Postgres persistem entre "docker compose down"/rebuilds.
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U umbanda -d umbanda"]
      interval: 5s
      timeout: 5s
      retries: 20
    networks:
      - umbanda-net

  # Opcional: UI web leve para inspecionar tabelas rapidamente.
  # Subir com: docker compose --profile tools up -d adminer
  adminer:
    image: adminer:latest
    restart: unless-stopped
    profiles: ["tools"]
    ports:
      - "8080:8080"
    depends_on:
      db:
        condition: service_healthy
    networks:
      - umbanda-net

  # Opcional: alternativa ao Adminer, mais focada em Postgres.
  # Subir com: docker compose --profile tools up -d pgweb
  pgweb:
    image: sosedoff/pgweb:latest
    restart: unless-stopped
    profiles: ["tools"]
    environment:
      PGWEB_DATABASE_URL: postgresql://umbanda:umbanda@db:5432/umbanda?sslmode=disable
    ports:
      - "8081:8081"
    depends_on:
      db:
        condition: service_healthy
    networks:
      - umbanda-net

volumes:
  pgdata:
    name: umbanda-pgdata
  pnpm-store:
    name: umbanda-pnpm-store

networks:
  umbanda-net:
    name: umbanda-net
```

### `.devcontainer/Dockerfile`

```dockerfile
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

RUN corepack enable && corepack prepare pnpm@10 --activate

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
```

### `.env.example` (raiz do repo, novo)

```bash
# Copie para .env se precisar rodar algo FORA do dev container (ex: um client
# de Postgres no host). Dentro do dev container isso já vem resolvido via
# containerEnv em .devcontainer/devcontainer.json — não precisa criar este
# arquivo para o fluxo normal de "abrir no VS Code e trabalhar".
DATABASE_URL=postgresql://umbanda:umbanda@localhost:5432/umbanda

# Porta do api-server (Express) dentro do container.
PORT=3001
```

---

### Por que essas escolhas (mapeado aos requisitos)

- **Node 24 + pnpm via corepack**: `node:24-bookworm-slim` é a mesma major do `.replit` (`modules = ["nodejs-24"]`) e do `tsconfig`/engines implícitos. `corepack prepare pnpm@10 --activate` fixa uma major de pnpm estável sem hardcodar patch version, evitando drift silencioso mas continuando determinístico o bastante (pode-se travar em `pnpm@10.x.y` exato se preferir 100% reprodutível — ver "Perguntas abertas").
- **Postgres 16 com volume nomeado (`umbanda-pgdata`)**: persiste entre rebuilds do dev container (só some com `docker compose down -v` explícito), batendo com `dialect: "postgresql"` já configurado em `lib/db/drizzle.config.ts`.
- **`DATABASE_URL` já exportada**: via `containerEnv` no `devcontainer.json` (para o terminal do VS Code) **e** via `environment` no `docker-compose.yml` (para qualquer `docker compose exec`/CI local) — cobre os dois pontos de entrada. Aponta para `db:5432` (nome do serviço, resolvido pela rede interna do compose `umbanda-net`), então funciona idêntico esteja você no terminal do VS Code ou rodando `docker compose exec app ...` puro.
- **Extensões VS Code**: ESLint/Prettier (formatação — o repo já tem `prettier` como devDependency raiz), Tailwind CSS IntelliSense (Tailwind 4 usado no `pontos-umbanda`), Drizzle ORM (`rphlmr.vscode-drizzle-orm`, visualizador de schema — id de marketplace real, verificado), mais 42Crunch OpenAPI (o pipeline Orval já vive em `lib/api-spec/openapi.yaml`) e `ms-ossdata.vscode-pgsql` para consultar o Postgres sem sair do editor.
- **Portas expostas**: 3000 (`vite --host 0.0.0.0`, já configurado em `artifacts/pontos-umbanda/package.json`), 3001 (`api-server`, que hoje exige `PORT` env — setei `PORT=3001` tanto no compose quanto no `containerEnv`), 5432 (Postgres, para clients externos no host tipo TablePlus). 8080/8081 (Adminer/pgweb) ficam atrás de `profiles: ["tools"]` para não consumir RAM/CPU por padrão.
- **`postCreateCommand: "pnpm install && pnpm --filter @workspace/db run push"`**: `pnpm install` respeita 100% o `pnpm-workspace.yaml` existente (catalog, `minimumReleaseAge: 1440`, os overrides `"esbuild>@esbuild/darwin-*": "-"` etc.) — como o container **é** Linux x64, os overrides de plataforma do workspace passam a ser exatamente o ambiente real (não uma exceção "só pro Replit"), então nenhuma dependência nativa fica desalinhada. `pnpm --filter @workspace/db run push` usa o script que já existe em `lib/db/package.json` (`drizzle-kit push`) para criar as tabelas assim que alguém popular `lib/db/src/schema/index.ts` (hoje vazio — ver achados do time de dados).
- **`postStartCommand`** roda o mesmo `push` a cada (re)start do container — idempotente e barato (drizzle-kit push só aplica diffs), útil quando o `schema/index.ts` muda entre sessões.
- **Bind mount do repo inteiro + volume separado para pnpm store**: editar no host reflete instantaneamente no container (sem sync manual); o pnpm store fica num volume Docker nomeado (`umbanda-pnpm-store`) para cache de pacotes sobreviver a rebuilds da imagem sem escrever binários Linux dentro do `node_modules` bind-mountado do jeito que atrapalharia um dia rodar algo fora do container (embora isso não seja um objetivo aqui, é mais limpo).
- **Usuário não-root (`node`, uid 1000)**: evita todo o histórico de dor de arquivos criados como root dentro de bind mounts Docker Desktop no macOS.

### Decisões que já tomei (para não travar o dono em detalhe de infra)

Ver array `decisions` abaixo para o resumo tabulado; a leitura em prosa está acima.

### Perguntas abertas (só o dono decide)


**Decisões desta frente:**

- **Base de imagem: node:24-bookworm-slim (não a imagem oficial mcr.microsoft.com/devcontainers/*) com Dockerfile próprio.** → Manter Dockerfile fino e explícito em vez da imagem devcontainers oficial.
  - _Racional:_ Dá controle total sobre o que entra na imagem (alinhado ao pnpm-workspace.yaml que já é bem defensivo com supply-chain) e evita depender de uma imagem de terceiros que muda de conteúdo entre tags. O custo é manter manualmente os poucos apt packages (git, psql client) — aceitável para um time pequeno.
- **pnpm fixado só na major (corepack prepare pnpm@10) e não em uma versão exata (ex. pnpm@10.4.1).** → Se o time quiser reprodutibilidade byte-a-byte entre máquinas, trocar para uma versão exata e revisitar a cada poucos meses.
  - _Racional:_ Não há packageManager pinado hoje em nenhum package.json do repo; fixar só a major dá margem para patches de segurança do próprio pnpm sem exigir edição manual do Dockerfile a cada bump, mas abre uma janela pequena de não-determinismo entre 'quem builda hoje' vs 'quem builda daqui a 3 meses'.
- **Postgres 16 com usuário/senha/db fixos e triviais (umbanda/umbanda/umbanda), sem segredo real.** → Manter assim — são credenciais de um Postgres que só existe dentro da rede interna do compose, nunca exposto além do localhost do dev.
  - _Racional:_ Não há necessidade de gerenciar secrets para ambiente de desenvolvimento local isolado; simplicidade > segurança teatral aqui. Produção usará outro Postgres gerenciado com credenciais reais via secret manager (fora do escopo deste arquivo).
- **Adminer e pgweb ficam atrás de docker compose profile 'tools' (não sobem por padrão).** → Manter opcional — subir só quando for depurar dados manualmente.
  - _Racional:_ Requisito do dono foi 'opcional'; por padrão eles consomem RAM/CPU e portas sem necessidade no dia a dia de quem só está codando features.
- **Comando de seed (pnpm --filter @workspace/db run seed) documentado mas o script lib/db/src/seed.ts não foi criado neste artefato.** → Criar o script de seed junto com a primeira migration real (bloco de modelagem de dados do blueprint), reaproveitando pontos-completo.json como fonte após a reconciliação com o seed de storage.ts já identificada pelo time.
  - _Racional:_ lib/db/src/schema/index.ts está vazio hoje — não há tabela nenhuma para popular. Escrever um seed.ts contra um schema inexistente seria código morto até a modelagem de dados (users/orixas/pontos/user_ponto_state) ser definida; a infra do dev container já deixa o hook (postCreateCommand) pronto para incluir '&& pnpm --filter @workspace/db run seed' assim que o script existir.

**Questões abertas:** (Adminer/pgweb devem subir por padrão junto com o dev container (sempre disponíveis em background) ou continuar opt-in via --profile tools como entreguei?); (Quer que eu já pin a versão exata do pnpm (ex. pnpm@10.x.y) para reprodutibilidade total, ou a major sozinha (pnpm@10) é aceitável no dia a dia?); (O api-server hoje lança erro se DATABASE_URL não existir mesmo sem nenhuma tabela definida — quando o schema real for criado, o postCreateCommand deve rodar seed automaticamente (dado de exemplo pronto ao abrir o container) ou isso deve ser um comando manual que o dev roda quando quiser (evitando popular acidentalmente um banco que já tem dados reais em algum cenário futuro)?)

---

## 8. Time de agentes (tiering de modelos)

Implementado em `.claude/agents/`. Tarefas simples → modelos leves; problemas difíceis → Opus.

| Papel | Modelo | Quando |
|---|---|---|
| Tech-Lead / Roteador (orquestrador do time de agentes) | **Opus 4.8** | Recebe cada tarefa/PR, decide qual agente e qual modelo executa (tiering), quebra features grandes em subtarefas, faz a revisão crítica final e toma decisões arquiteturais quando duas frentes conflitam. É o guardião da coerência do plano. |
| Arquiteto de Dados & Migrações | **Opus 4.8** | Schema Drizzle, migrations, RLS, estratégia de sync/offline, copy-on-write e dedup por hash, índice fracionário, seed canônico e o import transacional idempotente — tudo que erra caro e é difícil de reverter. |
| Especialista de Segurança / Auth / Pagamento | **Opus 4.8** | Better-Auth, sessão, hashing, LGPD (dado religioso sensível), consentimento, e a integração de pagamento onde idempotência de webhook e verificação de assinatura são críticas. |
| Engenheiro Backend / API | **Sonnet 5** | Endpoints Express de tamanho médio, expansão do openapi.yaml, regeneração Orval, serviços de domínio, middlewares requireFeature, refactors localizados no api-server. |
| Engenheiro Frontend (React 19) | **Sonnet 5** | Telas e componentes de tamanho médio, wouter, React Query, refatoração do Context para async/otimista, DataRepository, paywall UI, modo apresentação. |
| DevOps / Infra | **Sonnet 5** | Dev container, Docker, Fly/Vercel/Supabase, CI/CD (GitHub Actions), variáveis de ambiente, R2. Escala para Opus quando a decisão for de topologia/custo ou migração AWS. |
| QA / Revisor de Código | **Sonnet 5** | Testes de integração de endpoints e fluxos críticos (import idempotente, webhook, gating), revisão de PR de correção e simplificação, verificação end-to-end. Revisão de segurança crítica sobe para Opus. |
| Executor Mecânico (boilerplate & docs) | **Haiku 4.5** | Tarefas simples, repetitivas e de baixo risco: renomear, scaffolding de componentes shadcn, seeds triviais, docs, .env.example, testes triviais, pequenos CRUDs a partir de um padrão já existente. |

**Tech-Lead / Roteador (orquestrador do time de agentes)** (Opus 4.8) — exemplos:
- Decidir 'esta tarefa é boilerplate → Haiku; é feature média → Sonnet; é schema/segurança → Opus'
- Resolver conflitos de design em runtime (ex.: cookie vs bearer numa rota nova)
- Aprovar/reprovar PRs com impacto arquitetural; escrever ADRs curtos das decisões

**Arquiteto de Dados & Migrações** (Opus 4.8) — exemplos:
- Escrever lib/db/src/schema com CHECK de escopo↔dono e índices parciais
- Implementar importarAppData transacional com dedup por hash e legacy_id
- Desenhar delta-pull + outbox + tombstones da Fase 3 e as políticas RLS (role app_rw)

**Especialista de Segurança / Auth / Pagamento** (Opus 4.8) — exemplos:
- Configurar lib/auth (OTP/magic-link/Google), cookie httpOnly, rate limit, account linking
- Implementar consent_log e os fluxos de export/eliminação LGPD
- Webhook Mercado Pago idempotente (raw body antes do express.json, dedupe por providerEventId) e o serviço getEntitlements

**Engenheiro Backend / API** (Sonnet 5) — exemplos:
- CRUD de pontos/subcategorias/coleções com validação Zod gerada
- Adicionar paths ao openapi.yaml e ligar hooks React Query gerados
- Endpoints de terreiro/membros e de sync (changes/mutations)

**Engenheiro Frontend (React 19)** (Sonnet 5) — exemplos:
- Refatorar context.tsx preservando a superfície de useApp() (async + optimistic + rollback)
- Telas Login/Cadastro/Conta/Planos/Terreiro/Apresentação e RotaProtegida
- Migrar store para IndexedDB + IndicadorSync na Fase 3

**DevOps / Infra** (Sonnet 5) — exemplos:
- Manter .devcontainer e o docker-compose (Postgres 16, profiles tools)
- fly.toml region=gru + Dockerfile do api-server + vercel.json proxy /api/*
- Pipeline GitHub Actions (typecheck+build+deploy) e gestão de secrets

**QA / Revisor de Código** (Sonnet 5) — exemplos:
- Testes de idempotência do import e do webhook de pagamento
- Revisar diffs em busca de regressão (ex.: gating só no frontend, RLS ausente)
- Verificar que o app anônimo não regride em nenhuma fase

**Executor Mecânico (boilerplate & docs)** (Haiku 4.5) — exemplos:
- Gerar componentes de UI repetitivos (cards, formulários) a partir de um template
- Escrever docs/README de comandos e o .env.example
- Renomear campos stripe*→provider* no schema; pequenos ajustes de tipos e imports

## 9. Custos (MVP vs escala)

| Item | Detalhe | MVP | Escala (~5k usuários) |
|---|---|---|---|
| Supabase (Postgres gerenciado, sa-east-1) | Apenas Postgres (NÃO usamos GoTrue/Auth). Free tier valida; Pro quando precisar de backups/point-in-time e mais conexões. | US$0 (Free) a US$25 (Pro) | US$25-50 |
| Fly.io (api-server Express, region gru) | Container Docker colocalizado com o banco em São Paulo (round-trip submilissegundo). shared-cpu-1x no MVP, escala horizontal depois. | US$2-5 | US$25-50 |
| Vercel (frontend estático + proxy /api/*) | Hobby cobre o MVP; Pro quando precisar de mais banda/analytics. O SPA rewrite e o PWA já funcionam. | US$0 (Hobby) | US$20 (Pro) |
| Resend (email transacional OTP/verificação/reset) | Escolhido por DX no MVP; revisar DPA/residência por LGPD. Alternativas: SES, Postmark. | US$0 (~3k emails/mês) | US$20 |
| Cloudflare R2 (áudio/PDF — só a partir da Fase 5) | Egress zero (decisivo para servir mídia a milhares). Só blobs não-PII; PII fica no Postgres sa-east-1. | US$0 (não usado ainda) | US$1-5 |
| Domínio (.app) | pontosdeumbanda.app (frontend) + api same-origin via proxy. HTTPS obrigatório. | ~US$1,5 (US$18/ano amortizado) | ~US$1,5 |
| Mercado Pago (gateway) | Sem custo fixo; taxa por transação (Pix ~0,99-1%, cartão ~4,99% + parcelas). Só incide sobre receita. | US$0 fixo (% por transação) | % sobre a receita |
| Claude API — time de agentes (custo de desenvolvimento) | O tiering de modelos É o controle de custo: Haiku para o volume mecânico, Sonnet para o grosso das features, Opus só para arquitetura/segurança/schema. Sem tiering, o custo explode. | Variável (US$20-200 conforme uso; minimizado pelo tiering) | Variável |

## 10. Riscos e mitigações

| Severidade | Risco | Mitigação |
|---|---|---|
| ALTA | Risco reputacional de cobrar num domínio religioso sensível — percepção de 'mercantilizar o sagrado' num público vítima de intolerância. | Nunca colocar paywall sobre letras (regra inegociável); cobrar só ferramenta/nuvem/coletivo; linguagem 'sustente a preservação'; teste qualitativo com lideranças respeitadas ANTES do lançamento comercial; tier social/gratuito para casas sem condição. |
| ALTA | LGPD — a mera existência de conta revela convicção religiosa (dado sensível, Art. 11-I). Consentimento genérico é insuficiente. | Dois consentimentos separados (Termos + dado religioso) registrados em consent_log com versão/timestamp/IP; minimização (só email+nome); export e eliminação (soft-delete 30 dias); revisar DPA dos operadores (Google OAuth, Resend); manter PII no Postgres sa-east-1. |
| ALTA | Quebrar a promessa 'funciona sem conta e offline' ao introduzir auth/nuvem, matando a base atual que confia no app. | 'Continuar sem conta' permanece o caminho padrão sem dark pattern; conta é 100% opt-in; nenhuma fase regride o modo anônimo; import nunca apaga localStorage automaticamente; leitura na gira sempre local. |
| ALTA | Perda/corrupção de dados na migração localStorage→conta (o momento onde o usuário mais teme perder trabalho manual). | Import numa única transação Drizzle (rollback total em falha); idempotência por legacy_id/clientMigrationId; dedup por hash; preview com contagem e confirmação explícita; localStorage intacto como fallback; edge case multi-dispositivo tratado por merge explícito. |
| MEDIA | Conflitos de sync destrutivos em multi-dispositivo (reorder reindexando lista inteira, favorito/ordem embutidos no conteúdo). | Separar estado por-usuário (user_*_state) do conteúdo; índice fracionário (LexoRank) toca uma linha por reorder; updatedAt server-authoritative + tombstones; push-primeiro-pull-depois; IDs client-side para criar offline sem remapeamento. Sync incremental só na Fase 3, com Background Sync + fallback iOS. |
| MEDIA | Feature-gating contornável se confiado ao frontend (DevTools revela tudo). | Gate autoritativo no backend (middleware requireFeature, HTTP 402) em todo endpoint pago; fonte da verdade é o nosso Postgres, alimentado só por webhook idempotente; frontend apenas espelha para UX. |
| MEDIA | Webhook de pagamento processado errado (body consumido pelo express.json, evento reentregue duplicando assinatura). | Registrar a rota de webhook com raw body ANTES do express.json global; verificar assinatura; deduplicar por providerEventId (ON CONFLICT DO NOTHING); liberar plano só pelo webhook, nunca pelo redirect de sucesso. |
| MEDIA | Time minúsculo (solo + agentes) se afogar operando muitos painéis/infra em vez de entregar produto. | PaaS de baixa operação (Vercel+Fly+Supabase, um painel a menos que AWS); dev container fecha o setup local; tiering de modelos controla custo e velocidade; roadmap faseado e shippable a cada PR. |
| MEDIA | Preços (R$9,90/R$39,90) são inferência, não validação — podem estar errados para a real disposição a pagar. | Pesquisa primária com dirigentes/ogãs em grupos de WhatsApp antes de fixar; tratar projeção de receita como cenário de sensibilidade, não previsão; mirar B2B (terreiro) como tese, B2C como funil. |
| BAIXA | Lock-in acidental que fecharia a porta AWS (RLS como única autz, Edge Functions Supabase, pg_cron para jobs). | Regra de ouro: autorização no middleware Express (RLS só defesa em profundidade), jobs via pg-boss portável, catálogo/preferências em Drizzle limpo, Better-Auth self-hosted com userId próprio. Tudo Docker+Postgres+Drizzle. |
| BAIXA | Supply-chain ao adicionar novas deps (mercadopago, idb, better-auth) sob minimumReleaseAge=1440. | Adicionar ao catalog com versão pinada respeitando a janela de 1 dia; NÃO incluir better-auth no minimumReleaseAgeExclude (é crítico de segurança); remover resíduo stripe-replit-sync do exclude. |

## 11. Decisões que só o dono pode tomar

### 11.1 Qual é a meta de negócio real: cobrir custo de infra e servir a comunidade (impacto/lifestyle) ou construir receita relevante? Isso muda quanto investir no B2B/terreiro.

- Impacto/lifestyle: manter simples, B2C leve, custo baixo
- Receita relevante: investir pesado no B2B/terreiro como produto principal
- Híbrido: B2C como funil barato + B2B como tese de receita

**Recomendação do time:** Híbrido, mirando o B2B. O terreiro carrega desproporcionalmente o valor por unidade (R$33 vs R$7) e é o único fosso competitivo real. O B2C funciona como funil de aquisição orgânica que traz os dirigentes para dentro. 100 terreiros pagantes ≈ toda a base Pro do cenário base.

### 11.2 Vamos validar preço e risco reputacional com a comunidade antes de cobrar, ou lançar com os preços inferidos?

- Lançar já com R$9,90/R$39,90 e ajustar depois
- Fazer pesquisa primária + teste qualitativo com lideranças antes de qualquer cobrança

**Recomendação do time:** Fazer a pesquisa primária com dirigentes/ogãs (grupos de WhatsApp) e um teste qualitativo com lideranças respeitadas ANTES do lançamento comercial. O custo é baixo, blinda a marca contra a acusação de mercantilização, e os preços atuais são inferência, não validação. A Fase 2 pode ser construída em paralelo à pesquisa.

### 11.3 O tier vitalício 'Apoiador' (R$249 via Pix) deve ter teto de vagas (edição 'fundadores') ou ser permanente?

- Edição limitada de fundadores (urgência + caixa antecipado)
- Vitalício permanente barato

**Recomendação do time:** Edição limitada de fundadores. Gera caixa antecipado para bancar o desenvolvimento (financiamento, não MRR) e cria urgência, sem canibalizar a recorrência a longo prazo. Vitalício permanente barato mina a assinatura.

### 11.4 Oferecer tier Terreiro gratuito/simbólico para casas comprovadamente sem condição financeira?

- Sim, com curadoria manual de elegibilidade
- Não, para proteger a receita B2B
- Sim, mas só um número simbólico de bolsas

**Recomendação do time:** Sim, com curadoria manual leve (poucas bolsas, avaliadas caso a caso). Reforça a marca como aliada da comunidade — não exploradora — que é exatamente o posicionamento que neutraliza a objeção de mercantilização. Impacto na receita é pequeno no início; o ganho reputacional é grande.

### 11.5 Como tratar os usuários atuais do app grátis local na virada para contas na nuvem?

- Migração comum, sem benefício
- Selo 'fundador' + benefício vitalício ou desconto de early adopter

**Recomendação do time:** Selo 'fundador' com benefício (ex.: Pro vitalício ou desconto forte para os primeiros N). Eles são a base de confiança e o motor do boca a boca; o goodwill vale mais que a receita marginal, e a migração deles é gratuita de qualquer forma (import reaproveita exportarDados).

### 11.6 A biblioteca canônica será curada/fechada por vocês ou aberta a contribuição da comunidade?

- Curada/fechada (conteúdo oficial, sem fila de moderação)
- Aberta com fila de moderação e status de publicação

**Recomendação do time:** Curada/fechada no início. Dada a sensibilidade entre linhas e nações (Exu/Pomba-Gira fora de contexto, variações de casa), abrir contribuição exigiria moderação que um time pequeno não sustenta. Conteúdo da comunidade fica no escopo pessoal/terreiro; promoção org→canonical com curadoria vem só se/quando houver braço para moderar.

### 11.7 Login social Apple e app nativo iOS entram no roadmap agora?

- Priorizar Apple/nativo por paridade de marca
- Adiar até existir demanda real de app nativo iOS

**Recomendação do time:** Adiar. O PWA já é instalável e offline; Apple login só é obrigatório pelas regras da App Store quando existe app nativo iOS, e a conta Apple Developer custa US$99/ano. Wake Lock/fullscreen do modo apresentação cobrem o uso na gira. Reavaliar quando houver tração e demanda concreta.

### 11.8 Provedor de email transacional: Resend, AWS SES ou Postmark?

- Resend (melhor DX, rápido de plugar)
- AWS SES sa-east-1 (residência BR, mas sandbox + aquecimento)
- Postmark (entregabilidade forte)

**Recomendação do time:** Resend no MVP pela DX (encaixe rápido no Better-Auth) e revisar DPA/residência de dados por LGPD. Como a hospedagem é Supabase/Fly (não AWS), o argumento de SES sa-east-1 enfraquece; migrar de provedor de email depois é troca de env, baixo atrito.

## 12. Próximos passos imediatos

1. Abrir o repo no Dev Container já desenhado (.devcontainer): validar pnpm install + Postgres 16 local + drizzle push rodando 100% dentro do container, sem instalar nada no host.
2. Popular lib/db/src/schema (hoje vazio, export {}) com o schema integrado: tabelas do Better-Auth (user/session/account/verification/consent_log) + domínio com escopo canonical/user/org + user_ponto_state/user_orixa_state/user_subcategoria_state + billing provider-agnóstico; rodar drizzle-kit push no Postgres local.
3. Escrever e rodar o seed canônico a partir de pontos-completo.json (384 pontos), com hash de letra normalizada para dedup; validar as 12 orixás / 42 subcategorias / 384 pontos no banco.
4. Criar o pacote lib/auth com Better-Auth (Email OTP primário + magic link + Google, cookie httpOnly + sessão no Postgres, scrypt) e montá-lo no api-server ANTES do express.json(); adicionar os dois consentimentos LGPD.
5. Implementar POST /api/account/import-local-data (transacional, idempotente, dedup por hash) e a tela de onboarding no frontend (wouter real, RotaProtegida, modal de migração com preview) — trocando gerarId() por crypto.randomUUID() e removendo ModalReorganizar.tsx morto.
6. Provisionar a infra vencedora (Supabase sa-east-1 + Fly.io gru + Resend), configurar o proxy /api/* no vercel.json (same-origin) e criar o primeiro GitHub Actions (typecheck + build + deploy); em paralelo, iniciar a pesquisa primária de preço com dirigentes/ogãs.
