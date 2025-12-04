import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional().nullable(),
  role: z.enum(['ADMIN', 'USER', 'TECHNICIAN', 'PEG']).default('USER'),
  isAvailable: z.boolean().optional().default(true),
  profilePicture: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  isWhatsAppUser: z.boolean().optional().default(false),
  whatsAppNotifications: z.boolean().optional().default(true),
  createdAt: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;