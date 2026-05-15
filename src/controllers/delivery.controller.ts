import type { Request, Response } from 'express';

import { createDelivery } from '../services/delivery.service.js';
import { sendSuccess } from '../utils/api-response.js';
import type { CreateDeliveryInput } from '../validators/delivery.validators.js';

export const createDeliveryController = async (request: Request, response: Response) => {
  const result = await createDelivery(
    request.body as CreateDeliveryInput,
    request.auth?.user.id ?? '',
  );

  sendSuccess(response, result, 'Solicitacao de entrega criada', 201);
};
