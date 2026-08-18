# Technoloife — Sistema de Gestão

Sistema web de gestão para a **Technoloife**, cobrindo cinco módulos integrados:
Clientes, Estoque, Ordem de Serviço, Notas Fiscais e Financeiro.

Stack: **Node.js + TypeScript** (API REST com Fastify) · **PostgreSQL + Prisma** ·
**Next.js/React** (web) · monorepo pnpm + Turborepo.

> Este repositório está no estado de **Sprint 0** (fundação): o esqueleto do monorepo,
> a API com `/health`, o schema do banco e a tela de login estática já existem. As regras
> de negócio de cada módulo entram a partir da Sprint 1 — veja [docs/10-plano-de-execucao.md](docs/10-plano-de-execucao.md).

## Documentação

| # | Documento | Conteúdo |
|---|-----------|----------|
| 00 | [Visão Geral](docs/00-visao-geral.md) | Problema, escopo, glossário, personas, MVP |
| 01 | [Arquitetura](docs/01-arquitetura.md) | Stack, decisões técnicas (ADRs), camadas, estrutura de pastas |
| 02 | [Modelo de Dados](docs/02-modelo-de-dados.md) | ERD, entidades, relacionamentos, integridade |
| 03 | [Módulo Clientes](docs/03-modulo-clientes.md) | Cadastro, PF/PJ, endereços, contatos, equipamentos |
| 04 | [Módulo Estoque](docs/04-modulo-estoque.md) | Produtos, movimentações, custo médio, reserva |
| 05 | [Módulo Ordem de Serviço](docs/05-modulo-ordem-servico.md) | Ciclo de vida da OS, itens, apontamentos, aprovação |
| 06 | [Módulo Notas Fiscais](docs/06-modulo-notas-fiscais.md) | Abstração de emissão, NF-e/NFS-e, estados fiscais |
| 07 | [Módulo Financeiro](docs/07-modulo-financeiro.md) | Contas a pagar/receber, baixas, fluxo de caixa, DRE simples |
| 08 | [API REST](docs/08-api-rest.md) | Contrato, convenções, endpoints, erros, paginação |
| 09 | [Segurança e Permissões](docs/09-seguranca-e-permissoes.md) | Auth JWT, papéis, matriz de permissões, auditoria |
| 10 | [Plano de Execução](docs/10-plano-de-execucao.md) | Roadmap, sprints, entregáveis, critérios de aceite |
| 11 | [Padrões e Convenções](docs/11-padroes-e-convencoes.md) | Código, Git, testes, CI/CD, ambientes |

## Estrutura do monorepo

```
Sis-Technolife/
├─ apps/
│  ├─ api/          # Fastify + Prisma
│  └─ web/           # Next.js 15
├─ packages/
│  ├─ contracts/     # Schemas Zod compartilhados API ↔ web
│  ├─ shared/        # Utilitários puros (dinheiro, CPF/CNPJ)
│  └─ config/        # tsconfig e prettier compartilhados
├─ docs/             # Documentação do produto e arquitetura
├─ docker-compose.yml
└─ turbo.json
```

## Como rodar localmente

Pré-requisitos: **Node.js 22+**, **pnpm** (`npm install -g pnpm`) e **Docker Desktop**.

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# gere um JWT_SECRET forte, por exemplo: openssl rand -base64 32

# 3. Subir Postgres e Redis
pnpm docker:up

# 4. Rodar a primeira migration e o seed
pnpm db:migrate
pnpm db:seed

# 5. Subir API + web em modo watch
pnpm dev
```

- API em `http://localhost:3333` (`/health` para checar que subiu).
- Web em `http://localhost:3000` (`/login`).
- Usuário de desenvolvimento criado pelo seed: `admin@technoloife.com.br` / `technoloife@123`.

### Outros comandos úteis

| Comando | Ação |
|---|---|
| `pnpm test` | Roda os testes de todos os pacotes (Turborepo) |
| `pnpm lint` / `pnpm typecheck` | Qualidade de código |
| `pnpm db:studio` | Abre o Prisma Studio |
| `pnpm db:reset` | Reseta o banco (migrations + seed) |
| `pnpm docker:down` | Derruba Postgres/Redis locais |

## Próximos passos

Seguir a **Sprint 1** do [plano de execução](docs/10-plano-de-execucao.md): autenticação
(login, refresh rotativo) e o módulo de Clientes.
