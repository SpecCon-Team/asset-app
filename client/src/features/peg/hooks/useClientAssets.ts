import { useState, useEffect } from 'react';
import { getApiClient } from '@/features/assets/lib/apiClient';
import { showError } from '@/lib/sweetalert';

interface Asset {
  id: string;
  asset_code: string;
  name: string;
  serial_number?: string | null;
  asset_type?: string | null;
  condition?: string | null;
  status?: string;
  description?: string | null;
}

export function useClientAssets(clientId: string | null) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAssets = async () => {
    if (!clientId) {
      setAssets([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const api = getApiClient();
      const response = await api.get(`/peg/${clientId}/assets`);
      setAssets(response.data);
    } catch (err: any) {
      console.error('Error loading client assets:', err);
      setError(err.response?.data?.error || 'Failed to load assets');
      showError('Error', 'Failed to load client assets');
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  const assignAsset = async (assetId: string) => {
    if (!clientId) return false;

    try {
      const api = getApiClient();
      await api.post(`/peg/${clientId}/assets`, { assetId });
      await loadAssets(); // Reload assets after assignment
      return true;
    } catch (err: any) {
      console.error('Error assigning asset:', err);
      showError('Error', err.response?.data?.error || 'Failed to assign asset');
      return false;
    }
  };

  const assignAssets = async (assetIds: string[]) => {
    if (!clientId) return false;

    try {
      const api = getApiClient();
      // Assign assets one by one
      for (const assetId of assetIds) {
        await api.post(`/peg/${clientId}/assets`, { assetId });
      }
      await loadAssets(); // Reload assets after all assignments
      return true;
    } catch (err: any) {
      console.error('Error assigning assets:', err);
      showError('Error', err.response?.data?.error || 'Failed to assign assets');
      return false;
    }
  };

  const unassignAsset = async (assetId: string) => {
    if (!clientId) return;

    try {
      const api = getApiClient();
      await api.delete(`/peg/${clientId}/assets/${assetId}`);
      await loadAssets(); // Reload assets after unassignment
      return true;
    } catch (err: any) {
      console.error('Error unassigning asset:', err);
      showError('Error', err.response?.data?.error || 'Failed to unassign asset');
      return false;
    }
  };

  useEffect(() => {
    loadAssets();
  }, [clientId]);

  return {
    assets,
    loading,
    error,
    loadAssets,
    assignAsset,
    assignAssets,
    unassignAsset,
  };
}

