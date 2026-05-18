import { Router } from 'express';

import {
  approveUserController,
  blockUserController,
  getAdminDeliveryByIdController,
  getAdminInsightsController,
  getUserDetailController,
  listAdminUserDeliveriesController,
  listAdminUserPaymentsController,
  listAdminDeliveriesController,
  listAdminPaymentsController,
  listUsersController,
  markAdminPaymentPaidController,
  unblockUserController,
} from '../controllers/admin.controller.js';
import { authenticate, requireActiveUser, requireRoles } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate-request.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  adminDeliveryIdParamsSchema,
  adminInsightsQuerySchema,
  adminListDeliveriesQuerySchema,
  adminListPaymentsQuerySchema,
  adminListUserDeliveriesQuerySchema,
  adminListUserPaymentsQuerySchema,
  adminListUsersQuerySchema,
  emptyAdminActionBodySchema,
  emptyAdminActionQuerySchema,
  paymentIdParamsSchema,
  userIdParamsSchema,
} from '../validators/admin.validators.js';

export const adminRouter = Router();

adminRouter.use(authenticate, requireActiveUser, requireRoles('admin'));

adminRouter.get(
  '/insights',
  validateRequest({ query: adminInsightsQuerySchema }),
  asyncHandler(getAdminInsightsController),
);

adminRouter.get(
  '/deliveries',
  validateRequest({ query: adminListDeliveriesQuerySchema }),
  asyncHandler(listAdminDeliveriesController),
);

adminRouter.get(
  '/deliveries/:id',
  validateRequest({ params: adminDeliveryIdParamsSchema, query: emptyAdminActionQuerySchema }),
  asyncHandler(getAdminDeliveryByIdController),
);

adminRouter.get(
  '/payments',
  validateRequest({ query: adminListPaymentsQuerySchema }),
  asyncHandler(listAdminPaymentsController),
);

adminRouter.patch(
  '/payments/:id/mark-paid',
  validateRequest({
    params: paymentIdParamsSchema,
    query: emptyAdminActionQuerySchema,
    body: emptyAdminActionBodySchema,
  }),
  asyncHandler(markAdminPaymentPaidController),
);

adminRouter.get(
  '/users',
  validateRequest({ query: adminListUsersQuerySchema }),
  asyncHandler(listUsersController),
);

adminRouter.get(
  '/users/:id/deliveries',
  validateRequest({ params: userIdParamsSchema, query: adminListUserDeliveriesQuerySchema }),
  asyncHandler(listAdminUserDeliveriesController),
);

adminRouter.get(
  '/users/:id/payments',
  validateRequest({ params: userIdParamsSchema, query: adminListUserPaymentsQuerySchema }),
  asyncHandler(listAdminUserPaymentsController),
);

adminRouter.get(
  '/users/:id',
  validateRequest({ params: userIdParamsSchema }),
  asyncHandler(getUserDetailController),
);

adminRouter.patch(
  '/users/:id/approve',
  validateRequest({ params: userIdParamsSchema }),
  asyncHandler(approveUserController),
);

adminRouter.patch(
  '/users/:id/block',
  validateRequest({ params: userIdParamsSchema }),
  asyncHandler(blockUserController),
);

adminRouter.patch(
  '/users/:id/unblock',
  validateRequest({ params: userIdParamsSchema }),
  asyncHandler(unblockUserController),
);
