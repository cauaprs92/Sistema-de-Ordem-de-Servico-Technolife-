import type { Prisma } from '@prisma/client';
import { prisma } from '../infra/db/prisma.js';

interface RegistrarAuditoriaInput {
  usuarioId?: string | undefined;
  entidade: string;
  entidadeId: string;
  acao: string;
  dadosAntes?: Record<string, unknown> | undefined;
  dadosDepois?: Record<string, unknown> | undefined;
  ip?: string | undefined;
  userAgent?: string | undefined;
}

// Toda escrita relevante grava aqui (doc 09, §6). Tabela append-only — nunca editar/apagar.
export async function registrarAuditoria(input: RegistrarAuditoriaInput): Promise<void> {
  const data: Prisma.AuditoriaUncheckedCreateInput = {
    usuarioId: input.usuarioId ?? null,
    entidade: input.entidade,
    entidadeId: input.entidadeId,
    acao: input.acao,
    ip: input.ip ?? null,
    userAgent: input.userAgent ?? null,
    // Espalhado condicionalmente: sob exactOptionalPropertyTypes, `undefined` explícito
    // não é o mesmo que a chave ausente — só entra no objeto quando há valor de fato.
    ...(input.dadosAntes !== undefined
      ? { dadosAntes: input.dadosAntes as Prisma.InputJsonValue }
      : {}),
    ...(input.dadosDepois !== undefined
      ? { dadosDepois: input.dadosDepois as Prisma.InputJsonValue }
      : {}),
  };

  await prisma.auditoria.create({ data });
}
