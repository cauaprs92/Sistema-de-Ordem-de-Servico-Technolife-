# 09 — Segurança e Permissões

## 1. Autenticação

| Item | Decisão |
|---|---|
| Hash de senha | **Argon2id** (`memoryCost: 19456`, `timeCost: 2`, `parallelism: 1`) |
| Política de senha | Mínimo 10 caracteres; bloqueio das 10 mil senhas mais comuns; sem exigência de troca periódica (recomendação do NIST) |
| Access token | JWT HS256, **15 minutos**, claims: `sub`, `papel`, `nome`, `jti` |
| Refresh token | Opaco, **7 dias**, armazenado com hash, **rotativo**; reutilização de token já usado revoga toda a família (detecção de roubo) |
| Tentativas de login | 5 falhas → bloqueio progressivo (1 min, 5 min, 15 min) por e-mail + IP |
| Logout | Revoga o refresh token; access token expira sozinho |
| Sessões | Usuário vê e revoga sessões ativas em "Meu perfil" |

Segredos (`JWT_SECRET`, `DATABASE_URL`, credenciais do provedor fiscal) vêm de variáveis de
ambiente validadas com Zod no boot. Nada de segredo em repositório — `.env.example` sem valores.

## 2. Papéis

| Papel | Escopo |
|---|---|
| `ADMIN` | Acesso total, incluindo configuração, auditoria e estornos |
| `ATENDENTE` | Clientes, abertura e acompanhamento de OS, consulta de estoque |
| `TECNICO` | OS atribuídas a si, diagnóstico, itens, apontamentos, consulta de estoque |
| `FINANCEIRO` | Financeiro completo, notas fiscais, faturamento, leitura de OS e clientes |
| `ESTOQUE` | Produtos, movimentos, fornecedores, inventário |

Permissões são declaradas por rota. Modelo: **papel → conjunto de permissões**, com
permissões nomeadas por recurso e ação (`os:aprovar`, `financeiro:estornar`).
Um usuário tem um papel; permissões extras pontuais são possíveis via
`usuario_permissoes` (aditivas), para o caso "o técnico X também dá entrada no estoque".

## 3. Matriz de permissões

Legenda: **C** criar · **L** ler · **A** atualizar · **X** excluir/cancelar · **—** sem acesso

| Recurso | ADMIN | ATENDENTE | TECNICO | FINANCEIRO | ESTOQUE |
|---|---|---|---|---|---|
| Clientes | CLAX | CLA | L | L | L |
| Bloquear cliente | ✔ | — | — | ✔ | — |
| Equipamentos | CLAX | CLA | CLA | L | — |
| Produtos | CLAX | L | L | L | CLA |
| Movimentos de estoque | CLAX | L | L¹ | L | CLA |
| Ajuste / perda | ✔ | — | — | — | ✔ |
| Inventário | ✔ | — | — | — | ✔ |
| Fornecedores | CLAX | L | — | L | CLA |
| OS — abrir | ✔ | ✔ | — | — | — |
| OS — ler | todas | todas | **só as suas** | todas | — |
| OS — itens | ✔ | ✔ | ✔ (suas) | — | — |
| OS — aprovar/reprovar | ✔ | ✔ | — | — | — |
| OS — desconto até o limite | ✔ | ✔ | — | — | — |
| OS — desconto acima do limite | ✔ | — | — | — | — |
| OS — cancelar | ✔ | ✔² | — | — | — |
| OS — faturar | ✔ | — | — | ✔ | — |
| OS — ver margem/custos | ✔ | — | — | ✔ | — |
| Notas fiscais | CLAX | L | — | CLA | — |
| NF — cancelar | ✔ | — | — | ✔ | — |
| Títulos | CLAX | L³ | — | CLA | — |
| Baixar título | ✔ | — | — | ✔ | — |
| Estornar baixa | ✔ | — | — | — | — |
| Contas financeiras | CLAX | — | — | CLA | — |
| Fechar caixa | ✔ | — | — | ✔ | — |
| Relatórios financeiros | ✔ | — | — | ✔ | — |
| Relatórios de estoque | ✔ | L | — | L | ✔ |
| Usuários | CLAX | — | — | — | — |
| Parâmetros do sistema | CLAX | — | — | L | — |
| Auditoria | L | — | — | — | — |

