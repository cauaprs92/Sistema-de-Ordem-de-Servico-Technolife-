import { Decimal } from 'decimal.js';

/**
 * Regra absoluta do projeto (doc 11): dinheiro nunca em `number`.
 * Toda soma/multiplicação de valores monetários passa por aqui.
 */

export type ValorMonetario = string | number | Decimal;

export function paraDecimal(valor: ValorMonetario): Decimal {
  return new Decimal(valor);
}

export function somarValores(valores: ValorMonetario[]): Decimal {
  return valores.reduce<Decimal>((total, valor) => total.plus(paraDecimal(valor)), new Decimal(0));
}

/** Arredondamento só na apresentação, ROUND_HALF_UP — nunca durante o cálculo. */
export function formatarMoeda(valor: ValorMonetario): string {
  return paraDecimal(valor).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

/**
 * Divide um total em N parcelas iguais; a diferença de arredondamento vai
 * para a última parcela (RN-FIN-02). Invariante: soma das partes === total.
 */
export function distribuirCentavos(total: ValorMonetario, partes: number): string[] {
  if (!Number.isInteger(partes) || partes <= 0) {
    throw new Error('Número de partes deve ser um inteiro maior que zero.');
  }

  const totalDecimal = paraDecimal(total);
  const valorBase = totalDecimal.dividedBy(partes).toDecimalPlaces(2, Decimal.ROUND_DOWN);
  const somaBase = valorBase.times(partes);
  const diferenca = totalDecimal.minus(somaBase);

  const resultado = new Array<string>(partes).fill(valorBase.toFixed(2));
  resultado[partes - 1] = valorBase.plus(diferenca).toFixed(2);
  return resultado;
}
