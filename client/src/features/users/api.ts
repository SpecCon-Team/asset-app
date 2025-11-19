import { getApiClient } from '@/features/assets/lib/apiClient';
import { z } from 'zod';
import { UserSchema, type User } from './types';

export async function listUsers(params?: { limit?: number; page?: number }): Promise<User[]> {
  const queryParams = new URLSearchParams();

  // Default to fetching all users (limit=-1) for backward compatibility
  if (params?.limit !== undefined) {
    queryParams.append('limit', params.limit.toString());
  } else {
    queryParams.append('limit', '-1');
  }

  if (params?.page !== undefined) {
    queryParams.append('page', params.page.toString());
  }

  const res = await getApiClient().get(`/users?${queryParams.toString()}`);

  // Handle both old format (array) and new format (object with data/pagination)
  const data = Array.isArray(res.data) ? res.data : res.data.data;
  return z.array(UserSchema).parse(data);
}

export async function deleteUser(userId: string): Promise<void> {
  await getApiClient().delete(`/users/${userId}`);
}


