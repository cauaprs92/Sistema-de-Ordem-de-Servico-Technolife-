import { z } from 'zod';

/** Autenticação — doc 08, seção 5, e doc 09. */

export const papelUsuarioSchema = z.enum(['ADMIN', 'ATENDENTE', 'TECNICO', 'FINANCEIRO', 'ESTOQUE']);

// Sem exigência de força de senha aqui — isso é regra de cadastro/troca de senha
// (doc 09), não de login. Uma conta antiga com senha mais curta continua entrando.
export const loginSchema = z
  .object({
    email: z.string().email('E-mail inválido.'),
    senha: z.string().min(1, 'Informe a senha.'),
  })
  .strict();

export const loginRespostaSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  usuario: z.object({
    id: z.string().uuid(),
    nome: z.string(),
    email: z.string().email(),
    papel: papelUsuarioSchema,
  }),
});

export const refreshSchema = z
  .object({
    refreshToken: z.string().min(1, 'Informe o refresh token.'),
  })
  .strict();

export type PapelUsuario = z.infer<typeof papelUsuarioSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type LoginResposta = z.infer<typeof loginRespostaSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
