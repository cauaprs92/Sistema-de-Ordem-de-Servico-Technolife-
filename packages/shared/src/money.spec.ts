import { describe, expect, it } from 'vitest';
import { distribuirCentavos, formatarMoeda, somarValores } from './money.js';

describe('distribuirCentavos', () => {
  it('distribui 100,00 em 3x com a diferença na última parcela', () => {
    expect(distribuirCentavos('100.00', 3)).toEqual(['33.33', '33.33', '33.34']);
  });

  it('distribui 999,99 em 7x mantendo a soma exata', () => {
    const partes = distribuirCentavos('999.99', 7);
    const soma = somarValores(partes);
    expect(formatarMoeda(soma)).toBe('999.99');
  });

  it('rejeita número de partes inválido', () => {
    expect(() => distribuirCentavos('10.00', 0)).toThrow();
  });
});

describe('somarValores', () => {
  it('soma valores decimais sem erro de ponto flutuante', () => {
    expect(formatarMoeda(somarValores(['0.10', '0.20']))).toBe('0.30');
  });
});
