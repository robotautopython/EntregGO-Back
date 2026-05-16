import { z } from 'zod';

export const deliveryStatusValues = [
  'aguardando',
  'aceita',
  'coletada',
  'em_transito',
  'entregue',
  'expirada',
  'cancelada',
] as const;

export const createDeliverySchema = z
  .object({
    destinationAddress: z.string().trim().max(240).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .strict();

export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;

export const listDeliveriesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    status: z.enum(deliveryStatusValues).optional(),
  })
  .strict();

export type ListDeliveriesQuery = z.infer<typeof listDeliveriesQuerySchema>;

export const listAvailableDeliveriesQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export const deliveryIdParamsSchema = z.object({
  id: z.uuid(),
});

export type ListAvailableDeliveriesQuery = z.infer<typeof listAvailableDeliveriesQuerySchema>;
export type DeliveryIdParams = z.infer<typeof deliveryIdParamsSchema>;
