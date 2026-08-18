-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- CreateEnum
CREATE TYPE "PapelUsuario" AS ENUM ('ADMIN', 'ATENDENTE', 'TECNICO', 'FINANCEIRO', 'ESTOQUE');

-- CreateEnum
CREATE TYPE "TipoPessoa" AS ENUM ('FISICA', 'JURIDICA');

-- CreateEnum
CREATE TYPE "TipoEnderecoCliente" AS ENUM ('PRINCIPAL', 'COBRANCA', 'ENTREGA');

-- CreateEnum
CREATE TYPE "TipoProduto" AS ENUM ('PECA', 'INSUMO', 'REVENDA');

-- CreateEnum
CREATE TYPE "TipoMovimentoEstoque" AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'DEVOLUCAO', 'PERDA', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "OrigemMovimentoEstoque" AS ENUM ('COMPRA', 'ORDEM_SERVICO', 'VENDA', 'INVENTARIO', 'MANUAL', 'DEVOLUCAO_CLIENTE');

-- CreateEnum
CREATE TYPE "StatusReservaEstoque" AS ENUM ('ATIVA', 'CONSUMIDA', 'LIBERADA');

-- CreateEnum
CREATE TYPE "StatusInventario" AS ENUM ('ABERTO', 'FECHADO');

