# 11 — Padrões e Convenções

## 1. TypeScript

`strict: true`, `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`.

| Regra | Motivo |
|---|---|
| `any` proibido (erro de lint). Use `unknown` + narrowing | `any` desliga o motivo de usar TypeScript |
| Sem `!` (non-null assertion) fora de testes | Se não pode ser nulo, o tipo deve dizer isso |
| Tipos de domínio derivados do Zod (`z.infer`) | Uma fonte de verdade para validação e tipo |
| `enum` do TS proibido; use union de strings ou enum do Prisma | Enums do TS têm semântica estranha em runtime |
| Retorno explícito em funções exportadas | Evita vazar tipos inferidos gigantes |

## 2. Dinheiro e números

**Regra absoluta: nunca `number` para dinheiro.**

```ts
// ❌ 0.1 + 0.2 === 0.30000000000000004
const total = itens.reduce((s, i) => s + i.preco * i.qtd, 0);

// ✅
import { Prisma } from '@prisma/client';
const total = itens.reduce(
  (s, i) => s.plus(new Prisma.Decimal(i.preco).times(i.qtd)),
  new Prisma.Decimal(0),
);
```

- Persistência: `NUMERIC(14,2)` (dinheiro), `NUMERIC(14,3)` (quantidade), `NUMERIC(14,4)` (custo unitário).
- Transporte na API: **string** (`"1234.56"`).
- Arredondamento: só na apresentação, `ROUND_HALF_UP`, via helper `formatarMoeda`.
- Divisão com rateio usa `distribuirCentavos(total, n)` de `packages/shared` — a diferença vai para a última parcela (RN-FIN-02).

## 3. Datas

- Banco: `timestamptz` para instantes; `date` para datas de negócio (vencimento, competência).
- Aplicação: UTC internamente; conversão para `America/Sao_Paulo` na borda.
- Biblioteca: `date-fns` + `date-fns-tz`. Nada de `moment`.
- Comparação de "hoje" usa a data no fuso da empresa, não `new Date()` do servidor.

## 4. Erros

```ts
// shared/errors.ts
export class ErroDeNegocio extends Error {
  constructor(
    readonly codigo: string,
    mensagem: string,
    readonly status = 422,
    readonly detalhes: Detalhe[] = [],
  ) { super(mensagem); }
}

export class SaldoInsuficienteError extends ErroDeNegocio {
  constructor(sku: string, disponivel: string, solicitado: string) {
    super('SALDO_INSUFICIENTE', `Saldo insuficiente para o produto ${sku}.`, 422,
      [{ campo: 'quantidade', mensagem: `Disponível: ${disponivel}, solicitado: ${solicitado}` }]);
  }
}
```

- Erro de negócio é **tipado**, com código do catálogo do doc 08.
- O `errorHandler` global converte para o envelope padrão; nenhum `try/catch` em rota.
- Erro inesperado → `500` genérico no cliente + log completo no servidor. Nunca vazar stack.
- Mensagem de erro é escrita para o **usuário final**, em português, sem jargão técnico.

## 5. Transações

```ts
// Regra: quem abre transação é o service. Repository nunca abre.
async function concluirOs(osId: string, usuarioId: string) {
  return prisma.$transaction(async (tx) => {
    const os = await osRepo.buscarComItens(osId, tx);
    validarTransicao(os.status, 'CONCLUIDA', { os });
    await estoqueService.baixarItensDaOs(os, usuarioId, tx);   // mesma tx
    await osRepo.atualizarStatus(osId, 'CONCLUIDA', tx);
    await auditoria.registrar({ ... }, tx);
    return os;
  }, { isolationLevel: 'ReadCommitted', timeout: 15_000 });
}
```

- Efeito colateral externo (e-mail, provedor fiscal) **nunca** dentro da transação — vai para job pós-commit.
- Toda escrita concorrente em saldo usa `SELECT … FOR UPDATE` na linha do produto/título.

## 6. Nomenclatura

| Item | Padrão | Exemplo |
|---|---|---|
| Tabela / coluna | `snake_case`, tabela no plural | `ordens_servico`, `valor_total` |
| Modelo Prisma | `PascalCase` singular | `OrdemServico` |
| Arquivo TS | `kebab-case` | `ordem-servico.service.ts` |
| Classe / tipo | `PascalCase` | `EstoqueService`, `CriarOsInput` |
| Função / variável | `camelCase` | `calcularTotalDaOs` |
| Constante | `SCREAMING_SNAKE_CASE` | `DESCONTO_MAXIMO_PADRAO` |
| Componente React | `PascalCase` | `OrdemServicoForm.tsx` |
| Rota da API | plural kebab-case | `/ordens-servico` |
| Branch | `tipo/descricao-curta` | `feat/os-baixa-estoque` |

