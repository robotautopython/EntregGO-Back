import { Router } from 'express';

import {
  acceptDeliveryController,
  createDeliveryController,
  getActiveDeliveryController,
  getDeliveryController,
  listAvailableDeliveriesController,
  listCourierHistoryController,
  listDeliveriesController,
  updateDeliveryStatusController,
} from '../controllers/delivery.controller.js';
import { authenticate, requireActiveUser, requireRoles } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate-request.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  activeDeliveryQuerySchema,
  createDeliverySchema,
  deliveryDetailQuerySchema,
  deliveryIdParamsSchema,
  listAvailableDeliveriesQuerySchema,
  listCourierHistoryQuerySchema,
  listDeliveriesQuerySchema,
  updateDeliveryStatusSchema,
} from '../validators/delivery.validators.js';

export const deliveryRouter = Router();

deliveryRouter.post(
  '/',
  authenticate,
  requireActiveUser,
  requireRoles('logista'),
  validateRequest({ body: createDeliverySchema }),
  asyncHandler(createDeliveryController),
);

deliveryRouter.get(
  '/',
  authenticate,
  requireActiveUser,
  requireRoles('logista'),
  validateRequest({ query: listDeliveriesQuerySchema }),
  asyncHandler(listDeliveriesController),
);

deliveryRouter.get(
  '/available',
  authenticate,
  requireActiveUser,
  requireRoles('motoboy'),
  validateRequest({ query: listAvailableDeliveriesQuerySchema }),
  asyncHandler(listAvailableDeliveriesController),
);

deliveryRouter.get(
  '/active',
  authenticate,
  requireActiveUser,
  requireRoles('motoboy'),
  validateRequest({ query: activeDeliveryQuerySchema }),
  asyncHandler(getActiveDeliveryController),
);

deliveryRouter.get(
  '/history',
  authenticate,
  requireActiveUser,
  requireRoles('motoboy'),
  validateRequest({ query: listCourierHistoryQuerySchema }),
  asyncHandler(listCourierHistoryController),
);

deliveryRouter.get(
  '/:id',
  authenticate,
  requireActiveUser,
  requireRoles('logista'),
  validateRequest({ params: deliveryIdParamsSchema, query: deliveryDetailQuerySchema }),
  asyncHandler(getDeliveryController),
);

deliveryRouter.post(
  '/:id/accept',
  authenticate,
  requireActiveUser,
  requireRoles('motoboy'),
  validateRequest({ params: deliveryIdParamsSchema }),
  asyncHandler(acceptDeliveryController),
);

deliveryRouter.patch(
  '/:id/status',
  authenticate,
  requireActiveUser,
  requireRoles('motoboy'),
  validateRequest({ params: deliveryIdParamsSchema, body: updateDeliveryStatusSchema }),
  asyncHandler(updateDeliveryStatusController),
);
