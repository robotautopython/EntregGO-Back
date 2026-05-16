import type { Request, Response } from 'express';

import { createDelivery, listStoreDeliveries } from '../services/delivery.service.js';
import { sendSuccess } from '../utils/api-response.js';
import type {
  CreateDeliveryInput,
  ListDeliveriesQuery,
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
