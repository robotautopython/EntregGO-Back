import cors from 'cors';
import dotenv from 'dotenv';
import express, { type NextFunction, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import { getAllowedCorsOrigins } from './config/cors.js';
import { adminRouter } from './routes/admin.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { isApiError, toApiErrorPayload } from './utils/errors.js';

dotenv.config({ path: '.env.local', quiet: true });
dotenv.config({ quiet: true });

export const app = express();

const allowedOrigins = getAllowedCorsOrigins();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      callback(null, allowedOrigins.includes(origin));
    },
  }),
);
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get('/api/health', (_request: Request, response: Response) => {
  response.status(200).json({
    success: true,
    data: {
      status: 'ok',
    },
    message: 'API online',
  });
});

app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

app.use((_request: Request, response: Response) => {
  response.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Recurso nao encontrado',
      details: [],
    },
  });
});

app.use((error: Error, _request: Request, response: Response, _next: NextFunction) => {
  if (isApiError(error)) {
    response.status(error.statusCode).json({
      success: false,
      error: toApiErrorPayload(error),
    });
    return;
  }

  response.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor',
      details: [],
    },
  });
});
