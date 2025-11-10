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

export async function createTicket(dto: CreateTicketDto): Promise<Ticket> {
  const res = await getApiClient().post('/tickets', CreateTicketSchema.parse(dto));
  return TicketSchema.parse(res.data);
}

export async function updateTicket(id: string, dto: UpdateTicketDto): Promise<Ticket> {
  const res = await getApiClient().put(`/tickets/${id}`, UpdateTicketSchema.parse(dto));
  return TicketSchema.parse(res.data);
}