**Idioma:** domínio em **português** (é o vocabulário do negócio e evita traduções ruins
como "serviceOrder"/"stockMovement" que ninguém usa na conversa). Infraestrutura e termos
técnicos em inglês (`repository`, `service`, `handler`, `middleware`). Sem meia-tradução.

## 7. Testes

| Nível | Ferramenta | O que cobre | Meta |
|---|---|---|---|
| Unidade | Vitest | Regras de negócio puras (custo médio, rateio, transições) | ≥ 90% nos services críticos |
| Integração | Vitest + Supertest + Testcontainers | Rota → service → banco real | Todo endpoint de escrita |
| E2E | Playwright | 5 fluxos críticos ponta a ponta | Antes do go-live |
| Carga | k6 | 50 usuários simultâneos | Sprint 8 |

**Os 5 fluxos críticos de E2E:** (1) cadastrar cliente e abrir OS; (2) aprovar OS com reserva
de estoque; (3) concluir OS com baixa; (4) faturar gerando títulos; (5) baixar título e ver
no fluxo de caixa.

Regras: teste não depende de outro teste; banco limpo por arquivo; sem `sleep` (usar
esperas determinísticas); toda correção de bug entra com o teste que o reproduz.

## 8. Git e revisão

- Branch a partir de `main`; sem commit direto em `main`.
- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`, `perf:`.
- PR pequeno (< 400 linhas alteradas quando possível), com descrição do *porquê*.
- Toda PR passa por: lint, typecheck, testes, revisão humana.
- Squash merge; a mensagem final descreve a mudança inteira.

## 9. Estrutura de um service (modelo)

```ts
export class OrdemServicoService {
  constructor(
    private readonly repo: OrdemServicoRepository,
    private readonly estoque: EstoqueService,
    private readonly auditoria: AuditoriaService,
    private readonly eventos: EventBus,
  ) {}

  async adicionarItem(osId: string, input: AdicionarItemInput, ctx: Contexto) {
    return prisma.$transaction(async (tx) => {
      const os = await this.repo.buscar(osId, tx);
      if (!os) throw new NaoEncontradoError('Ordem de serviço', osId);
      if (STATUS_TRAVADOS.includes(os.status) && !ctx.temPermissao('os:editar-aprovada')) {
        throw new ErroDeNegocio('OS_TRAVADA', 'OS aprovada não pode ter itens alterados.', 409);
      }
      const item = await this.repo.criarItem(osId, comSnapshotDePreco(input), tx);
      await this.repo.recalcularTotais(osId, tx);
      await this.auditoria.registrar({ entidade: 'ordem_servico', ... }, tx);
      return item;
    });
  }
}
```

Injeção de dependência por construtor — é o que torna o service testável sem banco.

## 10. Frontend

- **Server Components** por padrão; `'use client'` só onde há interatividade.
- Formulários: React Hook Form + o **mesmo** schema Zod do backend (`packages/contracts`).
- Dados: TanStack Query, com invalidação explícita após mutação.
- Toda tela tem quatro estados: carregando (skeleton), vazio (com ação sugerida), erro
  (com retry) e sucesso. Tela sem estado vazio tratado não passa na revisão.
- Acessibilidade: navegação por teclado, labels associados, contraste AA.
- Moeda e datas formatadas por helpers compartilhados — nunca `toFixed` solto no JSX.

## 11. Ambiente e configuração

```ts
// config/env.ts — falha rápido no boot, não em produção às 3h da manhã
export const env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  FISCAL_PROVIDER: z.enum(['mock', 'focus', 'plugnotas']).default('mock'),
  FISCAL_API_KEY: z.string().optional(),
  STORAGE_PATH: z.string().default('./storage'),
  TZ: z.string().default('America/Sao_Paulo'),
}).parse(process.env);
```

## 12. Scripts do monorepo

| Comando | Ação |
|---|---|
| `pnpm dev` | API + web em modo watch |
| `pnpm build` | Build de tudo (Turborepo, com cache) |
| `pnpm test` · `test:watch` · `test:e2e` | Testes |
| `pnpm lint` · `pnpm typecheck` | Qualidade |
| `pnpm db:migrate` · `db:seed` · `db:studio` · `db:reset` | Banco |
| `pnpm docker:up` · `docker:down` | Infra local |
