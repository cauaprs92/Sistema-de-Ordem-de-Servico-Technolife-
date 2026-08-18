# 01 — Arquitetura

## 1. Stack escolhida

| Camada | Tecnologia | Motivo |
|---|---|---|
| Linguagem | **TypeScript 5.x** (strict) | Tipagem end-to-end, exigência do projeto |
| Runtime | **Node.js 22 LTS** | Suporte de longo prazo |
| Framework HTTP | **Fastify 5** | Rápido, validação nativa via JSON Schema, plugins tipados |
| ORM | **Prisma 6** | Migrations versionadas, tipos gerados do schema, ótimo DX |
| Banco | **PostgreSQL 16** | Transações fortes, `numeric` exato para dinheiro, JSONB para payloads fiscais |
| Validação | **Zod** | Schemas de entrada compartilhados entre API e front |
| Auth | **JWT** (access + refresh) + Argon2 | Simples, stateless, sem dependência externa |
| Frontend | **Next.js 15 (App Router) + React 19** | SSR para telas de consulta, forms com React Hook Form |
| UI | **Tailwind CSS + shadcn/ui** | Velocidade de construção, componentes acessíveis |
| Estado/dados | **TanStack Query** | Cache, invalidação, otimista |
| Testes | **Vitest** + **Supertest** + **Playwright** | Unidade, integração de API, E2E |
| Jobs/filas | **BullMQ + Redis** (a partir da Fase 2) | Emissão de NF, e-mails, relatórios pesados |
| Docs de API | **OpenAPI 3.1** gerado do Zod | Contrato vivo, cliente tipado para o front |
| Monorepo | **pnpm workspaces + Turborepo** | Compartilhar tipos e schemas entre API e web |
| Container | **Docker + docker-compose** | Postgres/Redis locais e deploy previsível |

> **Dinheiro nunca em `float`.** No Postgres, `NUMERIC(14,2)`; no TypeScript, inteiro de
> centavos ou `Prisma.Decimal`. Regra obrigatória — ver doc 11.

## 2. Decisões de arquitetura (ADRs resumidos)

**ADR-001 — Monolito modular, não microsserviços.**
Uma equipe pequena e cinco módulos fortemente acoplados por transação (OS baixa estoque
e gera título no mesmo commit). Microsserviços aqui só adicionariam consistência eventual
onde precisamos de ACID. Os módulos são separados por pastas e por fronteiras de serviço,
o que permite extrair um serviço no futuro se necessário.

**ADR-002 — Camadas: Route → Service → Repository.**
A rota só faz HTTP (validar, autorizar, serializar). O *service* concentra a regra de
negócio e é o único que abre transação. O *repository* fala com o Prisma. Regra de negócio
em rota ou em componente React é bug de arquitetura.

**ADR-003 — Estoque e Financeiro são livros-razão (ledgers), não campos mutáveis.**
`produto.saldo` é um valor derivado e conferível; a verdade são os registros de
`movimento_estoque`. Idem para o caixa: a verdade são as baixas. Correções são feitas com
lançamento de ajuste, nunca com `UPDATE` no saldo. Isso dá auditoria de graça.

**ADR-004 — Documentos fiscais e financeiros não são deletados.**
OS, NF e títulos usam cancelamento/estorno com motivo e autor. `DELETE` físico só existe
para cadastros nunca utilizados.

**ADR-005 — Camada fiscal atrás de uma interface.**
Como o provedor de emissão está indefinido (P1), toda a aplicação conversa com
`FiscalProvider` (interface). Implementações: `MockFiscalProvider` (dev/MVP),
`FocusNfeProvider`, `PlugNotasProvider`, `SefazDiretoProvider` (futuro). Nenhum módulo
importa SDK de provedor diretamente.

**ADR-006 — Eventos de domínio internos.**
`OrdemServicoFinalizada`, `NotaFiscalAutorizada`, `TituloBaixado` são publicados em um
event bus em memória. Efeitos colaterais não-críticos (e-mail, webhook, recálculo de
relatório) assinam esses eventos. Efeitos críticos (baixa de estoque, criação de título)
continuam dentro da transação, não via evento.

## 3. Estrutura do monorepo

