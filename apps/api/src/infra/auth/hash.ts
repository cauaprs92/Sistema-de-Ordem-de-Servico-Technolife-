import argon2 from 'argon2';

// Parâmetros do doc 09 — Argon2id, memoryCost 19456 (19 MiB), timeCost 2, parallelism 1.
const OPCOES_ARGON2 = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

export function gerarHashSenha(senha: string): Promise<string> {
  return argon2.hash(senha, OPCOES_ARGON2);
}

export function verificarSenha(hash: string, senha: string): Promise<boolean> {
  return argon2.verify(hash, senha);
}
