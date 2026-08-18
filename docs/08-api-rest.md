# 08 — API REST

Base: `https://api.technoloife.com.br/v1` · Local: `http://localhost:3333/v1`
Formato: JSON (UTF-8). Datas em ISO 8601 com timezone. Valores monetários como **string
decimal** (`"1234.56"`) para não perder precisão em `float` de JavaScript.

## 1. Convenções

| Aspecto | Regra |
|---|---|
| Nomenclatura | Recursos no plural, kebab-case: `/ordens-servico`, `/notas-fiscais` |
| Verbos | `GET` (ler), `POST` (criar/ação), `PATCH` (atualizar parcial), `DELETE` (remover cadastro sem vínculo) |
| Ações de domínio | `POST /recurso/{id}/acao` — ex. `/ordens-servico/{id}/aprovar` |
| Campos JSON | `camelCase` na API, `snake_case` no banco (mapeado pelo Prisma) |
| Versionamento | Prefixo `/v1`; mudança incompatível → `/v2` |
| Idempotência | `POST` de efeito externo aceita header `Idempotency-Key` |
| Rate limit | 300 req/min por usuário (headers `X-RateLimit-*`) |
| Correlação | Header `X-Request-Id` propagado para os logs |

## 2. Envelope de resposta

**Lista (paginada)**

```json
{
  "data": [ { "id": "…", "nome": "…" } ],
  "meta": { "pagina": 1, "porPagina": 20, "total": 137, "totalPaginas": 7 }
}
```

**Item único** — o objeto direto, sem envelope.

**Erro**

```json
{
  "erro": {
    "codigo": "SALDO_INSUFICIENTE",
    "mensagem": "Saldo insuficiente para o produto SKU-0042.",
    "detalhes": [
      { "campo": "itens[2].quantidade", "mensagem": "Disponível: 3, solicitado: 5" }
    ],
    "requestId": "01J9K…"
  }
}
```

`codigo` é estável e serve para o front reagir; `mensagem` é para o humano.

## 3. Códigos de status

| Código | Quando |
|---|---|
| 200 | Sucesso com corpo |
| 201 | Recurso criado (com header `Location`) |
| 202 | Aceito para processamento assíncrono (emissão de NF) |
| 204 | Sucesso sem corpo |
| 400 | JSON malformado |
| 401 | Sem token ou token inválido/expirado |
| 403 | Autenticado, mas sem permissão para a ação |
| 404 | Recurso inexistente |
| 409 | Conflito de estado (duplicidade, transição inválida) |
| 422 | Regra de negócio violada (payload bem formado) |
| 429 | Rate limit |
| 500 | Erro interno (nunca vaza stack trace) |

## 4. Paginação, ordenação e filtros

```
GET /clientes?pagina=1&porPagina=20&ordenar=-criadoEm&busca=acme&ativo=true
```

- `ordenar`: campo com `-` para descendente. Só campos indexados são aceitos.
- `busca`: texto livre; cada módulo define os campos varridos.
- Filtros de período: `dataInicio` / `dataFim` (inclusivos).
- Listagens grandes (relatórios) suportam `?formato=csv`.

## 5. Autenticação

```
POST /auth/login          { email, senha } → { accessToken, refreshToken, usuario }
POST /auth/refresh        { refreshToken } → { accessToken, refreshToken }
POST /auth/logout         revoga o refresh token
GET  /auth/me             usuário e permissões da sessão
POST /auth/alterar-senha  { senhaAtual, novaSenha }
```

Access token: JWT, 15 min, header `Authorization: Bearer <token>`.
Refresh token: 7 dias, rotativo, persistido com hash e revogável.

## 6. Endpoints por módulo

### Clientes

| Método | Rota | Descrição |
|---|---|---|
| GET | `/clientes` | Listar/buscar |
| POST | `/clientes` | Criar |
| GET | `/clientes/{id}` | Detalhar |
| PATCH | `/clientes/{id}` | Atualizar |
| DELETE | `/clientes/{id}` | Excluir (só sem vínculos) |
| POST | `/clientes/{id}/inativar` · `/reativar` | Status |
| POST | `/clientes/{id}/bloquear` · `/desbloquear` | Bloqueio (motivo obrigatório) |
| GET/POST | `/clientes/{id}/enderecos` | Endereços |
| PATCH/DELETE | `/clientes/{id}/enderecos/{enderecoId}` | |
| GET/POST | `/clientes/{id}/contatos` | Contatos |
| GET/POST | `/clientes/{id}/equipamentos` | Equipamentos |
| GET | `/clientes/{id}/historico` | Timeline OS + NF + títulos |
| GET | `/clientes/{id}/resumo-financeiro` | Em aberto, vencido, limite |
| POST | `/clientes/importar` | CSV (multipart) |

