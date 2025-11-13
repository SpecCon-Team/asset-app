import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional().nullable(),
  role: z.enum(['ADMIN', 'USER', 'TECHNICIAN']).default('USER'),
  isAvailable: z.boolean().optional().default(true),
  profilePicture: z.string().optional().nullable(),
  createdAt: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;