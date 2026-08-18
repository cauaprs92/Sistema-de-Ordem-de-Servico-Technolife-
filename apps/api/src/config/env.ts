import { z } from 'zod';

/** Falha rápido no boot, não em produção às 3h da manhã (doc 11). */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3333),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  FISCAL_PROVIDER: z.enum(['mock', 'focus', 'plugnotas']).default('mock'),
  FISCAL_API_KEY: z.string().optional(),
  STORAGE_PATH: z.string().default('./storage'),
  TZ: z.string().default('America/Sao_Paulo'),
});

export const env = envSchema.parse(process.env);
export type Env = typeof env;