### Estoque

| Método | Rota | Descrição |
|---|---|---|
| GET/POST | `/produtos` | Listar / criar |
| GET/PATCH | `/produtos/{id}` | Detalhar / atualizar |
| GET | `/produtos/{id}/kardex` | Extrato de movimentos |
| GET | `/produtos/alertas/estoque-baixo` | Abaixo do mínimo |
| GET | `/movimentos-estoque` | Listar movimentos (filtros por tipo, origem, período) |
| POST | `/movimentos-estoque/entrada` | Entrada de compra (multi-item, transacional) |
| POST | `/movimentos-estoque/ajuste` | Ajuste com motivo |
| POST | `/movimentos-estoque/perda` | Perda/avaria |
| GET/POST | `/categorias-produto` | Categorias |
| GET/POST | `/fornecedores` | Fornecedores |
| GET/POST | `/inventarios` | Inventários |
| POST | `/inventarios/{id}/itens` · `/fechar` | Contagem e fechamento |
| GET | `/relatorios/estoque/posicao` · `/valorizacao` · `/curva-abc` | Relatórios |

### Ordens de Serviço

| Método | Rota | Descrição |
|---|---|---|
| GET/POST | `/ordens-servico` | Listar / abrir |
| GET/PATCH | `/ordens-servico/{id}` | Detalhar / atualizar campos livres |
| GET | `/ordens-servico/kanban` | Agrupado por status |
| POST | `/ordens-servico/{id}/itens` | Adicionar item |
| PATCH/DELETE | `/ordens-servico/{id}/itens/{itemId}` | Alterar / remover |
| POST | `/ordens-servico/{id}/status` | `{ status, observacao }` — valida a transição |
| POST | `/ordens-servico/{id}/aprovar` | `{ aprovadoPor, canal }` |
| POST | `/ordens-servico/{id}/reprovar` · `/cancelar` | `{ motivo }` |
| POST | `/ordens-servico/{id}/faturar` | `{ condicaoPagamento, emitirNota }` |
| POST | `/ordens-servico/{id}/desconto` | `{ valor, tipo, justificativa }` |
| GET/POST | `/ordens-servico/{id}/apontamentos` | Horas |
| GET/POST | `/ordens-servico/{id}/anexos` | Upload (multipart) |
| GET | `/ordens-servico/{id}/historico` | Trilha de status |
| GET | `/ordens-servico/{id}/pdf?tipo=orcamento\|entrada\|entrega` | PDF |
| GET | `/ordens-servico/{id}/margem` | ADMIN/FINANCEIRO |
| GET/POST | `/servicos` | Catálogo de serviços |

### Notas Fiscais

| Método | Rota | Descrição |
|---|---|---|
| GET | `/notas-fiscais` | Listar (filtros: tipo, status, período, cliente) |
| POST | `/notas-fiscais` | Criar rascunho |
| POST | `/notas-fiscais/da-ordem-servico/{osId}` | Rascunho a partir da OS |
| GET/PATCH | `/notas-fiscais/{id}` | Detalhar / editar rascunho |
| POST | `/notas-fiscais/{id}/validar` | Validação local (RN-NF-04) |
| POST | `/notas-fiscais/{id}/emitir` | **202** — enfileira emissão |
| GET | `/notas-fiscais/{id}/status` | Polling |
| POST | `/notas-fiscais/{id}/cancelar` | `{ motivo }` |
| POST | `/notas-fiscais/{id}/carta-correcao` | `{ texto }` |
| GET | `/notas-fiscais/{id}/xml` · `/pdf` | Download |
| GET | `/notas-fiscais/{id}/eventos` | Linha do tempo fiscal |
| POST | `/notas-fiscais/entrada` | Registrar NF de fornecedor |

### Financeiro

| Método | Rota | Descrição |
|---|---|---|
| GET/POST | `/titulos` | Listar / criar (filtros: tipo, status, vencimento, cliente) |
| GET/PATCH | `/titulos/{id}` | Detalhar / atualizar |
| POST | `/titulos/{id}/baixar` | `{ valor, data, formaPagamentoId, contaId, juros, multa, desconto }` |
| POST | `/titulos/{id}/cancelar` | `{ motivo }` |
| POST | `/titulos/{id}/renegociar` | Novas condições |
| POST | `/baixas/{id}/estornar` | `{ motivo }` — ADMIN |
| GET/POST | `/contas-financeiras` | Contas |
| GET | `/contas-financeiras/{id}/extrato` | Movimentos |
| POST | `/contas-financeiras/transferir` | Entre contas |
| POST | `/contas-financeiras/{id}/fechar-caixa` | `{ data, saldoContado, justificativa }` |
| GET/POST | `/categorias-financeiras` · `/formas-pagamento` | Cadastros |
| GET | `/relatorios/financeiro/fluxo-caixa` | `?tipo=realizado\|projetado&dataInicio&dataFim` |
| GET | `/relatorios/financeiro/inadimplencia` · `/dre` · `/recebimentos-por-forma` | Relatórios |

