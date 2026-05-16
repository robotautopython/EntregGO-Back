import { z } from 'zod';

export const createDeliverySchema = z
  .object({
    destinationAddress: z.string().trim().max(240).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .strict();

export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;
