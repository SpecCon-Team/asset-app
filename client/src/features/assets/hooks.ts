import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createAsset, deleteAsset, getAsset, listAssets, updateAsset, bulkCreateAssets } from './api';
import type { CreateAssetDto, UpdateAssetDto } from './types';

export function useAssets(params?: Parameters<typeof listAssets>[0]) {
  return useQuery({
    queryKey: ['assets', params],
    queryFn: () => listAssets(params),
  });
}

export function useAsset(id: string | undefined) {
  return useQuery({
    queryKey: ['asset', id],
    queryFn: () => (id ? getAsset(id) : Promise.reject(new Error('no id'))),
    enabled: !!id,
  });
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAssetDto) => createAsset(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useUpdateAsset(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: UpdateAssetDto) => updateAsset(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['asset', id] });
    },
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAsset(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}

export function useBulkCreateAssets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: bulkCreateAssets,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}



