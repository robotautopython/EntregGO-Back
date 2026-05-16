import type { Request, Response } from 'express';

import {
  acceptDeliveryForCourier,
  createDelivery,
  getActiveDeliveryForCourier,
  listAvailableDeliveriesForCourier,
  listStoreDeliveries,
  updateDeliveryStatusForCourier,
} from '../services/delivery.service.js';
import { sendSuccess } from '../utils/api-response.js';
import type {
  CreateDeliveryInput,
  DeliveryIdParams,
  ListAvailableDeliveriesQuery,
  ListDeliveriesQuery,
  UpdateDeliveryStatusInput,
} from '../validators/delivery.validators.js';

export const createDeliveryController = async (request: Request, response: Response) => {
  const result = await createDelivery(
    request.body as CreateDeliveryInput,
    request.auth?.user.id ?? '',
  );

  sendSuccess(response, result, 'Solicitacao de entrega criada', 201);
};

export const listDeliveriesController = async (request: Request, response: Response) => {
  const result = await listStoreDeliveries(
    request.query as unknown as ListDeliveriesQuery,
    request.auth?.user.id ?? '',
  );

  sendSuccess(response, result, 'Entregas encontradas');
};

export const listAvailableDeliveriesController = async (request: Request, response: Response) => {
  const result = await listAvailableDeliveriesForCourier(
    request.query as unknown as ListAvailableDeliveriesQuery,
    request.auth?.user.id ?? '',
  );

  sendSuccess(response, result, 'Entregas disponiveis encontradas');
};

export const acceptDeliveryController = async (request: Request, response: Response) => {
  const params = request.params as DeliveryIdParams;
  const result = await acceptDeliveryForCourier(params.id, request.auth?.user.id ?? '');

  sendSuccess(response, result, 'Entrega aceita');
};

export const getActiveDeliveryController = async (request: Request, response: Response) => {
  const result = await getActiveDeliveryForCourier(request.auth?.user.id ?? '');

  sendSuccess(
    response,
    result,
    result ? 'Corrida ativa encontrada' : 'Nenhuma corrida ativa encontrada',
  );
};

export const updateDeliveryStatusController = async (request: Request, response: Response) => {
  const params = request.params as DeliveryIdParams;
  const body = request.body as UpdateDeliveryStatusInput;
  const result = await updateDeliveryStatusForCourier(
    params.id,
    body.status,
    request.auth?.user.id ?? '',
  );

  sendSuccess(response, result, 'Status da entrega atualizado');
};
