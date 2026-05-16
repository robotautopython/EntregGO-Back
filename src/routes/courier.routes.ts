import { Router } from 'express';

import {
  getCourierStatusController,
  updateCourierStatusController,
} from '../controllers/courier.controller.js';
import { authenticate, requireActiveUser, requireRoles } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate-request.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  courierStatusQuerySchema,
  updateCourierStatusSchema,
} from '../validators/courier.validators.js';

export const courierRouter = Router();

courierRouter.use(authenticate, requireActiveUser, requireRoles('motoboy'));

courierRouter.get(
  '/me/status',
  validateRequest({ query: courierStatusQuerySchema }),
  asyncHandler(getCourierStatusController),
);

courierRouter.patch(
  '/me/status',
  validateRequest({ body: updateCourierStatusSchema }),
  asyncHandler(updateCourierStatusController),
);
