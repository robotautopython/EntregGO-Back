import { z } from 'zod';

const passwordSchema = z.string().min(8).max(128);

export const registerStoreSchema = z.object({
  email: z.email().max(254),
  password: passwordSchema,
  store: z.object({
    name: z.string().trim().min(1).max(120),
    ownerName: z.string().trim().min(1).max(120),
    address: z.string().trim().min(1).max(240),
    description: z.string().trim().max(500).optional(),
  }),
});

export const registerCourierSchema = z.object({
  email: z.email().max(254),
  password: passwordSchema,
  courier: z.object({
    fullName: z.string().trim().min(1).max(120),
  }),
});

export type RegisterStoreInput = z.infer<typeof registerStoreSchema>;
export type RegisterCourierInput = z.infer<typeof registerCourierSchema>;
