> [!CAUTION]
> **ESTE TIME FOI SUPERADO. Não siga as instruções abaixo sem conferir.**
>
> Estes arquivos descrevem o scaffold original — Express (`artifacts/api-server`),
> Better-Auth, Drizzle e o pipeline OpenAPI/Orval. **Nada disso está no caminho de
> execução hoje.** A aplicação é FastAPI + SQLAlchemy + Alembic em `api/`, com auth
> própria (Argon2id, cookie `pontos_sessao`), e o `api-server` nem sobe no dev
> container.
>
> O time vivo é o da raiz: `../../.claude/agents/` (o `CLAUDE.md` do guarda-chuva
> aponta para lá). Comece pelo `tech-lead` de lá.
>
> Conferido em 28/08/2026: uma varredura da documentação contra o código achou 86
> afirmações falsas, e ~30 estavam nestes nove arquivos — rotas que respondem 404,
> "não há testes" onde há 403, e ordens para usar pacotes já removidos.

# Time de agentes — Umbanda Ponto Organizer

Time de alta performance com **tiering de modelos**: tarefas simples usam modelos leves (baratos/rápidos), problemas difíceis usam o modelo mais capaz. O tiering **é** o principal controle de custo de desenvolvimento.

| Agente | Modelo | Pega |
|---|---|---|
| `tech-lead` | **Opus 4.8** | Orquestra, roteia trabalho, resolve conflitos, revisão crítica final |
| `arquiteto-dados` | **Opus 4.8** | Schema Drizzle, migrations, RLS, sync offline, import/seed |
| `seguranca-auth` | **Opus 4.8** | Better-Auth, sessão, LGPD, pagamento/webhook |
| `backend-api` | **Sonnet 5** | Endpoints Express, OpenAPI/Orval, serviços de domínio |
| `frontend-react` | **Sonnet 5** | Telas/componentes React 19, wouter, React Query, paywall UI |
| `devops-infra` | **Sonnet 5** | Dev container, Docker, Fly/Vercel/Supabase, CI/CD |
| `qa-revisor` | **Sonnet 5** | Testes de integração, revisão de PR, regressão do app anônimo |
| `executor-mecanico` | **Haiku 4.5** | Boilerplate, docs, renomeações, seeds triviais |

## Como usar
- Deixe o **`tech-lead`** decidir o tiering: descreva a tarefa a ele e ele roteia para o agente/modelo certo, ou invoque um especialista direto quando já souber.
- Regra de ouro do tiering: **reversível e mecânico → Haiku; feature média num padrão existente → Sonnet; erra caro / dado / segurança / dinheiro / sync → Opus.**

## Princípios do produto (todo agente respeita)
1. App funciona **sem conta e offline** — conta é opt-in, nenhuma fase regride o modo anônimo.
2. **Nenhuma letra atrás de paywall** — cobra-se a ferramenta, nunca o conteúdo religioso.
3. **Sem lock-in** — Docker + Postgres + Drizzle; AWS por gatilho, não padrão.
4. **LGPD** — conta revela dado religioso sensível: consentimento duplo, minimização, export/eliminação.

Plano completo: [`docs/blueprint-produto.md`](../../docs/blueprint-produto.md).
