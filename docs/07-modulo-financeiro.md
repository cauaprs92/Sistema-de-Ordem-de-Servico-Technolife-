# 07 — Módulo Financeiro

Mesmo princípio do estoque (ADR-003): o saldo de caixa não é um campo editável, é o
resultado das baixas. Título é a **obrigação**; baixa é o **pagamento**; movimento de caixa
é o **efeito no dinheiro**. Três conceitos distintos, três tabelas.

## 1. Casos de uso

| ID | Caso de uso | Papéis |
|---|---|---|
| FIN-01 | Gerar contas a receber a partir de OS/NF | Sistema, FINANCEIRO |
| FIN-02 | Lançar conta a pagar manual | FINANCEIRO, ADMIN |
| FIN-03 | Parcelar título | FINANCEIRO, ADMIN |
| FIN-04 | Baixar título (total ou parcial) | FINANCEIRO, ADMIN |
| FIN-05 | Estornar baixa | ADMIN |
| FIN-06 | Cancelar título em aberto | FINANCEIRO, ADMIN |
| FIN-07 | Renegociar título vencido | ADMIN |
| FIN-08 | Consultar fluxo de caixa (realizado + projetado) | FINANCEIRO, ADMIN |
| FIN-09 | Ver inadimplência por cliente | FINANCEIRO, ADMIN |
| FIN-10 | Transferir entre contas | FINANCEIRO, ADMIN |
| FIN-11 | Fechar o caixa do dia | FINANCEIRO |
| FIN-12 | DRE simplificado por competência | ADMIN |
| FIN-13 | Gerir plano de contas (categorias) | ADMIN |

## 2. Regras de negócio

**RN-FIN-01 — Um título = uma parcela.** Parcelamento em 3x gera 3 títulos
(`OS-1042/1`, `/2`, `/3`), com o mesmo `origem_id`. Isso mantém vencimento, baixa e status
independentes por parcela, sem tabela extra.

**RN-FIN-02 — Distribuição de centavos.** Ao parcelar, `valor_parcela = round(total / n, 2)`
e **a diferença de arredondamento vai para a última parcela**. Invariante testada:
`Σ parcelas = valor_total` exatamente. R$ 100,00 em 3x → 33,33 + 33,33 + 33,34.

**RN-FIN-03 — Baixa parcial é permitida.** `valor_saldo = valor_original + juros + multa −
desconto − valor_pago`. Status: `ABERTO` → `PARCIAL` → `PAGO`. Baixa maior que o saldo é
rejeitada (I10).

**RN-FIN-04 — Baixa não se edita, se estorna.** Estorno cria movimento de caixa contrário,
marca `estornada_em` + `motivo_estorno` e devolve o título ao status anterior. Só ADMIN.

**RN-FIN-05 — Toda baixa produz movimento de caixa.** Uma baixa sem `conta_financeira_id`
é inválida. `movimentos_caixa` é o extrato conferível de cada conta.

**RN-FIN-06 — Juros e multa por atraso.** Parametrizáveis
(`parametros.juros_mes_percentual`, `parametros.multa_atraso_percentual`; defaults 1% a.m.
e 2%). Calculados **na tela de baixa**, como sugestão editável — nunca aplicados
automaticamente ao título. O operador confirma.

**RN-FIN-07 — Status `VENCIDO` é derivado.** `ABERTO`/`PARCIAL` com `data_vencimento < hoje`
é exibido como vencido; um job noturno materializa o status para relatórios.

**RN-FIN-08 — Competência ≠ vencimento ≠ pagamento.** Três datas distintas, cada uma com
seu uso: `data_competencia` (DRE), `data_vencimento` (contas a pagar/receber),
`baixa.data_pagamento` (fluxo de caixa). Confundi-las é o erro clássico deste módulo.

**RN-FIN-09 — Título vinculado a documento não é excluído.** Título com origem em OS ou NF
só pode ser cancelado (com motivo), nunca apagado. Título com baixa não cancela — estorna a
baixa primeiro.

