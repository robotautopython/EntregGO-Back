import { Router } from 'express';

import {
  approveUserController,
  blockUserController,
  getAdminInsightsController,
  getUserDetailController,
  listUsersController,
  unblockUserController,
} from '../controllers/admin.controller.js';
import { authenticate, requireActiveUser, requireRoles } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate-request.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  adminInsightsQuerySchema,
  adminListUsersQuerySchema,
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
  '/users',
  validateRequest({ query: adminListUsersQuerySchema }),
  asyncHandler(listUsersController),
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
