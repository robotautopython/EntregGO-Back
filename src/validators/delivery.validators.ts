import { z } from 'zod';

export const createDeliverySchema = z.object({
  destinationAddress: z.string().trim().min(1).max(240),
  notes: z.string().trim().max(500).optional(),
});

export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;
