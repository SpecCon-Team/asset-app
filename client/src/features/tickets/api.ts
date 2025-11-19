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

export async function listTickets(params?: { limit?: number; page?: number }): Promise<Ticket[]> {
  const queryParams = new URLSearchParams();

  // Default to fetching all tickets (limit=-1) for backward compatibility
  if (params?.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  } else {
    queryParams.append('limit', '-1');
  }

  if (params?.page !== undefined) {
    queryParams.append('page', params.page.toString());
  }

  const res = await getApiClient().get(`/tickets?${queryParams.toString()}`);

  // Handle both old format (array) and new format (object with data/pagination)
  const data = Array.isArray(res.data) ? res.data : res.data.data;
  return z.array(TicketSchema).parse(data);
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