import '@fastify/jwt';
import type { PapelUsuario } from '@prisma/client';

interface JwtPayload {
  sub: string;
  papel: PapelUsuario;
  nome: string;
  jti: string;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload;
    user: JwtPayload;
  }
}
