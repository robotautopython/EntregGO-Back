import { z } from 'zod';

export const courierStatusQuerySchema = z.object({}).strict();

export const updateCourierStatusSchema = z
  .object({
    isOnline: z.boolean(),
  })
  .strict();

export type UpdateCourierStatusInput = z.infer<typeof updateCourierStatusSchema>;
