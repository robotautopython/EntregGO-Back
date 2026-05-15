import { Router } from 'express';

import { createDeliveryController } from '../controllers/delivery.controller.js';
import { authenticate, requireActiveUser, requireRoles } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate-request.js';
import { asyncHandler } from '../utils/async-handler.js';
import { createDeliverySchema } from '../validators/delivery.validators.js';

export const deliveryRouter = Router();

deliveryRouter.post(
  '/',
  authenticate,
  requireActiveUser,
  requireRoles('logista'),
  validateRequest({ body: createDeliverySchema }),
  asyncHandler(createDeliveryController),
);
