import type { Request, Response } from 'express';

import { registerCourier, registerStore } from '../services/auth.service.js';
import { sendSuccess } from '../utils/api-response.js';
import type { RegisterCourierInput, RegisterStoreInput } from '../validators/auth.validators.js';

export const registerStoreController = async (request: Request, response: Response) => {
  const result = await registerStore(request.body as RegisterStoreInput);

  sendSuccess(response, result, 'Cadastro de loja recebido para aprovacao', 201);
};

export const registerCourierController = async (request: Request, response: Response) => {
  const result = await registerCourier(request.body as RegisterCourierInput);

  sendSuccess(response, result, 'Cadastro de motoboy recebido para aprovacao', 201);
};

export const meController = async (request: Request, response: Response) => {
  sendSuccess(response, request.auth, 'Usuario autenticado');
};
