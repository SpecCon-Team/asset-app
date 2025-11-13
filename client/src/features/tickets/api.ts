import { getApiClient } from '@/features/assets/lib/apiClient';
import { z } from 'zod';
import {
  TicketSchema,
  CreateTicketSchema,
  UpdateTicketSchema,
  type Ticket,
  type CreateTicketDto,
  type UpdateTicketDto,
} from './types';

export async function listTickets(): Promise<Ticket[]> {
  const res = await getApiClient().get('/tickets');
  return z.array(TicketSchema).parse(res.data);
}

export async function getTicket(id: string): Promise<Ticket> {
  const res = await getApiClient().get(`/tickets/${id}`);
  return TicketSchema.parse(res.data);
}

export async function createTicket(dto: any): Promise<Ticket> {
  // Send data directly without schema validation since backend has different field names
  const res = await getApiClient().post('/tickets', dto);
  return TicketSchema.parse(res.data);
}

export async function updateTicket(id: string, dto: UpdateTicketDto): Promise<Ticket> {
  const res = await getApiClient().patch(`/tickets/${id}`, dto);
  return TicketSchema.parse(res.data);
}

export async function deleteTicket(id: string): Promise<void> {
  await getApiClient().delete(`/tickets/${id}`);
}