```
technoloife/
├─ apps/
│  ├─ api/                        # Fastify + Prisma
│  │  ├─ prisma/
│  │  │  ├─ schema.prisma
│  │  │  ├─ migrations/
│  │  │  └─ seed.ts
│  │  ├─ src/
│  │  │  ├─ main.ts               # bootstrap do servidor
│  │  │  ├─ app.ts                # registro de plugins e rotas
│  │  │  ├─ config/               # env (validado com Zod), constantes
│  │  │  ├─ infra/
│  │  │  │  ├─ db/prisma.ts
│  │  │  │  ├─ auth/              # jwt, hash, guards
│  │  │  │  ├─ events/            # event bus
│  │  │  │  ├─ storage/           # PDFs, XMLs, anexos
│  │  │  │  └─ fiscal/            # FiscalProvider + implementações
│  │  │  ├─ modules/
│  │  │  │  ├─ clientes/          # routes.ts | service.ts | repository.ts | schemas.ts | *.spec.ts
│  │  │  │  ├─ estoque/
│  │  │  │  ├─ ordens-servico/
│  │  │  │  ├─ notas-fiscais/
│  │  │  │  ├─ financeiro/
│  │  │  │  ├─ usuarios/
│  │  │  │  └─ relatorios/
│  │  │  └─ shared/               # erros, paginação, money, datas, auditoria
│  │  └─ test/
│  └─ web/                        # Next.js 15
│     └─ src/
│        ├─ app/(auth)/login/
│        ├─ app/(app)/dashboard | clientes | estoque | ordens-servico | notas | financeiro
│        ├─ components/           # ui/ + domínio
│        ├─ lib/                  # api client, auth, formatters
│        └─ hooks/
├─ packages/
│  ├─ contracts/                  # schemas Zod + tipos compartilhados API↔web
│  ├─ shared/                     # utilitários puros (money, cpf/cnpj, datas)
│  └─ config/                     # eslint, tsconfig, prettier compartilhados
├─ docs/
├─ docker-compose.yml
├─ turbo.json
└─ pnpm-workspace.yaml
```

## 4. Anatomia de um módulo

Cada módulo em `apps/api/src/modules/<modulo>/` tem sempre os mesmos arquivos:

| Arquivo | Responsabilidade |
|---|---|
| `schemas.ts` | Zod: body, params, query, response. Reexportado de `packages/contracts` |
| `routes.ts` | Registro Fastify: método, path, auth, permissão, schema, chamada ao service |
| `service.ts` | Regra de negócio, orquestração, transações, publicação de eventos |
| `repository.ts` | Acesso ao Prisma. Sem regra de negócio |
| `mappers.ts` | Entidade do banco → DTO de resposta |
| `*.spec.ts` | Testes de unidade do service e de integração da rota |

## 5. Fluxo de uma requisição

```
HTTP → Fastify
  ├─ plugin: requestId + logger (pino)
  ├─ plugin: authenticate  → valida JWT, injeta req.user
  ├─ plugin: authorize     → checa permissão da rota (doc 09)
  ├─ schema: valida body/query com Zod → 422 se inválido
  ├─ route handler → service
  │     └─ service (transação Prisma quando escreve)
  │           ├─ regras de negócio + invariantes
  │           ├─ repository (leitura/escrita)
  │           ├─ registro de auditoria
  │           └─ publica evento de domínio (pós-commit)
  ├─ mapper → DTO
  └─ errorHandler → envelope de erro padronizado (doc 08)
```

## 6. Ambientes

| Ambiente | Banco | Provedor fiscal | Objetivo |
|---|---|---|---|
| `local` | Postgres em Docker | `MockFiscalProvider` | Desenvolvimento |
| `test` | Postgres efêmero (Testcontainers) | Mock | CI |
| `staging` | Postgres gerenciado | Homologação do provedor | Validação com o cliente |
| `production` | Postgres gerenciado + backup diário | Produção | Uso real |

## 7. Requisitos não-funcionais

| Requisito | Alvo |
|---|---|
| Latência de leitura (p95) | < 300 ms |
| Latência de escrita (p95) | < 800 ms |
| Disponibilidade | 99,5% em horário comercial |
| Backup | Diário, retenção 30 dias, restauração testada mensalmente |
| Retenção de dados fiscais | 5 anos (XML + PDF imutáveis) |
| Logs | Estruturados (JSON), com `requestId`, retenção 30 dias |
| LGPD | Dados pessoais de clientes com base legal de execução de contrato; export e anonimização previstos na Fase 4 |
