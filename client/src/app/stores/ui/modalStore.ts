import { create } from 'zustand';

interface ModalState<T = unknown> {
  modalKey: string | null;
  modalData: T | null;
  openModal: (key: string, data?: T | null) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  modalKey: null,
  modalData: null,
  openModal: (key, data = null) => set({ modalKey: key, modalData: data }),
  closeModal: () => set({ modalKey: null, modalData: null }),
}));


