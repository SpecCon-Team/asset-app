import { create } from 'zustand';

interface FiltersState {
  search: string;
  status: string | null;
  ownerEmail: string | null;
  setSearch: (q: string) => void;
  setStatus: (s: string | null) => void;
  setOwnerEmail: (e: string | null) => void;
  reset: () => void;
}

export const useFiltersStore = create<FiltersState>((set) => ({
  search: '',
  status: null,
  ownerEmail: null,
  setSearch: (q) => set({ search: q }),
  setStatus: (s) => set({ status: s }),
  setOwnerEmail: (e) => set({ ownerEmail: e }),
  reset: () => set({ search: '', status: null, ownerEmail: null }),
}));