### Transversal

| Método | Rota | Descrição |
|---|---|---|
| GET/POST | `/usuarios` | Gestão de usuários (ADMIN) |
| GET/PATCH | `/parametros` | Configuração da empresa (ADMIN) |
| GET | `/auditoria` | Filtros por entidade, usuário, período (ADMIN) |
| GET | `/dashboard` | Indicadores da home conforme o papel |
| GET | `/health` · `/health/ready` | Monitoramento |
| GET | `/docs` | Swagger UI (OpenAPI 3.1) |

## 7. Exemplos

**Abrir OS**

```http
POST /v1/ordens-servico
Authorization: Bearer <token>

{
  "clienteId": "01J9…",
  "equipamentoId": "01J9…",
  "descricaoProblema": "Não liga. Cliente relata queda de energia.",
  "prioridade": "ALTA",
  "tipo": "MANUTENCAO",
  "tecnicoId": "01J9…"
}
```

```json
201 Created
Location: /v1/ordens-servico/01J9K2M…

{ "id": "01J9K2M…", "numero": 1042, "status": "ABERTA",
  "cliente": { "id": "01J9…", "nome": "ACME COMÉRCIO LTDA" },
  "valorTotal": "0.00", "criadoEm": "2026-08-14T13:22:10-03:00" }
```

**Faturar OS em 3x**

```http
POST /v1/ordens-servico/01J9K2M…/faturar

{ "condicaoPagamento": { "tipo": "PARCELADO", "parcelas": 3, "intervaloDias": 30,
                         "formaPagamentoId": "01J9…" },
  "emitirNota": true }
```

```json
200 OK
{ "ordemServico": { "id": "01J9K2M…", "status": "FATURADA", "valorTotal": "100.00" },
  "titulos": [
    { "id": "…", "numero": "OS-1042/1", "valorOriginal": "33.33", "dataVencimento": "2026-09-13" },
    { "id": "…", "numero": "OS-1042/2", "valorOriginal": "33.33", "dataVencimento": "2026-10-13" },
    { "id": "…", "numero": "OS-1042/3", "valorOriginal": "33.34", "dataVencimento": "2026-11-12" }
  ],
  "notasFiscais": [ { "id": "…", "tipo": "NFSE", "status": "PROCESSANDO" } ] }
```

**Erro de regra de negócio**

```json
422 Unprocessable Entity
{ "erro": { "codigo": "TRANSICAO_INVALIDA",
            "mensagem": "Não é possível concluir uma OS que ainda não foi aprovada.",
            "detalhes": [ { "campo": "status",
                            "mensagem": "De ABERTA só é possível ir para EM_DIAGNOSTICO ou CANCELADA" } ],
            "requestId": "01J9K…" } }
```

## 8. Catálogo de códigos de erro

| Código | HTTP | Significado |
|---|---|---|
| `NAO_AUTENTICADO` | 401 | Token ausente/inválido |
| `SEM_PERMISSAO` | 403 | Papel sem acesso à ação |
| `NAO_ENCONTRADO` | 404 | Recurso inexistente |
| `DOCUMENTO_DUPLICADO` | 409 | CPF/CNPJ já cadastrado |
| `TRANSICAO_INVALIDA` | 409 | Mudança de status não permitida |
| `RECURSO_EM_USO` | 409 | Exclusão de cadastro com vínculos |
| `VALIDACAO` | 422 | Payload inválido |
| `SALDO_INSUFICIENTE` | 422 | Estoque indisponível |
| `CLIENTE_BLOQUEADO` | 422 | Cliente impedido de abrir OS |
| `LIMITE_CREDITO_EXCEDIDO` | 422 | Requer aprovação |
| `DESCONTO_ACIMA_DO_LIMITE` | 422 | Requer ADMIN |
| `VALOR_MAIOR_QUE_SALDO` | 422 | Baixa acima do saldo do título |
| `NOTA_NAO_CANCELAVEL` | 422 | Fora do prazo legal |
| `DADOS_FISCAIS_INCOMPLETOS` | 422 | Faltam campos para emitir |
| `TITULO_COM_BAIXA` | 422 | Estornar antes de cancelar |
