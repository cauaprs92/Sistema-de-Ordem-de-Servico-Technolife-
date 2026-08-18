import { prisma } from '../../infra/db/prisma.js';

export const authRepository = {
  buscarUsuarioPorEmail(email: string) {
    return prisma.usuario.findUnique({ where: { email } });
  },

  atualizarUltimoLogin(usuarioId: string) {
    return prisma.usuario.update({
      where: { id: usuarioId },
      data: { ultimoLoginEm: new Date() },
    });
  },

  criarRefreshToken(dados: {
    usuarioId: string;
    tokenHash: string;
    familiaId: string;
    expiraEm: Date;
    ip?: string | undefined;
    userAgent?: string | undefined;
  }) {
    return prisma.refreshToken.create({
      data: { ...dados, ip: dados.ip ?? null, userAgent: dados.userAgent ?? null },
    });
  },

  buscarRefreshTokenPorHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { usuario: true },
    });
  },

  revogarRefreshToken(id: string) {
    return prisma.refreshToken.update({
      where: { id },
      data: { revogadoEm: new Date() },
    });
  },

  revogarFamilia(familiaId: string) {
    return prisma.refreshToken.updateMany({
      where: { familiaId, revogadoEm: null },
      data: { revogadoEm: new Date() },
    });
  },
};
