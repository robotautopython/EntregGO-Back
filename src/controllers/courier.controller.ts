import type { Request, Response } from 'express';

import {
  getCourierOperationalStatus,
  updateCourierOperationalStatus,
} from '../services/courier.service.js';
import { sendSuccess } from '../utils/api-response.js';
import type { UpdateCourierStatusInput } from '../validators/courier.validators.js';

export const getCourierStatusController = async (request: Request, response: Response) => {
  const result = await getCourierOperationalStatus(request.auth?.user.id ?? '');

  sendSuccess(response, result, 'Status operacional encontrado');
};

export const updateCourierStatusController = async (request: Request, response: Response) => {
  const result = await updateCourierOperationalStatus(
    request.body as UpdateCourierStatusInput,
    request.auth?.user.id ?? '',
  );

  sendSuccess(response, result, 'Status operacional atualizado');
};
