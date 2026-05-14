import type { NextFunction, Request, Response } from 'express';

import { getSupabaseAdminClient } from '../config/supabase.js';
import type { DomainUser, UserRole } from '../types/domain.js';
import { ApiError } from '../utils/errors.js';

const domainUserSelect =
  'id,auth_id,email,role,status,approved_at,approved_by,created_at,updated_at';

const getBearerToken = (authorizationHeader: string | undefined): string => {
  if (!authorizationHeader) {
    throw new ApiError(401, 'AUTH_REQUIRED', 'Token de autenticacao ausente');
  }

  const [scheme, token] = authorizationHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'INVALID_AUTH_HEADER', 'Cabecalho de autenticacao invalido');
  }

  return token;
};

export const authenticate = async (request: Request, _response: Response, next: NextFunction) => {
  try {
    const token = getBearerToken(request.header('authorization'));
    const supabase = getSupabaseAdminClient();
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      throw new ApiError(401, 'INVALID_TOKEN', 'Sessao invalida ou expirada');
    }

    const { data: domainUser, error: domainError } = await supabase
      .from('users')
      .select(domainUserSelect)
      .eq('auth_id', authData.user.id)
      .single<DomainUser>();

    if (domainError || !domainUser) {
      throw new ApiError(403, 'DOMAIN_USER_NOT_FOUND', 'Usuario de dominio nao encontrado');
    }

    request.auth = {
      authUserId: authData.user.id,
      user: domainUser,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const requireActiveUser = (request: Request, _response: Response, next: NextFunction) => {
  const domainUser = request.auth?.user;

  if (!domainUser) {
    next(new ApiError(401, 'AUTH_REQUIRED', 'Autenticacao obrigatoria'));
    return;
  }

  if (domainUser.status === 'pendente') {
    next(new ApiError(403, 'USER_PENDING', 'Usuario aguardando aprovacao'));
    return;
  }

  if (domainUser.status === 'bloqueado') {
    next(new ApiError(403, 'USER_BLOCKED', 'Usuario bloqueado'));
    return;
  }

  next();
};

export const requireRoles = (...roles: UserRole[]) => {
  return (request: Request, _response: Response, next: NextFunction) => {
    const domainUser = request.auth?.user;

    if (!domainUser) {
      next(new ApiError(401, 'AUTH_REQUIRED', 'Autenticacao obrigatoria'));
      return;
    }

    if (!roles.includes(domainUser.role)) {
      next(new ApiError(403, 'FORBIDDEN_ROLE', 'Perfil sem permissao para esta acao'));
      return;
    }

    next();
  };
};
