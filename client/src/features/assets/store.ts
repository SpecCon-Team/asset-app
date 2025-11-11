import { create } from 'zustand';
import { Asset, CreateAssetDto, UpdateAssetDto, ListAssetsParams } from './types';
import { 
  listAssets, 
  getAsset, 
  createAsset, 
  updateAsset, 
  deleteAsset
  // bulkCreateAssets - REMOVED for now
} from './api';

interface AssetsState {
  assets: Asset[];
  currentAsset: Asset | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAssets: (params?: ListAssetsParams) => Promise<void>;
  fetchAssetById: (id: string) => Promise<void>;
  createAsset: (data: CreateAssetDto) => Promise<Asset>;
  updateAsset: (id: string, data: UpdateAssetDto) => Promise<Asset>;
  deleteAsset: (id: string) => Promise<void>;
  bulkCreateAssets: (assets: CreateAssetDto[]) => Promise<void>;
  clearCurrentAsset: () => void;
}

export const useAssetsStore = create<AssetsState>((set, get) => ({
  assets: [],
  currentAsset: null,
  isLoading: false,
  error: null,

  fetchAssets: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const assets = await listAssets(params);
      set({ assets, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  fetchAssetById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const asset = await getAsset(id);
      set({ currentAsset: asset, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  createAsset: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const newAsset = await createAsset(data);
      set((state) => ({
        assets: [...state.assets, newAsset],
        isLoading: false,
      }));
      return newAsset;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  updateAsset: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updatedAsset = await updateAsset(id, data);
      set((state) => ({
        assets: state.assets.map((a) => (a.id === id ? updatedAsset : a)),
        currentAsset: state.currentAsset?.id === id ? updatedAsset : state.currentAsset,
        isLoading: false,
      }));
      return updatedAsset;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  deleteAsset: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deleteAsset(id);
      set((state) => ({
        assets: state.assets.filter((a) => a.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  bulkCreateAssets: async (assets) => {
    set({ isLoading: true, error: null });
    try {
      await bulkCreateAssets(assets);
      await get().fetchAssets();
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  clearCurrentAsset: () => set({ currentAsset: null }),
}));