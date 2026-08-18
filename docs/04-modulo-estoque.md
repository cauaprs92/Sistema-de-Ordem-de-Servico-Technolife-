# 04 — Módulo Estoque

O princípio central (ADR-003): **o saldo não é um campo que se edita, é um resultado que se
calcula.** A verdade está em `movimentos_estoque`, tabela append-only. `produtos.saldo` é
cache mantido dentro da mesma transação do movimento.

## 1. Casos de uso

| ID | Caso de uso | Papéis |
|---|---|---|
| EST-01 | Cadastrar/editar produto | ADMIN, ESTOQUE |
| EST-02 | Dar entrada por compra (com NF do fornecedor) | ADMIN, ESTOQUE |
| EST-03 | Consultar saldo, disponível e reservado | Todos |
| EST-04 | Ver extrato (kardex) de um produto | ADMIN, ESTOQUE, FINANCEIRO |
| EST-05 | Ajustar saldo com motivo | ADMIN, ESTOQUE |
| EST-06 | Registrar perda/avaria | ADMIN, ESTOQUE |
| EST-07 | Reservar peça para OS aprovada | Sistema (via OS) |
| EST-08 | Baixar peça no consumo da OS | Sistema (via OS) |
| EST-09 | Devolver peça não utilizada | ADMIN, ESTOQUE, TECNICO |
| EST-10 | Listar itens abaixo do estoque mínimo | ADMIN, ESTOQUE |
| EST-11 | Abrir e fechar inventário | ADMIN, ESTOQUE |
| EST-12 | Relatório de valorização do estoque | ADMIN, FINANCEIRO |

## 2. Regras de negócio

**RN-EST-01 — Todo movimento é rastreável.** Nenhum movimento existe sem `tipo`, `origem`,
`origem_id` (quando aplicável) e `usuario_id`. Ajustes, perdas e devoluções exigem `motivo`
com no mínimo 10 caracteres.

**RN-EST-02 — Saldo negativo é proibido por padrão.** Uma saída que deixaria
`saldo < 0` é rejeitada (`422`). O parâmetro `permite_estoque_negativo` pode liberar isso
para produtos específicos (`produtos.permite_negativo`), mas o padrão é bloquear —
estoque negativo esconde erro de processo.

**RN-EST-03 — Custo médio ponderado.** Recalculado a cada **entrada**:

```
custo_medio_novo = (saldo_atual × custo_medio_atual + qtd_entrada × custo_entrada)
                   ÷ (saldo_atual + qtd_entrada)
```

Saídas **não** alteram o custo médio. Se `saldo_atual = 0`, o custo médio passa a ser o
custo da entrada. Precisão interna de 4 casas; arredondamento só na exibição.

**RN-EST-04 — Reserva ≠ baixa.** Ao **aprovar** a OS, as peças são reservadas
(`saldo_reservado += qtd`) — o saldo físico não muda. Ao **consumir** (técnico confirma o
uso ou a OS é finalizada), gera-se o movimento de saída e a reserva é liberada. Isso evita
que duas OS prometam a mesma última peça.

**RN-EST-05 — Disponibilidade.** `disponivel = saldo - saldo_reservado`. Toda validação de
saída usa `disponivel`, não `saldo`.

**RN-EST-06 — Cancelamento estorna.** OS cancelada com reserva ativa → reserva liberada.
OS cancelada após a baixa → movimento de `DEVOLUCAO` referenciando a mesma OS. Nunca se
apaga o movimento original.

**RN-EST-07 — Entrada exige custo.** Movimento de `ENTRADA` sem `custo_unitario > 0` é
rejeitado; sem ele o custo médio se corrompe silenciosamente.

**RN-EST-08 — Snapshot no movimento.** Todo movimento grava `saldo_apos` e
`custo_medio_apos`. É o que permite auditar divergência sem reprocessar a série inteira.

**RN-EST-09 — Conferência diária.** Job noturno compara `produtos.saldo` com a soma
assinada dos movimentos. Divergência gera alerta para o ADMIN — nunca correção automática.

**RN-EST-10 — Inventário.** Ao fechar um inventário, cada item com diferença gera um
movimento de `AJUSTE_POSITIVO`/`AJUSTE_NEGATIVO` com `origem = INVENTARIO`. Enquanto o
inventário está `ABERTO`, os produtos contados ficam travados para saída manual.

**RN-EST-11 — Serviço não tem estoque.** Itens com `controla_estoque = false` não geram
movimento nem reserva.

**RN-EST-12 — Concorrência.** Toda escrita de movimento faz `SELECT ... FOR UPDATE` na
linha do produto dentro da transação, evitando *lost update* em duas baixas simultâneas.

## 3. Efeito de cada tipo de movimento

| Tipo | Sinal no saldo | Afeta custo médio | Exige motivo | Exige custo unitário |
|---|---|---|---|---|
| `ENTRADA` | + | **Sim** | Não | **Sim** |
| `SAIDA` | − | Não | Não | Não (usa custo médio) |
| `DEVOLUCAO` | + | Não¹ | Sim | Não |
| `AJUSTE_POSITIVO` | + | Não | **Sim** | Opcional |
| `AJUSTE_NEGATIVO` | − | Não | **Sim** | Não |
| `PERDA` | − | Não | **Sim** | Não |
| `TRANSFERENCIA` | +/− | Não | Sim | Não |

¹ Devolução retorna a peça pelo custo com que saiu (guardado em `os_itens.custo_unitario`).

## 4. Fluxo de entrada por compra

```
1. Estoquista lança a compra: fornecedor, nº da NF, data
2. Adiciona itens: produto, quantidade, custo unitário
3. Confirma
   ├─ para cada item: movimento ENTRADA (recalcula custo médio)
   ├─ opcional: gera título a PAGAR (financeiro) com vencimento e parcelas
   └─ tudo em UMA transação
```

## 5. Alertas do módulo

| Alerta | Condição |
|---|---|
| Estoque baixo | `disponivel <= estoque_minimo` |
| Estoque zerado com demanda | `saldo = 0` e existe reserva pendente |
| Produto parado | Sem movimento de saída há > 180 dias e saldo > 0 |
| Divergência de saldo | Job de conferência (RN-EST-09) |
| Custo destoante | Entrada com custo > 50% acima do custo médio atual (confirmar) |

## 6. Relatórios

- **Kardex** — extrato completo de um produto por período, com saldo e custo linha a linha.
- **Posição de estoque** — saldo, disponível, reservado, custo médio, valor total por produto/categoria.
- **Valorização** — `Σ (saldo × custo_medio)` na data, para o financeiro.
- **Curva ABC** — produtos por valor de consumo no período.
- **Ponto de reposição** — itens abaixo do mínimo com sugestão de compra e fornecedor padrão.

## 7. Critérios de aceite (MVP)

- [ ] Entrada de compra recalcula o custo médio pela fórmula da RN-EST-03 (teste unitário com casos de borda: saldo zero, saldo fracionário).
- [ ] Saída que deixaria saldo negativo é bloqueada com mensagem clara.
- [ ] Reserva ao aprovar OS reduz o disponível sem alterar o saldo.
- [ ] Baixa ao consumir gera movimento, libera a reserva e atualiza saldo na mesma transação.
- [ ] Cancelar OS estorna corretamente nos dois cenários (com reserva / após baixa).
- [ ] Kardex de um produto bate com o saldo atual (soma assinada = `produtos.saldo`).
- [ ] Duas baixas simultâneas do último item: uma sucede, a outra recebe erro (teste de concorrência).
- [ ] Inventário fechado gera movimentos de ajuste rastreáveis.
