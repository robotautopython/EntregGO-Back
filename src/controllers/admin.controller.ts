import type { Request, Response } from 'express';

import {
  approveUser,
  blockUser,
  getAdminInsights,
  getUserDetail,
  listAdminDeliveries,
  listAdminPayments,
  listUsers,
  markAdminPaymentPaid,
  unblockUser,
} from '../services/admin.service.js';
import { sendSuccess } from '../utils/api-response.js';
import { ApiError } from '../utils/errors.js';
import type {
  AdminListDeliveriesQuery,
  AdminListPaymentsQuery,
  AdminListUsersQuery,
  PaymentIdParams,
  UserIdParams,
} from '../validators/admin.validators.js';

export const getAdminInsightsController = async (_request: Request, response: Response) => {
  const result = await getAdminInsights();

  sendSuccess(response, result, 'Insights administrativos gerados');
};

export const listUsersController = async (request: Request, response: Response) => {
  const result = await listUsers(request.query as unknown as AdminListUsersQuery);

  sendSuccess(response, result, 'Usuarios encontrados');
};

export const listAdminDeliveriesController = async (request: Request, response: Response) => {
  const result = await listAdminDeliveries(request.query as unknown as AdminListDeliveriesQuery);

  sendSuccess(response, result, 'Entregas administrativas encontradas');
};

export const listAdminPaymentsController = async (request: Request, response: Response) => {
  const result = await listAdminPayments(request.query as unknown as AdminListPaymentsQuery);

  sendSuccess(response, result, 'Pagamentos administrativos encontrados');
};

export const markAdminPaymentPaidController = async (request: Request, response: Response) => {
  const params = request.params as PaymentIdParams;
  const adminUserId = request.auth?.user.id;

  if (!adminUserId) {
    throw new ApiError(401, 'AUTH_REQUIRED', 'Autenticacao obrigatoria');
  }

  const result = await markAdminPaymentPaid(params.id, adminUserId);

  sendSuccess(response, result, 'Pagamento marcado como pago');
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
