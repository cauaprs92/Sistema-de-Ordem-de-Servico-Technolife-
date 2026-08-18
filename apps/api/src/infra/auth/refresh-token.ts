import { createHash, randomBytes, randomUUID } from 'node:crypto';

// Refresh token é opaco (doc 09): um valor aleatório entregue ao cliente, e só o
// hash (sha256 — não Argon2, aqui não há custo de força bruta interativa a mitigar,
// só precisamos de uma busca rápida por igualdade) fica no banco.
export const REFRESH_TOKEN_DIAS = 7;

export function gerarRefreshToken(): string {
  return randomBytes(48).toString('base64url');
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function gerarFamiliaId(): string {
  return randomUUID();
}

export function calcularExpiracaoRefreshToken(): Date {
  const expiraEm = new Date();
  expiraEm.setDate(expiraEm.getDate() + REFRESH_TOKEN_DIAS);
  return expiraEm;
}
