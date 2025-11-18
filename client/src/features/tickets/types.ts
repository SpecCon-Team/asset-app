import { z } from 'zod';

// User schema for nested relations
const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable().optional(),
  role: z.string().optional(),
  phone: z.string().nullable().optional(),
  isWhatsAppUser: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// Asset schema for nested relations
const AssetSchema = z.object({
  id: z.string(),
  asset_code: z.string(),
  name: z.string(),
  status: z.string(),
});

export const TicketSchema = z.object({
  id: z.string().optional(),
  number: z.string().optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  status: z.enum(['open', 'in_progress', 'closed']).default('open'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  createdById: z.string().optional(),
  assignedToId: z.string().optional().nullable(),
  assetId: z.string().optional().nullable(),
  resolution: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  // Nested relations
  createdBy: UserSchema.optional(),
  assignedTo: UserSchema.optional().nullable(),
  asset: AssetSchema.optional().nullable(),
});

export type Ticket = z.infer<typeof TicketSchema>;

export const CreateTicketSchema = TicketSchema.omit({ 
  id: true, 
  number: true,
  createdAt: true, 
  updatedAt: true,
  createdBy: true,
  assignedTo: true,
  asset: true,
});

export type CreateTicketDto = z.infer<typeof CreateTicketSchema>;
export type CreateTicketInput = CreateTicketDto;

export const UpdateTicketSchema = CreateTicketSchema.partial();
export type UpdateTicketDto = z.infer<typeof UpdateTicketSchema>;
export type UpdateTicketInput = UpdateTicketDto;

export interface ListTicketsParams {
  status?: 'open' | 'in_progress' | 'closed';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  assetId?: string;
}