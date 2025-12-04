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
  data: z.array(AssetSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }).nullable(),
});

export type ListAssetsParams = {
  search?: string;
  status?: string;
  ownerId?: string;
  page?: number;
  limit?: number;
};

export async function listAssets(params: ListAssetsParams = {}): Promise<Asset[]> {
  const client = getApiClient();

  // Convert params to query string, defaulting to limit=-1 (no pagination)
  const queryParams: any = { ...params };
  if (queryParams.limit === undefined) {
    queryParams.limit = -1;
  }

  try {
    const res = await client.get('/assets', { params: queryParams });

    // Accept either array (old format) or paginated object (new format)
    if (Array.isArray(res.data)) {
      return z.array(AssetSchema).parse(res.data);
    }

    const parsed = PaginatedAssetsSchema.parse(res.data);
    return parsed.data;
  } catch (error: any) {
    // Re-throw with more context for network errors
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      throw new Error('Network Error: Unable to connect to the server. Please check your connection and ensure the backend is running.');
    }
    throw error;
  }
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
  const res = await client.post('/assets/bulk', payload);
  return z.object({ created: z.number(), failed: z.number().default(0) }).parse(res.data);
}