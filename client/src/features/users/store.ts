import { create } from 'zustand';
import { User } from './types';
import * as api from './api';

interface UsersState {
  users: User[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchUsers: () => Promise<void>;
}

export const useUsersStore = create<UsersState>((set) => ({
  users: [],
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const users = await api.listUsers();
      set({ users, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));
