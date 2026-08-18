import { randomUUID } from 'node:crypto';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { env } from './config/env.js';
import { authRoutes } from './modules/auth/routes.js';
import { ErroDeNegocio } from './shared/errors.js';

export function buildApp(): FastifyInstance {
  const isDev = env.NODE_ENV === 'development';

  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'test' ? 'silent' : 'info',
      redact: ['req.headers.authorization', '*.senha', '*.senhaHash', '*.token'],
      ...(isDev ? { transport: { target: 'pino-pretty' } } : {}),
    },
    genReqId: (request) => (request.headers['x-request-id'] as string | undefined) ?? randomUUID(),
  });

  app.addHook('onRequest', async (request, reply) => {
    reply.header('X-Request-Id', request.id);
  });

  app.register(helmet);

  // Whitelist explícita por ambiente — sem "*" em produção (doc 09). O deploy real
  // (Sprint 8) troca isso por uma lista vinda de env; em dev é sempre o Next local.
  app.register(cors, {
    origin: env.NODE_ENV === 'production' ? [] : ['http://localhost:3000'],
  });

  app.register(jwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
  });

  app.get('/health', async () => ({ status: 'ok' }));
  app.get('/health/ready', async () => ({ status: 'ok' }));

  app.register(authRoutes, { prefix: '/v1/auth' });

  app.setErrorHandler((error: FastifyError | ErroDeNegocio | ZodError, request, reply) => {
    if (error instanceof ErroDeNegocio) {
      return reply.status(error.status).send({
        erro: {
          codigo: error.codigo,
          mensagem: error.message,
          detalhes: error.detalhes,
          requestId: request.id,
        },
      });
    }

    if (error instanceof ZodError) {
      return reply.status(422).send({
        erro: {
          codigo: 'VALIDACAO',
          mensagem: 'Dados inválidos.',
          detalhes: error.issues.map((issue) => ({
            campo: issue.path.join('.'),
            mensagem: issue.message,
          })),
          requestId: request.id,
        },
      });
    }

    if (error.validation) {
      return reply.status(422).send({
        erro: {
          codigo: 'VALIDACAO',
          mensagem: 'Dados inválidos.',
          detalhes: error.validation.map((item) => ({
            campo: item.instancePath.replace(/^\//, '') || String(item.params.missingProperty ?? ''),
            mensagem: item.message ?? 'Campo inválido.',
          })),
          requestId: request.id,
        },
      });
    }

    request.log.error(error);
    return reply.status(500).send({
      erro: {
        codigo: 'ERRO_INTERNO',
        mensagem: 'Ocorreu um erro inesperado. Tente novamente.',
        detalhes: [],
        requestId: request.id,
      },
    });
  });

  return app;
}
