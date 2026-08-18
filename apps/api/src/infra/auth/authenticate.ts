import type { FastifyReply, FastifyRequest } from 'fastify';

// preHandler que exige um access token válido (doc 01 — plugin `authenticate`).
// Popula request.user com { sub, papel, nome, jti } a partir do JWT.
export async function autenticar(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    await request.jwtVerify();
  } catch {
    await reply.status(401).send({
      erro: {
        codigo: 'NAO_AUTENTICADO',
        mensagem: 'Token ausente ou inválido.',
        detalhes: [],
        requestId: request.id,
      },
    });
  }
}
