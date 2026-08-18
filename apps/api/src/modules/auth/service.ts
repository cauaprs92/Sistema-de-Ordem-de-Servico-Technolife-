import { randomUUID } from 'node:crypto';
import type { Usuario } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { verificarSenha } from '../../infra/auth/hash.js';
import {
  calcularExpiracaoRefreshToken,
  gerarFamiliaId,
  gerarRefreshToken,
  hashRefreshToken,
} from '../../infra/auth/refresh-token.js';
import { registrarAuditoria } from '../../shared/auditoria.js';
import { ErroDeNegocio } from '../../shared/errors.js';
import { authRepository } from './repository.js';

interface ContextoRequisicao {
  ip?: string | undefined;
  userAgent?: string | undefined;
}

interface UsuarioPublico {
  id: string;
  nome: string;
  email: string;
  papel: Usuario['papel'];
}

export interface AuthService {
  login(email: string, senha: string, ctx: ContextoRequisicao): Promise<ResultadoAuth>;
  refresh(refreshToken: string, ctx: ContextoRequisicao): Promise<ResultadoAuth>;
  logout(refreshToken: string): Promise<void>;
}

interface ResultadoAuth {
  accessToken: string;
  refreshToken: string;
  usuario: UsuarioPublico;
}

export function createAuthService(app: FastifyInstance): AuthService {
  async function emitirPar(usuario: Usuario, familiaId: string, ctx: ContextoRequisicao) {
    const accessToken = app.jwt.sign({
      sub: usuario.id,
      papel: usuario.papel,
      nome: usuario.nome,
      jti: randomUUID(),
    });

    const refreshTokenValor = gerarRefreshToken();
    await authRepository.criarRefreshToken({
      usuarioId: usuario.id,
      tokenHash: hashRefreshToken(refreshTokenValor),
      familiaId,
      expiraEm: calcularExpiracaoRefreshToken(),
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return { accessToken, refreshToken: refreshTokenValor };
  }

  async function login(email: string, senha: string, ctx: ContextoRequisicao): Promise<ResultadoAuth> {
    const usuario = await authRepository.buscarUsuarioPorEmail(email);
    const senhaValida = usuario ? await verificarSenha(usuario.senhaHash, senha) : false;

    if (!usuario || !usuario.ativo || !senhaValida) {
      throw new ErroDeNegocio('CREDENCIAIS_INVALIDAS', 'E-mail ou senha inválidos.', 401);
    }

    const { accessToken, refreshToken } = await emitirPar(usuario, gerarFamiliaId(), ctx);

    await authRepository.atualizarUltimoLogin(usuario.id);
    await registrarAuditoria({
      usuarioId: usuario.id,
      entidade: 'usuario',
      entidadeId: usuario.id,
      acao: 'LOGIN',
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return { accessToken, refreshToken, usuario: paraUsuarioPublico(usuario) };
  }

  async function refresh(refreshTokenRecebido: string, ctx: ContextoRequisicao): Promise<ResultadoAuth> {
    const tokenHash = hashRefreshToken(refreshTokenRecebido);
    const registro = await authRepository.buscarRefreshTokenPorHash(tokenHash);

    if (!registro) {
      throw new ErroDeNegocio('REFRESH_TOKEN_INVALIDO', 'Sessão expirada, faça login novamente.', 401);
    }

    if (registro.revogadoEm || registro.expiraEm < new Date()) {
      // Reuso de um token já revogado é sinal de roubo — derruba a família inteira (doc 09).
      await authRepository.revogarFamilia(registro.familiaId);
      throw new ErroDeNegocio('REFRESH_TOKEN_INVALIDO', 'Sessão expirada, faça login novamente.', 401);
    }

    await authRepository.revogarRefreshToken(registro.id);
    const { accessToken, refreshToken } = await emitirPar(registro.usuario, registro.familiaId, ctx);

    return { accessToken, refreshToken, usuario: paraUsuarioPublico(registro.usuario) };
  }

  async function logout(refreshTokenRecebido: string): Promise<void> {
    const tokenHash = hashRefreshToken(refreshTokenRecebido);
    const registro = await authRepository.buscarRefreshTokenPorHash(tokenHash);

    if (registro && !registro.revogadoEm) {
      await authRepository.revogarRefreshToken(registro.id);
    }
  }

  return { login, refresh, logout };
}

function paraUsuarioPublico(usuario: Usuario): UsuarioPublico {
  return { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel };
}
