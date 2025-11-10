import { create } from 'zustand';
import { Ticket, CreateTicketInput, UpdateTicketInput, ListTicketsParams } from './types';
import * as api from './api';

interface TicketsState {
  tickets: Ticket[];
  currentTicket: Ticket | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTickets: (params?: ListTicketsParams) => Promise<void>;
  fetchTicketById: (id: string) => Promise<void>;
  createTicket: (data: CreateTicketInput) => Promise<Ticket>;
  updateTicket: (id: string, data: UpdateTicketInput) => Promise<Ticket>;
  clearCurrentTicket: () => void;
}

export const useTicketsStore = create<TicketsState>((set) => ({
  tickets: [],
  currentTicket: null,
  isLoading: false,
  error: null,

  fetchTickets: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const tickets = await api.listTickets(params);
      set({ tickets, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchTicketById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const ticket = await api.getTicket(id);
      set({ currentTicket: ticket, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createTicket: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const newTicket = await api.createTicket(data);
      set((state) => ({
        tickets: [...state.tickets, newTicket],
        isLoading: false,
      }));
      return newTicket;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateTicket: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updatedTicket = await api.updateTicket(id, data);
      set((state) => ({
        tickets: state.tickets.map((t) => (t.id === id ? updatedTicket : t)),
        currentTicket: state.currentTicket?.id === id ? updatedTicket : state.currentTicket,
        isLoading: false,
      }));
      return updatedTicket;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  clearCurrentTicket: () => set({ currentTicket: null }),
}));