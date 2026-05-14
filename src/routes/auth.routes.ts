import { Router } from 'express';

import {
  meController,
  registerCourierController,
  registerStoreController,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validate-request.js';
import { asyncHandler } from '../utils/async-handler.js';
import { registerCourierSchema, registerStoreSchema } from '../validators/auth.validators.js';

export const authRouter = Router();

authRouter.post(
  '/register/store',
  validateRequest({ body: registerStoreSchema }),
  asyncHandler(registerStoreController),
);

authRouter.post(
  '/register/courier',
  validateRequest({ body: registerCourierSchema }),
  asyncHandler(registerCourierController),
);

authRouter.get('/me', authenticate, asyncHandler(meController));
