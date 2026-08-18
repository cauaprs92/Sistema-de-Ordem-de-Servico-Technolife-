export interface ParametrosPaginacao {
  pagina: number;
  porPagina: number;
}

export interface MetaPaginacao {
  pagina: number;
  porPagina: number;
  total: number;
  totalPaginas: number;
}

export function calcularMeta(total: number, { pagina, porPagina }: ParametrosPaginacao): MetaPaginacao {
  return {
    pagina,
    porPagina,
    total,
    totalPaginas: Math.max(1, Math.ceil(total / porPagina)),
  };
}

export function paraSkipTake({ pagina, porPagina }: ParametrosPaginacao): { skip: number; take: number } {
  return { skip: (pagina - 1) * porPagina, take: porPagina };
}
