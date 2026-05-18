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

export const adminListUserDeliveriesQuerySchema = adminListDeliveriesQuerySchema;

export const adminListPaymentsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    paid: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    referenceMonth: z
      .string()
      .regex(/^[0-9]{4}-(0[1-9]|1[0-2])$/)
      .optional(),
    role: z.enum(['logista', 'motoboy']).optional(),
    userStatus: z.enum(['pendente', 'ativo', 'bloqueado']).optional(),
  })
  .strict();

export const adminListUserPaymentsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    paid: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
  })
  .strict();

export const adminInsightsQuerySchema = z.object({}).strict();
export const emptyAdminActionQuerySchema = z.object({}).strict();
export const emptyAdminActionBodySchema = z.object({}).strict();

export const userIdParamsSchema = z.object({
  id: z.uuid(),
});

export const adminDeliveryIdParamsSchema = z.object({
  id: z.uuid(),
});

export const paymentIdParamsSchema = z.object({
  id: z.uuid(),
});

export type AdminDeliveryIdParams = z.infer<typeof adminDeliveryIdParamsSchema>;
export type AdminListDeliveriesQuery = z.infer<typeof adminListDeliveriesQuerySchema>;
export type AdminListPaymentsQuery = z.infer<typeof adminListPaymentsQuerySchema>;
export type AdminListUserDeliveriesQuery = z.infer<typeof adminListUserDeliveriesQuerySchema>;
export type AdminListUserPaymentsQuery = z.infer<typeof adminListUserPaymentsQuerySchema>;
export type AdminListUsersQuery = z.infer<typeof adminListUsersQuerySchema>;
export type PaymentIdParams = z.infer<typeof paymentIdParamsSchema>;
export type UserIdParams = z.infer<typeof userIdParamsSchema>;
