import { z } from 'zod';

/** Autenticação — doc 08, seção 5, e doc 09. */

export const papelUsuarioSchema = z.enum(['ADMIN', 'ATENDENTE', 'TECNICO', 'FINANCEIRO', 'ESTOQUE']);

export const loginSchema = z
  .object({
    email: z.string().email(),
    senha: z.string().min(10),
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
    refreshToken: z.string(),
  })
  .strict();

export type PapelUsuario = z.infer<typeof papelUsuarioSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type LoginResposta = z.infer<typeof loginRespostaSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
