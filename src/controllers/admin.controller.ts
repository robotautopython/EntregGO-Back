import type { Request, Response } from 'express';

import {
  approveUser,
  blockUser,
  getAdminInsights,
  getUserDetail,
  listUsers,
  unblockUser,
} from '../services/admin.service.js';
import { sendSuccess } from '../utils/api-response.js';
import type { AdminListUsersQuery, UserIdParams } from '../validators/admin.validators.js';

export const getAdminInsightsController = async (_request: Request, response: Response) => {
  const result = await getAdminInsights();

  sendSuccess(response, result, 'Insights administrativos gerados');
};

export const listUsersController = async (request: Request, response: Response) => {
  const result = await listUsers(request.query as unknown as AdminListUsersQuery);

  sendSuccess(response, result, 'Usuarios encontrados');
};

export const getUserDetailController = async (request: Request, response: Response) => {
  const params = request.params as UserIdParams;
  const result = await getUserDetail(params.id);

  sendSuccess(response, result, 'Usuario encontrado');
};

export const approveUserController = async (request: Request, response: Response) => {
  const params = request.params as UserIdParams;
  const result = await approveUser(params.id, request.auth?.user.id ?? '');

  sendSuccess(response, result, 'Usuario aprovado');
};

export const blockUserController = async (request: Request, response: Response) => {
  const params = request.params as UserIdParams;
  const result = await blockUser(params.id);

  sendSuccess(response, result, 'Usuario bloqueado');
};

export const unblockUserController = async (request: Request, response: Response) => {
  const params = request.params as UserIdParams;
  const result = await unblockUser(params.id, request.auth?.user.id ?? '');

  sendSuccess(response, result, 'Usuario desbloqueado');
};
