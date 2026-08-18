import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await argon2.hash('technoloife@123', {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  await prisma.usuario.upsert({
    where: { email: 'admin@technoloife.com.br' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@technoloife.com.br',
      senhaHash,
      papel: 'ADMIN',
    },
  });

  const parametros: Array<{ chave: string; valor: unknown }> = [
    { chave: 'dias_bloqueio_inadimplencia', valor: 30 },
    { chave: 'desconto_maximo_atendente', valor: 10 },
    { chave: 'garantia_padrao_dias', valor: 90 },
    { chave: 'juros_mes_percentual', valor: 1 },
    { chave: 'multa_atraso_percentual', valor: 2 },
  ];
  for (const parametro of parametros) {
    await prisma.parametro.upsert({
      where: { chave: parametro.chave },
      update: {},
      create: parametro,
    });
  }

  const categoriasFinanceiras: Array<{ nome: string; tipo: 'RECEITA' | 'DESPESA' }> = [
    { nome: 'Serviços', tipo: 'RECEITA' },
    { nome: 'Venda de peças', tipo: 'RECEITA' },
    { nome: 'Fornecedores', tipo: 'DESPESA' },
    { nome: 'Aluguel', tipo: 'DESPESA' },
    { nome: 'Folha', tipo: 'DESPESA' },
    { nome: 'Impostos', tipo: 'DESPESA' },
    { nome: 'Taxas de cartão', tipo: 'DESPESA' },
  ];
  for (const categoria of categoriasFinanceiras) {
    await prisma.categoriaFinanceira.upsert({
      where: { nome: categoria.nome },
      update: {},
      create: categoria,
    });
  }

  const caixa = await prisma.contaFinanceira.upsert({
    where: { nome: 'Caixa' },
    update: {},
    create: { nome: 'Caixa', tipo: 'CAIXA', saldoInicial: 0, saldoAtual: 0 },
  });

  const formasPagamento = [
    { nome: 'Dinheiro', tipo: 'DINHEIRO', prazoCompensacaoDias: 0, taxaPercentual: 0 },
    { nome: 'Pix', tipo: 'PIX', prazoCompensacaoDias: 0, taxaPercentual: 0 },
    { nome: 'Débito', tipo: 'DEBITO', prazoCompensacaoDias: 1, taxaPercentual: 0 },
    { nome: 'Crédito', tipo: 'CREDITO', prazoCompensacaoDias: 30, taxaPercentual: 3.5 },
    { nome: 'Boleto', tipo: 'BOLETO', prazoCompensacaoDias: 2, taxaPercentual: 0 },
    { nome: 'Transferência', tipo: 'TRANSFERENCIA', prazoCompensacaoDias: 0, taxaPercentual: 0 },
  ];
  for (const forma of formasPagamento) {
    await prisma.formaPagamento.upsert({
      where: { nome: forma.nome },
      update: {},
      create: { ...forma, contaPadraoId: caixa.id },
    });
  }

  const categoriaAcessorios = await prisma.categoriaProduto.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      nome: 'Peças e acessórios',
    },
  });

  console.log('Seed concluído.');
  console.log('  Admin: admin@technoloife.com.br / technoloife@123');
  console.log(`  Categoria de produto padrão: ${categoriaAcessorios.nome}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
