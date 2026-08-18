import { obterAccessToken } from './auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333/v1';

// Erro tipado espelhando o envelope de erro da API (doc 08, §2) — o front reage
// ao `codigo` (estável), mostra a `mensagem` (para o humano).
export class ApiError extends Error {
  constructor(
    readonly codigo: string,
    mensagem: string,
    readonly status: number,
  ) {
    super(mensagem);
    this.name = 'ApiError';
  }
}

interface OpcoesRequisicao extends RequestInit {
  /** false para rotas públicas (ex.: login) — não envia Authorization. Default: true. */
  autenticado?: boolean;
}

export async function apiFetch<T>(caminho: string, opcoes: OpcoesRequisicao = {}): Promise<T> {
  const { autenticado = true, headers, ...resto } = opcoes;

  const headersFinal: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string> | undefined),
  };

  if (autenticado) {
    const token = obterAccessToken();
    if (token) headersFinal.Authorization = `Bearer ${token}`;
  }

  const resposta = await fetch(`${BASE_URL}${caminho}`, { ...resto, headers: headersFinal });

  if (resposta.status === 204) {
    return undefined as T;
  }

  const corpo: unknown = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const envelope = corpo as { erro?: { codigo?: string; mensagem?: string } } | null;
    throw new ApiError(
      envelope?.erro?.codigo ?? 'ERRO_DESCONHECIDO',
      envelope?.erro?.mensagem ?? 'Erro ao comunicar com o servidor.',
      resposta.status,
    );
  }

  return corpo as T;
}