**RN-FIN-10 — Fluxo de caixa projetado.** `saldo_atual + Σ receber em aberto no período −
Σ pagar em aberto no período`, por dia/semana/mês. Recebíveis de cliente inadimplente entram
sinalizados, para não inflar a projeção com dinheiro improvável.

**RN-FIN-11 — Taxa de meio de pagamento.** Formas com `taxa_percentual > 0` (cartão) geram,
na baixa, um lançamento de despesa automático na categoria "Taxas de cartão", pelo valor
líquido correto — o que entra na conta não é o valor do título.

**RN-FIN-12 — Compensação.** Formas com `prazo_compensacao_dias > 0` criam movimento de
caixa com data futura. O saldo tem duas leituras: **disponível hoje** e **projetado com
compensação**.

**RN-FIN-13 — Fechamento de caixa.** Registro diário por conta: saldo inicial, entradas,
saídas, saldo final do sistema, saldo contado, diferença + justificativa. Fechado o dia,
lançamentos retroativos naquela conta exigem ADMIN.

**RN-FIN-14 — Renegociação.** Título `RENEGOCIADO` é encerrado e origina novos títulos
apontando para ele (`titulo_origem_id`). O histórico da dívida original permanece intacto.

## 3. Condições de pagamento no faturamento da OS

| Condição | Efeito |
|---|---|
| À vista | 1 título vencendo hoje; normalmente já baixado no ato |
| Prazo fixo (7/15/30 dias) | 1 título com vencimento calculado |
| Parcelado sem entrada | N títulos, primeiro vencendo em `intervalo` dias |
| Parcelado com entrada | 1 título hoje + (N−1) títulos subsequentes |
| Cartão | 1 título por parcela, com taxa e compensação (RN-FIN-11/12) |

## 4. Relatórios

| Relatório | Base | Uso |
|---|---|---|
| Contas a receber | Vencimento | Cobrança do dia |
| Contas a pagar | Vencimento | Programação de pagamentos |
| Fluxo de caixa realizado | `movimentos_caixa` | O que entrou e saiu de fato |
| Fluxo de caixa projetado | Títulos em aberto | Decisão de compra/investimento |
| Inadimplência | Títulos vencidos por cliente | Régua de cobrança |
| DRE simplificado | Competência + categorias | Resultado do mês |
| Recebimentos por forma | Baixas | Quanto vem por Pix, cartão, dinheiro |
| Rentabilidade por OS | Receita − custo dos itens | Precificação |

## 5. Dashboard financeiro

```
┌───────────────┬───────────────┬───────────────┬───────────────┐
│ Saldo em caixa│ A receber hoje│ A pagar hoje  │ Vencido       │
│ R$ 18.430,00  │ R$ 3.200,00   │ R$ 1.150,00   │ R$ 4.870,00 ⚠ │
└───────────────┴───────────────┴───────────────┴───────────────┘
  Fluxo de caixa projetado — 90 dias          [gráfico de linha]
  Receita vs. Despesa por mês                 [barras agrupadas]
  Top 5 clientes inadimplentes                [tabela]
```

## 6. Critérios de aceite (MVP)

- [ ] Faturar OS de R$ 100,00 em 3x gera 33,33 + 33,33 + 33,34 (soma exata).
- [ ] Baixa parcial move o título para `PARCIAL` com saldo correto; baixa final para `PAGO`.
- [ ] Baixa maior que o saldo é rejeitada.
- [ ] Estorno de baixa reverte título e caixa, mantendo o registro original.
- [ ] Toda baixa gera movimento de caixa; extrato da conta bate com `saldo_atual`.
- [ ] Juros/multa sugeridos corretamente em título vencido e editáveis antes de confirmar.
- [ ] Pagamento em cartão com taxa gera a despesa correspondente e o líquido correto.
- [ ] Fluxo de caixa projetado a 90 dias renderiza em < 1 s com 5.000 títulos.
- [ ] Fechamento de caixa registra diferença com justificativa obrigatória.
