import { z } from 'zod';

/** Envelope padrão de resposta e erro — doc 08, seção 2. */

export const metaPaginacaoSchema = z.object({
  pagina: z.number().int().positive(),
  porPagina: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPaginas: z.number().int().nonnegative(),
});

export function listaPaginadaSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: z.array(item),
    meta: metaPaginacaoSchema,
  });
}

export const detalheErroSchema = z.object({
  campo: z.string(),
  mensagem: z.string(),
});

export const envelopeErroSchema = z.object({
  erro: z.object({
    codigo: z.string(),
    mensagem: z.string(),
    detalhes: z.array(detalheErroSchema).default([]),
    requestId: z.string(),
  }),
});

export const parametrosPaginacaoSchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  porPagina: z.coerce.number().int().positive().max(100).default(20),
});

export type MetaPaginacao = z.infer<typeof metaPaginacaoSchema>;
export type EnvelopeErro = z.infer<typeof envelopeErroSchema>;
export type ParametrosPaginacao = z.infer<typeof parametrosPaginacaoSchema>;
