import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTicket, getTicket, listTickets, updateTicket } from './api';
import type { CreateTicketDto, UpdateTicketDto } from './types';

export function useTickets() {
  return useQuery({
    queryKey: ['tickets'],
    queryFn: listTickets,
  });
}

export function useTicket(id: string | undefined) {
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: () => (id ? getTicket(id) : Promise.reject(new Error('no id'))),
    enabled: !!id,
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateTicketDto) => createTicket(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useUpdateTicket(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateTicketDto) => updateTicket(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      qc.invalidateQueries({ queryKey: ['ticket', id] });
    },
  });
}


