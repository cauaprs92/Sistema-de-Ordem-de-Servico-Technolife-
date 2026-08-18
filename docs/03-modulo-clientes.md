# 03 — Módulo Clientes

É a base de tudo: OS, NF e títulos apontam para um cliente. Erro aqui contamina os outros
quatro módulos, então o cadastro é rigoroso na validação e generoso na busca.

## 1. Casos de uso

| ID | Caso de uso | Papéis |
|---|---|---|
| CLI-01 | Cadastrar cliente PF ou PJ | ADMIN, ATENDENTE |
| CLI-02 | Buscar cliente (nome, documento, telefone, e-mail, código) | Todos |
| CLI-03 | Editar cadastro | ADMIN, ATENDENTE |
| CLI-04 | Inativar / reativar cliente | ADMIN |
| CLI-05 | Gerenciar endereços (múltiplos, um principal) | ADMIN, ATENDENTE |
| CLI-06 | Gerenciar contatos (PJ) | ADMIN, ATENDENTE |
| CLI-07 | Cadastrar equipamento do cliente | ADMIN, ATENDENTE, TECNICO |
| CLI-08 | Ver histórico consolidado (OS, NF, títulos) | ADMIN, ATENDENTE, FINANCEIRO |
| CLI-09 | Bloquear cliente por inadimplência | ADMIN, FINANCEIRO |
| CLI-10 | Importar clientes de CSV | ADMIN |

## 2. Regras de negócio

**RN-CLI-01 — Documento válido e único.** CPF/CNPJ validado por dígito verificador,
armazenado só com dígitos. Documento duplicado entre clientes ativos é rejeitado com
`409 Conflict` e a resposta traz o `id` do cliente existente, para o atendente abrir o
cadastro em vez de criar duplicata.

**RN-CLI-02 — Estrangeiro/sem documento.** Cadastro sem documento é permitido, mas o
cliente fica marcado como `documento_pendente` e **não pode receber nota fiscal** até
regularizar.

**RN-CLI-03 — Cliente nunca é excluído.** Cliente com qualquer OS, NF ou título só pode ser
**inativado**. `DELETE` físico só é permitido em cadastro sem nenhum vínculo.

**RN-CLI-04 — Bloqueio.** Cliente `bloqueado = true` não pode ter nova OS aberta. Um ADMIN
pode liberar a abertura caso a caso, e a liberação fica registrada na auditoria com motivo.

**RN-CLI-05 — Bloqueio automático (opcional, parametrizável).** Cliente com título
`RECEBER` vencido há mais de N dias (`parametros.dias_bloqueio_inadimplencia`, default 30)
é sinalizado no atendimento. O bloqueio efetivo é manual — o sistema alerta, o humano decide.

**RN-CLI-06 — Limite de crédito.** Se `limite_credito > 0`, ao finalizar uma OS a prazo o
sistema soma o saldo em aberto do cliente + o valor da OS. Excedeu o limite → exige
aprovação de ADMIN ou FINANCEIRO.

**RN-CLI-07 — Endereço principal.** Sempre exatamente um. Marcar um novo como principal
desmarca o anterior na mesma transação. O primeiro endereço cadastrado é principal
automaticamente.

**RN-CLI-08 — Dados fiscais de PJ.** Para emitir NF-e a um cliente PJ, são obrigatórios:
razão social, CNPJ, inscrição estadual (ou `ISENTO`) e endereço completo com código IBGE do
município. A validação acontece na **emissão**, não no cadastro — não travar o atendimento.

**RN-CLI-09 — Busca tolerante.** A busca aceita documento com ou sem máscara, ignora
acentos e maiúsculas, e casa por trecho do nome. Implementação: coluna gerada `unaccent(lower(nome))`
com índice `pg_trgm` (GIN).

**RN-CLI-10 — Equipamento pertence a um cliente.** Um equipamento não é transferido entre
clientes; se mudou de dono, cadastra-se novo equipamento referenciando o anterior
(`substitui_id`), preservando o histórico.

## 3. Tela de cliente (web)

```
┌──────────────────────────────────────────────────────────┐
│ #1042  ACME COMÉRCIO LTDA          [PJ]  ● Ativo         │
│ CNPJ 12.345.678/0001-90   IE 123456789                   │
├──────────────────────────────────────────────────────────┤
│ Dados │ Endereços │ Contatos │ Equipamentos │ Histórico   │
├──────────────────────────────────────────────────────────┤
│  Em aberto: R$ 2.480,00   │  Vencido: R$ 380,00 ⚠        │
│  OS abertas: 2            │  Última OS: 12/08/2026        │
└──────────────────────────────────────────────────────────┘
```

A aba **Histórico** é uma linha do tempo unificada (OS, NF, títulos, baixas) ordenada por
data — é a tela que o atendente usa quando o cliente liga perguntando "e aquele serviço?".

## 4. Validações de entrada

| Campo | Regra |
|---|---|
| `nome` | 3–150 caracteres, obrigatório |
| `documento` | CPF (11) ou CNPJ (14) válido; opcional |
| `email` | RFC 5322; opcional; único não exigido |
| `telefone`/`celular` | 10–11 dígitos (BR); pelo menos um obrigatório |
| `cep` | 8 dígitos; preenchimento automático via consulta de CEP (cache local) |
| `uf` | Uma das 27 siglas |
| `limite_credito` | ≥ 0 |

## 5. Critérios de aceite (MVP)

- [ ] Cadastrar PF e PJ com validação de documento e mensagem clara em duplicidade.
- [ ] Buscar cliente por nome parcial, documento com ou sem máscara e telefone, em < 300 ms.
- [ ] Cadastrar múltiplos endereços mantendo exatamente um principal.
- [ ] Cadastrar equipamentos e visualizar todas as OS daquele equipamento.
- [ ] Aba Histórico mostrando OS, NF e títulos do cliente com totais em aberto e vencido.
- [ ] Inativar cliente com vínculos, sem perder histórico; tentativa de excluir retorna 409.
- [ ] Cliente bloqueado impede abertura de OS, com liberação registrada em auditoria.
