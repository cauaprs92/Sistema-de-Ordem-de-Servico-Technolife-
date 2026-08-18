# 00 — Visão Geral

## 1. Contexto

A **Technoloife** precisa substituir controles dispersos (planilhas, cadernos, WhatsApp)
por um sistema único onde o atendimento ao cliente, a execução do serviço, a baixa de
peças no estoque, a emissão da nota e o recebimento do dinheiro sejam **o mesmo fluxo**,
não cinco processos paralelos.

O sistema é **single-tenant**: atende uma única empresa (Technoloife), com múltiplos
usuários e papéis. Isso simplifica o modelo (sem coluna `tenant_id` em todas as tabelas),
mas a arquitetura não impede uma evolução futura para multi-empresa.

## 2. Objetivo do produto

> Registrar uma ordem de serviço, consumir peças do estoque, emitir a nota fiscal
> correspondente e gerar as contas a receber — em um único fluxo rastreável, sem
> redigitação de dados.

### Objetivos mensuráveis do MVP

| Objetivo | Métrica |
|---|---|
| Eliminar redigitação | 0 campos digitados duas vezes entre OS → NF → Financeiro |
| Estoque confiável | Saldo do sistema = saldo físico em ≥ 98% dos itens no inventário mensal |
| Visibilidade financeira | Fluxo de caixa projetado a 90 dias disponível em ≤ 3 cliques |
| Rastreabilidade | Toda alteração de status registrada com autor, data/hora e motivo |

## 3. Escopo

### Dentro do escopo (MVP)

- **Clientes** — cadastro PF/PJ, endereços, contatos, equipamentos do cliente, histórico.
- **Estoque** — produtos/peças, entradas e saídas, saldo, custo médio, estoque mínimo, reserva por OS.
- **Ordem de Serviço** — abertura, diagnóstico, orçamento, aprovação, execução, itens (peças + serviços), encerramento.
- **Notas Fiscais** — registro e emissão de NF-e (produto) e NFS-e (serviço) através de uma **camada de provedor abstrata**.
- **Financeiro** — contas a receber e a pagar, formas de pagamento, parcelamento, baixas, fluxo de caixa, categorias (plano de contas simplificado).
- **Transversal** — autenticação, papéis e permissões, log de auditoria, relatórios básicos, dashboard.

### Fora do escopo (MVP — backlog futuro)

- Folha de pagamento, ponto e RH.
- Contabilidade fiscal completa (SPED, ECD, apuração de impostos).
- E-commerce / catálogo público.
- App mobile nativo (a web será responsiva).
- Integração bancária automática (OFX/CNAB/Pix API) — previsto para a Fase 3.
- Multi-empresa / franquias.

## 4. Personas

| Persona | Papel no sistema | Precisa de |
|---|---|---|
| **Atendente** | `ATENDENTE` | Abrir OS rápido, achar cliente, consultar status, imprimir comprovante |
| **Técnico** | `TECNICO` | Ver sua fila de OS, lançar diagnóstico, peças usadas e horas |
| **Financeiro** | `FINANCEIRO` | Baixar recebimentos, lançar despesas, ver fluxo de caixa, emitir NF |
| **Estoquista** | `ESTOQUE` | Dar entrada em compras, conferir saldo, ver itens abaixo do mínimo |
| **Gestor/Dono** | `ADMIN` | Ver tudo, aprovar descontos, relatórios, configurar o sistema |

## 5. Fluxo principal (happy path)

```
Cliente chega
   │
   ▼
[Clientes] cadastro/localização do cliente + equipamento
   │
   ▼
[OS] abertura → diagnóstico → orçamento
   │
   ├─ cliente reprova → OS CANCELADA
   │
   ▼ cliente aprova
[OS] execução
   │
   ├──► [Estoque] reserva e baixa das peças utilizadas
   │
   ▼
[OS] encerramento (valor total = peças + serviços - desconto)
   │
   ├──► [Notas Fiscais] emissão da NF (produto e/ou serviço)
   │
   └──► [Financeiro] geração das contas a receber (à vista ou parcelado)
                │
                ▼
        baixa do recebimento → movimento de caixa
```

## 6. Glossário

| Termo | Significado |
|---|---|
| **OS** | Ordem de Serviço — documento que representa um atendimento/serviço do início ao fim |
| **Item de OS** | Linha da OS: uma peça (produto do estoque) ou um serviço (mão de obra) |
| **Movimento de estoque** | Registro imutável de entrada, saída ou ajuste de um produto |
| **Custo médio** | Custo unitário ponderado do produto, recalculado a cada entrada |
| **Reserva** | Quantidade comprometida com uma OS aprovada, ainda não baixada fisicamente |
| **Título** | Conta a pagar ou a receber (uma parcela) |
| **Baixa** | Registro de pagamento/recebimento total ou parcial de um título |
| **NF-e** | Nota Fiscal eletrônica de produto (modelo 55, estadual/SEFAZ) |
| **NFS-e** | Nota Fiscal de Serviço eletrônica (municipal/prefeitura) |
| **Provedor fiscal** | Serviço externo que assina e transmite a nota (a decidir — ver doc 06) |

## 7. Premissas e decisões pendentes

| # | Assunto | Status |
|---|---|---|
| P1 | Emissão fiscal: provedor terceiro vs. SEFAZ direto | **Pendente** — sistema será construído com interface abstrata (doc 06) |
| P2 | Regime tributário da Technoloife (Simples/Presumido) | **Pendente** — impacta cálculo de impostos na NF |
| P3 | Impressão de OS: térmica 80mm, A4 ou ambos | Assumido: **A4 (PDF)** no MVP |
| P4 | Volume esperado de OS/mês | Assumido: **até ~1.000/mês** (dimensiona infra) |
| P5 | Necessidade de acesso do cliente (portal) | Fora do MVP; previsto na Fase 4 |
