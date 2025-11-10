import { getApiClient } from '@/features/assets/lib/apiClient';
import { z } from 'zod';
import {
  AssetSchema,
  CreateAssetSchema,
  UpdateAssetSchema,
  type Asset,
  type CreateAssetDto,
  type UpdateAssetDto,
} from './types';

const PaginatedAssetsSchema = z.object({
  items: z.array(AssetSchema),
  total: z.number().optional(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
});

export type ListAssetsParams = {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
};

export async function listAssets(params: ListAssetsParams = {}): Promise<Asset[]> {
  const client = getApiClient();
  const res = await client.get('/assets', { params });
  // Accept either array or paginated object
  if (Array.isArray(res.data)) {
    return z.array(AssetSchema).parse(res.data);
  }
  const parsed = PaginatedAssetsSchema.parse(res.data);
  return parsed.items;
}

export async function getAsset(id: string): Promise<Asset> {
  const client = getApiClient();
  const res = await client.get(`/assets/${id}`);
  return AssetSchema.parse(res.data);
}

export async function createAsset(dto: CreateAssetDto): Promise<Asset> {
  const client = getApiClient();
  const payload = CreateAssetSchema.parse(dto);
  const res = await client.post('/assets', payload);
  return AssetSchema.parse(res.data);
}

export async function updateAsset(id: string, dto: UpdateAssetDto): Promise<Asset> {
  const client = getApiClient();
  const payload = UpdateAssetSchema.parse(dto);
  const res = await client.put(`/assets/${id}`, payload);
  return AssetSchema.parse(res.data);
}

export async function deleteAsset(id: string): Promise<void> {
  const client = getApiClient();
  await client.delete(`/assets/${id}`);
}

export async function bulkCreateAssets(
  dtos: CreateAssetDto[],
): Promise<{ created: number; failed: number }> {
  const client = getApiClient();
  const payload = z.array(CreateAssetSchema).parse(dtos);
  const res = await client.post('/assets:bulk', payload);
  return z.object({ created: z.number(), failed: z.number().default(0) }).parse(res.data);
}
