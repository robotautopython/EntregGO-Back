import { z } from 'zod';

import { deliveryStatusValues } from './delivery.validators.js';

export const adminListUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  role: z.enum(['admin', 'logista', 'motoboy']).optional(),
  status: z.enum(['pendente', 'ativo', 'bloqueado']).optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

export const adminListDeliveriesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    status: z.enum(deliveryStatusValues).optional(),
  })
  .strict();

export const adminInsightsQuerySchema = z.object({}).strict();

export const userIdParamsSchema = z.object({
  id: z.uuid(),
});

export type AdminListDeliveriesQuery = z.infer<typeof adminListDeliveriesQuerySchema>;
export type AdminListUsersQuery = z.infer<typeof adminListUsersQuerySchema>;
export type UserIdParams = z.infer<typeof userIdParamsSchema>;
