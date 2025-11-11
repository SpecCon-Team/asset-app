import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional().nullable(),
  role: z.enum(['ADMIN', 'USER', 'TECHNICIAN']).default('USER'),
});

export type User = z.infer<typeof UserSchema>;