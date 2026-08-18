import type { FastifyInstance } from 'fastify';
import { autenticar } from '../../infra/auth/authenticate.js';
import { loginBodySchema, refreshBodySchema } from './schemas.js';
import { createAuthService } from './service.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  const authService = createAuthService(app);

  app.post('/login', async (request, reply) => {
    const body = loginBodySchema.parse(request.body);
    const resultado = await authService.login(body.email, body.senha, {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });
    return reply.status(200).send(resultado);
  });

  app.post('/refresh', async (request, reply) => {
    const body = refreshBodySchema.parse(request.body);
    const resultado = await authService.refresh(body.refreshToken, {
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    });
    return reply.status(200).send(resultado);
  });

  app.post('/logout', async (request, reply) => {
    const body = refreshBodySchema.parse(request.body);
    await authService.logout(body.refreshToken);
    return reply.status(204).send();
  });

  app.get('/me', { preHandler: autenticar }, async (request, reply) => {
    return reply.status(200).send({ usuario: request.user });
  });
}