-- CreateEnum
CREATE TYPE "StatusOrdemServico" AS ENUM ('ABERTA', 'EM_DIAGNOSTICO', 'AGUARDANDO_APROVACAO', 'APROVADA', 'AGUARDANDO_PECA', 'EM_EXECUCAO', 'CONCLUIDA', 'ENTREGUE', 'FATURADA', 'REPROVADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "PrioridadeOrdemServico" AS ENUM ('BAIXA', 'NORMAL', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "TipoOrdemServico" AS ENUM ('MANUTENCAO', 'INSTALACAO', 'GARANTIA', 'ORCAMENTO');

-- CreateEnum
CREATE TYPE "TipoItemOs" AS ENUM ('PRODUTO', 'SERVICO');

-- CreateEnum
CREATE TYPE "TipoNotaFiscal" AS ENUM ('NFE', 'NFSE', 'NFCE');

-- CreateEnum
CREATE TYPE "FinalidadeNotaFiscal" AS ENUM ('NORMAL', 'COMPLEMENTAR', 'AJUSTE', 'DEVOLUCAO');

-- CreateEnum
CREATE TYPE "OperacaoNotaFiscal" AS ENUM ('SAIDA', 'ENTRADA');

-- CreateEnum
CREATE TYPE "StatusNotaFiscal" AS ENUM ('RASCUNHO', 'VALIDANDO', 'PROCESSANDO', 'AUTORIZADA', 'REJEITADA', 'ERRO_COMUNICACAO', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoEventoNotaFiscal" AS ENUM ('ENVIO', 'AUTORIZACAO', 'REJEICAO', 'CANCELAMENTO', 'CARTA_CORRECAO');

-- CreateEnum
CREATE TYPE "TipoCategoriaFinanceira" AS ENUM ('RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "TipoContaFinanceira" AS ENUM ('CAIXA', 'BANCO', 'CARTAO');

-- CreateEnum
CREATE TYPE "TipoTitulo" AS ENUM ('RECEBER', 'PAGAR');

-- CreateEnum
CREATE TYPE "StatusTitulo" AS ENUM ('ABERTO', 'PARCIAL', 'PAGO', 'VENCIDO', 'CANCELADO', 'RENEGOCIADO');

-- CreateEnum
CREATE TYPE "TipoMovimentoCaixa" AS ENUM ('CREDITO', 'DEBITO');

-- CreateEnum
CREATE TYPE "OrigemMovimentoCaixa" AS ENUM ('BAIXA', 'TRANSFERENCIA', 'AJUSTE');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(120) NOT NULL,
    "email" CITEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "papel" "PapelUsuario" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_login_em" TIMESTAMPTZ,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_permissoes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "permissao" VARCHAR(60) NOT NULL,
    "concedida_por_id" UUID,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_permissoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "familia_id" UUID NOT NULL,
    "expira_em" TIMESTAMPTZ NOT NULL,
    "revogado_em" TIMESTAMPTZ,
    "ip" INET,
    "user_agent" TEXT,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID,
    "entidade" VARCHAR(60) NOT NULL,
    "entidade_id" UUID NOT NULL,
    "acao" VARCHAR(40) NOT NULL,
    "dados_antes" JSONB,
    "dados_depois" JSONB,
    "ip" INET,
    "user_agent" TEXT,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parametros" (
    "chave" VARCHAR(80) NOT NULL,
    "valor" JSONB NOT NULL,

    CONSTRAINT "parametros_pkey" PRIMARY KEY ("chave")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "codigo" SERIAL NOT NULL,
    "tipo_pessoa" "TipoPessoa" NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "nome_fantasia" VARCHAR(150),
    "documento" VARCHAR(14),
    "inscricao_estadual" VARCHAR(20),
    "inscricao_municipal" VARCHAR(20),
    "email" CITEXT,
    "telefone" VARCHAR(20),
    "celular" VARCHAR(20),
    "observacoes" TEXT,
    "limite_credito" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "bloqueado" BOOLEAN NOT NULL DEFAULT false,
    "motivo_bloqueio" TEXT,
    "documento_pendente" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente_enderecos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cliente_id" UUID NOT NULL,
    "tipo" "TipoEnderecoCliente" NOT NULL,
    "cep" VARCHAR(8) NOT NULL,
    "logradouro" VARCHAR(150) NOT NULL,
    "numero" VARCHAR(20) NOT NULL,
    "complemento" VARCHAR(60),
    "bairro" VARCHAR(80) NOT NULL,
    "cidade" VARCHAR(80) NOT NULL,
    "uf" CHAR(2) NOT NULL,
    "codigo_ibge" VARCHAR(7),
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "cliente_enderecos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente_contatos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cliente_id" UUID NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "cargo" VARCHAR(80),
    "email" CITEXT,
    "telefone" VARCHAR(20),
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "cliente_contatos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipamentos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cliente_id" UUID NOT NULL,
    "tipo" VARCHAR(80) NOT NULL,
    "marca" VARCHAR(80),
    "modelo" VARCHAR(80),
    "numero_serie" VARCHAR(80),
    "identificador" VARCHAR(80),
    "acessorios" TEXT,
    "observacoes" TEXT,
    "substitui_id" UUID,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "equipamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_produto" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(80) NOT NULL,
    "pai_id" UUID,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_produto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fornecedores" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tipo_pessoa" "TipoPessoa" NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "nome_fantasia" VARCHAR(150),
    "documento" VARCHAR(14),
    "inscricao_estadual" VARCHAR(20),
    "email" CITEXT,
    "telefone" VARCHAR(20),
    "celular" VARCHAR(20),
    "cep" VARCHAR(8),
    "logradouro" VARCHAR(150),
    "numero" VARCHAR(20),
    "complemento" VARCHAR(60),
    "bairro" VARCHAR(80),
    "cidade" VARCHAR(80),
    "uf" CHAR(2),
    "codigo_ibge" VARCHAR(7),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sku" VARCHAR(40) NOT NULL,
    "codigo_barras" VARCHAR(20),
    "descricao" VARCHAR(200) NOT NULL,
    "categoria_id" UUID,
    "fornecedor_padrao_id" UUID,
    "unidade" VARCHAR(6) NOT NULL,
    "tipo" "TipoProduto" NOT NULL,
    "preco_custo_medio" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "preco_venda" DECIMAL(14,2) NOT NULL,
    "margem_padrao" DECIMAL(7,4),
    "saldo" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "saldo_reservado" DECIMAL(14,3) NOT NULL DEFAULT 0,
    "estoque_minimo" DECIMAL(14,3),
    "estoque_maximo" DECIMAL(14,3),
    "localizacao" VARCHAR(40),
    "ncm" VARCHAR(10),
    "cfop_padrao" VARCHAR(10),
    "cest" VARCHAR(10),
    "origem_fiscal" SMALLINT,
    "controla_estoque" BOOLEAN NOT NULL DEFAULT true,
    "permite_negativo" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentos_estoque" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "produto_id" UUID NOT NULL,
    "tipo" "TipoMovimentoEstoque" NOT NULL,
    "origem" "OrigemMovimentoEstoque" NOT NULL,
    "origem_id" UUID,
    "quantidade" DECIMAL(14,3) NOT NULL,
    "custo_unitario" DECIMAL(14,4),
    "saldo_apos" DECIMAL(14,3) NOT NULL,
    "custo_medio_apos" DECIMAL(14,4) NOT NULL,
    "documento" VARCHAR(60),
    "motivo" TEXT,
    "usuario_id" UUID NOT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentos_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas_estoque" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "produto_id" UUID NOT NULL,
    "ordem_servico_id" UUID NOT NULL,
    "quantidade" DECIMAL(14,3) NOT NULL,
    "status" "StatusReservaEstoque" NOT NULL DEFAULT 'ATIVA',
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservas_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventarios" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "data" DATE NOT NULL,
    "status" "StatusInventario" NOT NULL DEFAULT 'ABERTO',
    "responsavel_id" UUID NOT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventario_itens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "inventario_id" UUID NOT NULL,
    "produto_id" UUID NOT NULL,
    "saldo_sistema" DECIMAL(14,3) NOT NULL,
    "saldo_contado" DECIMAL(14,3) NOT NULL,
    "diferenca" DECIMAL(14,3) NOT NULL,
    "movimento_gerado_id" UUID,

    CONSTRAINT "inventario_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "codigo" VARCHAR(30) NOT NULL,
    "descricao" VARCHAR(200) NOT NULL,
    "preco" DECIMAL(14,2) NOT NULL,
    "tempo_estimado_min" INTEGER,
    "codigo_servico_municipal" VARCHAR(20),
    "aliquota_iss" DECIMAL(7,4),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "servicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordens_servico" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "numero" SERIAL NOT NULL,
    "cliente_id" UUID NOT NULL,
    "equipamento_id" UUID,
    "tecnico_id" UUID,
    "aberta_por_id" UUID NOT NULL,
    "status" "StatusOrdemServico" NOT NULL DEFAULT 'ABERTA',
    "prioridade" "PrioridadeOrdemServico" NOT NULL DEFAULT 'NORMAL',
    "tipo" "TipoOrdemServico" NOT NULL,
    "descricao_problema" TEXT NOT NULL,
    "diagnostico" TEXT,
    "solucao" TEXT,
    "valor_produtos" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valor_servicos" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "desconto" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "acrescimo" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valor_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "garantia_dias" INTEGER,
    "previsao_entrega" TIMESTAMPTZ,
    "aprovada_em" TIMESTAMPTZ,
    "aprovada_por" VARCHAR(120),
    "finalizada_em" TIMESTAMPTZ,
    "cancelada_em" TIMESTAMPTZ,
    "motivo_cancelamento" TEXT,
    "os_origem_id" UUID,
    "observacoes_internas" TEXT,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ordens_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_itens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ordem_servico_id" UUID NOT NULL,
    "tipo" "TipoItemOs" NOT NULL,
    "produto_id" UUID,
    "servico_id" UUID,
    "descricao" VARCHAR(200) NOT NULL,
    "quantidade" DECIMAL(14,3) NOT NULL,
    "preco_unitario" DECIMAL(14,2) NOT NULL,
    "desconto" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valor_total" DECIMAL(14,2) NOT NULL,
    "custo_unitario" DECIMAL(14,4),
    "baixado_estoque" BOOLEAN NOT NULL DEFAULT false,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "os_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_apontamentos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ordem_servico_id" UUID NOT NULL,
    "tecnico_id" UUID NOT NULL,
    "inicio" TIMESTAMPTZ NOT NULL,
    "fim" TIMESTAMPTZ,
    "descricao" TEXT,
    "faturavel" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "os_apontamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_historico" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ordem_servico_id" UUID NOT NULL,
    "status_anterior" "StatusOrdemServico",
    "status_novo" "StatusOrdemServico" NOT NULL,
    "usuario_id" UUID NOT NULL,
    "observacao" TEXT,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "os_historico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_anexos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ordem_servico_id" UUID NOT NULL,
    "nome" VARCHAR(150) NOT NULL,
    "caminho" TEXT NOT NULL,
    "mime" VARCHAR(100) NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "usuario_id" UUID NOT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "os_anexos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notas_fiscais" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tipo" "TipoNotaFiscal" NOT NULL,
    "finalidade" "FinalidadeNotaFiscal" NOT NULL DEFAULT 'NORMAL',
    "operacao" "OperacaoNotaFiscal" NOT NULL,
    "numero" INTEGER,
    "serie" INTEGER,
    "chave_acesso" CHAR(44),
    "status" "StatusNotaFiscal" NOT NULL DEFAULT 'RASCUNHO',
    "cliente_id" UUID,
    "ordem_servico_id" UUID,
    "natureza_operacao" VARCHAR(60),
    "data_emissao" TIMESTAMPTZ,
    "data_autorizacao" TIMESTAMPTZ,
    "valor_produtos" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valor_servicos" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valor_desconto" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valor_frete" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valor_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "base_icms" DECIMAL(14,2),
    "valor_icms" DECIMAL(14,2),
    "valor_ipi" DECIMAL(14,2),
    "valor_pis" DECIMAL(14,2),
    "valor_cofins" DECIMAL(14,2),
    "valor_iss" DECIMAL(14,2),
    "provedor" VARCHAR(30),
    "provedor_ref" VARCHAR(80),
    "protocolo" VARCHAR(30),
    "motivo_rejeicao" TEXT,
    "xml_caminho" TEXT,
    "pdf_caminho" TEXT,
    "payload_envio" JSONB,
    "payload_retorno" JSONB,
    "cancelada_em" TIMESTAMPTZ,
    "motivo_cancelamento" TEXT,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "notas_fiscais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nota_fiscal_itens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nota_fiscal_id" UUID NOT NULL,
    "numero_item" INTEGER NOT NULL,
    "produto_id" UUID,
    "servico_id" UUID,
    "descricao" VARCHAR(200) NOT NULL,
    "ncm" VARCHAR(10),
    "cfop" VARCHAR(10),
    "cst_icms" VARCHAR(10),
    "unidade" VARCHAR(6) NOT NULL,
    "quantidade" DECIMAL(14,3) NOT NULL,
    "valor_unitario" DECIMAL(14,2) NOT NULL,
    "valor_total" DECIMAL(14,2) NOT NULL,
    "valor_desconto" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "base_icms" DECIMAL(14,2),
    "aliquota_icms" DECIMAL(7,4),
    "valor_icms" DECIMAL(14,2),
    "aliquota_iss" DECIMAL(7,4),
    "valor_iss" DECIMAL(14,2),

    CONSTRAINT "nota_fiscal_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nota_fiscal_eventos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nota_fiscal_id" UUID NOT NULL,
    "tipo" "TipoEventoNotaFiscal" NOT NULL,
    "protocolo" VARCHAR(30),
    "mensagem" TEXT,
    "payload" JSONB,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nota_fiscal_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_financeiras" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(80) NOT NULL,
    "tipo" "TipoCategoriaFinanceira" NOT NULL,
    "pai_id" UUID,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categorias_financeiras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas_financeiras" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(80) NOT NULL,
    "tipo" "TipoContaFinanceira" NOT NULL,
    "banco" VARCHAR(80),
    "agencia" VARCHAR(20),
    "conta" VARCHAR(20),
    "saldo_inicial" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "saldo_atual" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "contas_financeiras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "formas_pagamento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" VARCHAR(60) NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "prazo_compensacao_dias" INTEGER NOT NULL DEFAULT 0,
    "taxa_percentual" DECIMAL(7,4) NOT NULL DEFAULT 0,
    "conta_padrao_id" UUID,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "formas_pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "titulos" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tipo" "TipoTitulo" NOT NULL,
    "numero" VARCHAR(30) NOT NULL,
    "cliente_id" UUID,
    "fornecedor_id" UUID,
    "ordem_servico_id" UUID,
    "nota_fiscal_id" UUID,
    "categoria_id" UUID NOT NULL,
    "descricao" VARCHAR(200) NOT NULL,
    "parcela" SMALLINT,
    "total_parcelas" SMALLINT,
    "valor_original" DECIMAL(14,2) NOT NULL,
    "valor_desconto" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valor_juros" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valor_multa" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valor_pago" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "valor_saldo" DECIMAL(14,2) NOT NULL,
    "data_emissao" DATE NOT NULL,
    "data_vencimento" DATE NOT NULL,
    "data_competencia" DATE NOT NULL,
    "status" "StatusTitulo" NOT NULL DEFAULT 'ABERTO',
    "forma_pagamento_id" UUID,
    "titulo_origem_id" UUID,
    "motivo_cancelamento" TEXT,
    "observacoes" TEXT,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "titulos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baixas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "titulo_id" UUID NOT NULL,
    "data_pagamento" DATE NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,
    "juros" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "multa" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "desconto" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "forma_pagamento_id" UUID NOT NULL,
    "conta_financeira_id" UUID NOT NULL,
    "observacao" TEXT,
    "usuario_id" UUID NOT NULL,
    "estornada_em" TIMESTAMPTZ,
    "motivo_estorno" TEXT,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "baixas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentos_caixa" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conta_financeira_id" UUID NOT NULL,
    "tipo" "TipoMovimentoCaixa" NOT NULL,
    "valor" DECIMAL(14,2) NOT NULL,
    "data" DATE NOT NULL,
    "origem" "OrigemMovimentoCaixa" NOT NULL,
    "origem_id" UUID,
    "baixa_id" UUID,
    "saldo_apos" DECIMAL(14,2) NOT NULL,
    "descricao" TEXT,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentos_caixa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "refresh_tokens_familia_id_idx" ON "refresh_tokens"("familia_id");

-- CreateIndex
CREATE INDEX "auditoria_entidade_entidade_id_idx" ON "auditoria"("entidade", "entidade_id");

-- CreateIndex
CREATE INDEX "clientes_documento_idx" ON "clientes"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_codigo_key" ON "clientes"("codigo");

-- CreateIndex
CREATE INDEX "cliente_enderecos_cliente_id_idx" ON "cliente_enderecos"("cliente_id");

-- CreateIndex
CREATE INDEX "cliente_contatos_cliente_id_idx" ON "cliente_contatos"("cliente_id");

-- CreateIndex
CREATE INDEX "equipamentos_cliente_id_numero_serie_idx" ON "equipamentos"("cliente_id", "numero_serie");

-- CreateIndex
CREATE INDEX "fornecedores_documento_idx" ON "fornecedores"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_sku_key" ON "produtos"("sku");

-- CreateIndex
CREATE INDEX "movimentos_estoque_produto_id_criado_em_idx" ON "movimentos_estoque"("produto_id", "criado_em");

-- CreateIndex
CREATE INDEX "movimentos_estoque_origem_origem_id_idx" ON "movimentos_estoque"("origem", "origem_id");

-- CreateIndex
CREATE INDEX "reservas_estoque_produto_id_idx" ON "reservas_estoque"("produto_id");

-- CreateIndex
CREATE INDEX "reservas_estoque_ordem_servico_id_idx" ON "reservas_estoque"("ordem_servico_id");

-- CreateIndex
CREATE INDEX "inventario_itens_inventario_id_idx" ON "inventario_itens"("inventario_id");

-- CreateIndex
CREATE UNIQUE INDEX "ordens_servico_numero_key" ON "ordens_servico"("numero");

-- CreateIndex
CREATE INDEX "ordens_servico_status_idx" ON "ordens_servico"("status");

-- CreateIndex
CREATE INDEX "ordens_servico_cliente_id_idx" ON "ordens_servico"("cliente_id");

-- CreateIndex
CREATE INDEX "os_itens_ordem_servico_id_idx" ON "os_itens"("ordem_servico_id");

-- CreateIndex
CREATE INDEX "os_apontamentos_ordem_servico_id_idx" ON "os_apontamentos"("ordem_servico_id");

-- CreateIndex
CREATE INDEX "os_historico_ordem_servico_id_idx" ON "os_historico"("ordem_servico_id");

-- CreateIndex
CREATE INDEX "os_anexos_ordem_servico_id_idx" ON "os_anexos"("ordem_servico_id");

-- CreateIndex
CREATE UNIQUE INDEX "notas_fiscais_chave_acesso_key" ON "notas_fiscais"("chave_acesso");

-- CreateIndex
CREATE INDEX "notas_fiscais_status_idx" ON "notas_fiscais"("status");

-- CreateIndex
CREATE INDEX "notas_fiscais_ordem_servico_id_idx" ON "notas_fiscais"("ordem_servico_id");

-- CreateIndex
CREATE INDEX "nota_fiscal_itens_nota_fiscal_id_idx" ON "nota_fiscal_itens"("nota_fiscal_id");

-- CreateIndex
CREATE INDEX "nota_fiscal_eventos_nota_fiscal_id_idx" ON "nota_fiscal_eventos"("nota_fiscal_id");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_financeiras_nome_key" ON "categorias_financeiras"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "contas_financeiras_nome_key" ON "contas_financeiras"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "formas_pagamento_nome_key" ON "formas_pagamento"("nome");

-- CreateIndex
CREATE INDEX "titulos_tipo_status_data_vencimento_idx" ON "titulos"("tipo", "status", "data_vencimento");

-- CreateIndex
CREATE INDEX "titulos_cliente_id_idx" ON "titulos"("cliente_id");

-- CreateIndex
CREATE INDEX "titulos_ordem_servico_id_idx" ON "titulos"("ordem_servico_id");

-- CreateIndex
CREATE INDEX "baixas_titulo_id_idx" ON "baixas"("titulo_id");

-- CreateIndex
CREATE UNIQUE INDEX "movimentos_caixa_baixa_id_key" ON "movimentos_caixa"("baixa_id");

-- CreateIndex
CREATE INDEX "movimentos_caixa_conta_financeira_id_data_idx" ON "movimentos_caixa"("conta_financeira_id", "data");

-- AddForeignKey
ALTER TABLE "usuario_permissoes" ADD CONSTRAINT "usuario_permissoes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente_enderecos" ADD CONSTRAINT "cliente_enderecos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente_contatos" ADD CONSTRAINT "cliente_contatos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipamentos" ADD CONSTRAINT "equipamentos_substitui_id_fkey" FOREIGN KEY ("substitui_id") REFERENCES "equipamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias_produto" ADD CONSTRAINT "categorias_produto_pai_id_fkey" FOREIGN KEY ("pai_id") REFERENCES "categorias_produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_fornecedor_padrao_id_fkey" FOREIGN KEY ("fornecedor_padrao_id") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_estoque" ADD CONSTRAINT "movimentos_estoque_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_estoque" ADD CONSTRAINT "movimentos_estoque_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_estoque" ADD CONSTRAINT "reservas_estoque_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_estoque" ADD CONSTRAINT "reservas_estoque_ordem_servico_id_fkey" FOREIGN KEY ("ordem_servico_id") REFERENCES "ordens_servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventarios" ADD CONSTRAINT "inventarios_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_itens" ADD CONSTRAINT "inventario_itens_inventario_id_fkey" FOREIGN KEY ("inventario_id") REFERENCES "inventarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_itens" ADD CONSTRAINT "inventario_itens_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_itens" ADD CONSTRAINT "inventario_itens_movimento_gerado_id_fkey" FOREIGN KEY ("movimento_gerado_id") REFERENCES "movimentos_estoque"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_aberta_por_id_fkey" FOREIGN KEY ("aberta_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_os_origem_id_fkey" FOREIGN KEY ("os_origem_id") REFERENCES "ordens_servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_itens" ADD CONSTRAINT "os_itens_ordem_servico_id_fkey" FOREIGN KEY ("ordem_servico_id") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_itens" ADD CONSTRAINT "os_itens_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_itens" ADD CONSTRAINT "os_itens_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_apontamentos" ADD CONSTRAINT "os_apontamentos_ordem_servico_id_fkey" FOREIGN KEY ("ordem_servico_id") REFERENCES "ordens_servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_apontamentos" ADD CONSTRAINT "os_apontamentos_tecnico_id_fkey" FOREIGN KEY ("tecnico_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_historico" ADD CONSTRAINT "os_historico_ordem_servico_id_fkey" FOREIGN KEY ("ordem_servico_id") REFERENCES "ordens_servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_historico" ADD CONSTRAINT "os_historico_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_anexos" ADD CONSTRAINT "os_anexos_ordem_servico_id_fkey" FOREIGN KEY ("ordem_servico_id") REFERENCES "ordens_servico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "os_anexos" ADD CONSTRAINT "os_anexos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notas_fiscais" ADD CONSTRAINT "notas_fiscais_ordem_servico_id_fkey" FOREIGN KEY ("ordem_servico_id") REFERENCES "ordens_servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_fiscal_itens" ADD CONSTRAINT "nota_fiscal_itens_nota_fiscal_id_fkey" FOREIGN KEY ("nota_fiscal_id") REFERENCES "notas_fiscais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_fiscal_itens" ADD CONSTRAINT "nota_fiscal_itens_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_fiscal_itens" ADD CONSTRAINT "nota_fiscal_itens_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nota_fiscal_eventos" ADD CONSTRAINT "nota_fiscal_eventos_nota_fiscal_id_fkey" FOREIGN KEY ("nota_fiscal_id") REFERENCES "notas_fiscais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorias_financeiras" ADD CONSTRAINT "categorias_financeiras_pai_id_fkey" FOREIGN KEY ("pai_id") REFERENCES "categorias_financeiras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "formas_pagamento" ADD CONSTRAINT "formas_pagamento_conta_padrao_id_fkey" FOREIGN KEY ("conta_padrao_id") REFERENCES "contas_financeiras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titulos" ADD CONSTRAINT "titulos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titulos" ADD CONSTRAINT "titulos_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titulos" ADD CONSTRAINT "titulos_ordem_servico_id_fkey" FOREIGN KEY ("ordem_servico_id") REFERENCES "ordens_servico"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titulos" ADD CONSTRAINT "titulos_nota_fiscal_id_fkey" FOREIGN KEY ("nota_fiscal_id") REFERENCES "notas_fiscais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titulos" ADD CONSTRAINT "titulos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_financeiras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titulos" ADD CONSTRAINT "titulos_forma_pagamento_id_fkey" FOREIGN KEY ("forma_pagamento_id") REFERENCES "formas_pagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "titulos" ADD CONSTRAINT "titulos_titulo_origem_id_fkey" FOREIGN KEY ("titulo_origem_id") REFERENCES "titulos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baixas" ADD CONSTRAINT "baixas_titulo_id_fkey" FOREIGN KEY ("titulo_id") REFERENCES "titulos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baixas" ADD CONSTRAINT "baixas_forma_pagamento_id_fkey" FOREIGN KEY ("forma_pagamento_id") REFERENCES "formas_pagamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baixas" ADD CONSTRAINT "baixas_conta_financeira_id_fkey" FOREIGN KEY ("conta_financeira_id") REFERENCES "contas_financeiras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baixas" ADD CONSTRAINT "baixas_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_caixa" ADD CONSTRAINT "movimentos_caixa_conta_financeira_id_fkey" FOREIGN KEY ("conta_financeira_id") REFERENCES "contas_financeiras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_caixa" ADD CONSTRAINT "movimentos_caixa_baixa_id_fkey" FOREIGN KEY ("baixa_id") REFERENCES "baixas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
