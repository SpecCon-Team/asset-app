import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  full_name: z.string().optional().nullable(),
  role: z.enum(['admin', 'technician', 'user']).default('user'),
});

export type User = z.infer<typeof UserSchema>;


