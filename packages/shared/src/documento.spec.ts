import { describe, expect, it } from 'vitest';
import { validarCnpj, validarCpf, validarDocumento } from './documento.js';

describe('validarCpf', () => {
  it('aceita CPF válido', () => {
    expect(validarCpf('529.982.247-25')).toBe(true);
  });

  it('rejeita CPF com dígitos repetidos', () => {
    expect(validarCpf('111.111.111-11')).toBe(false);
  });

  it('rejeita CPF com dígito verificador incorreto', () => {
    expect(validarCpf('529.982.247-26')).toBe(false);
  });
});

describe('validarCnpj', () => {
  it('aceita CNPJ válido', () => {
    expect(validarCnpj('11.222.333/0001-81')).toBe(true);
  });

  it('rejeita CNPJ com dígito verificador incorreto', () => {
    expect(validarCnpj('11.222.333/0001-82')).toBe(false);
  });
});

describe('validarDocumento', () => {
  it('roteia por tamanho de dígitos', () => {
    expect(validarDocumento('529.982.247-25')).toBe(true);
    expect(validarDocumento('11.222.333/0001-81')).toBe(true);
    expect(validarDocumento('123')).toBe(false);
  });
});
