import type { PapelUsuario } from '@technolife/contracts';

export interface UsuarioSessao {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
}

const CHAVE_ACCESS_TOKEN = 'technolife.accessToken';
const CHAVE_REFRESH_TOKEN = 'technolife.refreshToken';
const CHAVE_USUARIO = 'technolife.usuario';

// Guarda de sessão simples via localStorage (doc 09: token no header Authorization,
// não em cookie). Roda só no client — cada função checa `typeof window` porque
// componentes de servidor podem importar este módulo sem executar isso.

export function salvarSessao(dados: {
  accessToken: string;
  refreshToken: string;
  usuario: UsuarioSessao;
}): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CHAVE_ACCESS_TOKEN, dados.accessToken);
  localStorage.setItem(CHAVE_REFRESH_TOKEN, dados.refreshToken);
  localStorage.setItem(CHAVE_USUARIO, JSON.stringify(dados.usuario));
}

export function limparSessao(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CHAVE_ACCESS_TOKEN);
  localStorage.removeItem(CHAVE_REFRESH_TOKEN);
  localStorage.removeItem(CHAVE_USUARIO);
}

export function obterAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CHAVE_ACCESS_TOKEN);
}

export function obterRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(CHAVE_REFRESH_TOKEN);
}

export function obterUsuarioSessao(): UsuarioSessao | null {
  if (typeof window === 'undefined') return null;
  const bruto = localStorage.getItem(CHAVE_USUARIO);
  if (!bruto) return null;
  try {
    return JSON.parse(bruto) as UsuarioSessao;
  } catch {
    return null;
  }
}

export function estaAutenticado(): boolean {
  return obterAccessToken() !== null;
}