¹ Técnico vê o kardex, mas não cria movimento manual.
² Atendente cancela apenas OS antes de `APROVADA`.
³ Atendente vê apenas o resumo financeiro do cliente que está atendendo, não a carteira toda.

## 4. Implementação

```ts
// rota com permissão declarada
app.post('/ordens-servico/:id/aprovar', {
  preHandler: [autenticar, exigirPermissao('os:aprovar')],
  schema: aprovarOsSchema,
}, handler);
```

- **Escopo por dono**: onde a matriz diz "só as suas", o filtro é aplicado no *repository*,
  não no front. `TECNICO` que peça a OS de outro recebe `404` (não `403`) — não confirmar a
  existência de recursos fora do escopo.
- **Deny by default**: rota sem `exigirPermissao` explícita não sobe; um teste percorre o
  registro de rotas e falha se alguma estiver sem declaração.

## 5. Proteções da aplicação

| Vetor | Mitigação |
|---|---|
| SQL injection | Prisma parametrizado; `$queryRaw` só com template tag, revisado em PR |
| XSS | React escapa por padrão; `dangerouslySetInnerHTML` proibido por regra de lint |
| CSRF | Token no header `Authorization` (não em cookie); se adotar cookie, `SameSite=Strict` + token CSRF |
| Mass assignment | Zod com `.strict()`: campo não declarado no schema faz a requisição falhar |
| IDOR | Toda leitura por `id` valida o escopo do usuário no repository |
| Upload malicioso | Whitelist de MIME (jpeg, png, webp, pdf), máx. 10 MB, nome sanitizado, servido de domínio separado com `Content-Disposition: attachment` |
| Enumeração de usuários | Login e recuperação de senha respondem igual para e-mail existente ou não |
| Brute force | Rate limit por IP + bloqueio progressivo por conta |
| Headers | Helmet: HSTS, `X-Content-Type-Options`, `Referrer-Policy`, CSP restritiva |
| CORS | Whitelist explícita de origens; sem `*` em produção |
| Vazamento em log | Redação automática de `senha`, `token`, `cpf`, `cnpj`, `chaveAcesso` no logger |
| Dependências | `pnpm audit` no CI + Dependabot semanal |

## 6. Auditoria

Registrado obrigatoriamente:

- Login, logout, falha de login e alteração de senha.
- Criação, alteração e cancelamento de OS, NF e títulos.
- Toda mudança de status de OS e NF.
- Baixas e **estornos** (com motivo).
- Ajustes, perdas e inventários de estoque (com motivo).
- Descontos acima do limite e liberações de cliente bloqueado.
- Alteração de parâmetros do sistema, papéis e permissões.

Cada registro guarda antes/depois em `jsonb`, autor, IP, user-agent e `requestId`.
A tabela é append-only e consultável apenas por ADMIN. Retenção: 5 anos.

## 7. LGPD

| Princípio | Aplicação |
|---|---|
| Base legal | Execução de contrato (dados de clientes) e obrigação legal (dados fiscais) |
| Minimização | Não coletar dado sem uso definido (sem RG, sem estado civil, sem renda) |
| Retenção | Dados fiscais: 5 anos. Cadastro sem movimento: revisão anual |
| Direito de acesso | Export do cadastro e histórico em JSON/CSV (Fase 4) |
| Direito de exclusão | Anonimização (nome, documento, contato → hash), preservando os dados fiscais exigidos por lei |
| Segurança | TLS em trânsito, criptografia em repouso no banco gerenciado, acesso por papel |
| Incidentes | Procedimento documentado de notificação em até 72h |
