export interface Detalhe {
  campo: string;
  mensagem: string;
}

/** Erro de negócio é tipado, com código do catálogo do doc 08. */
export class ErroDeNegocio extends Error {
  constructor(
    readonly codigo: string,
    mensagem: string,
    readonly status = 422,
    readonly detalhes: Detalhe[] = [],
  ) {
    super(mensagem);
    this.name = 'ErroDeNegocio';
  }
}

export class NaoEncontradoError extends ErroDeNegocio {
  constructor(entidade: string, id: string) {
    super('NAO_ENCONTRADO', `${entidade} não encontrado(a).`, 404, [{ campo: 'id', mensagem: id }]);
  }
}

export class ConflitoError extends ErroDeNegocio {
  constructor(codigo: string, mensagem: string, detalhes: Detalhe[] = []) {
    super(codigo, mensagem, 409, detalhes);
  }
}

export class SaldoInsuficienteError extends ErroDeNegocio {
  constructor(sku: string, disponivel: string, solicitado: string) {
    super('SALDO_INSUFICIENTE', `Saldo insuficiente para o produto ${sku}.`, 422, [
      { campo: 'quantidade', mensagem: `Disponível: ${disponivel}, solicitado: ${solicitado}` },
    ]);
  }
}
