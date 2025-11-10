import { z } from 'zod';

export const TicketSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().optional().nullable(),
  asset_id: z.string().optional().nullable(),
  status: z.enum(['open', 'in_progress', 'closed']).default('open'),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  assignee: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type Ticket = z.infer<typeof TicketSchema>;

export const CreateTicketSchema = TicketSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type CreateTicketDto = z.infer<typeof CreateTicketSchema>;

export const UpdateTicketSchema = CreateTicketSchema.partial();
export type UpdateTicketDto = z.infer<typeof UpdateTicketSchema>;


