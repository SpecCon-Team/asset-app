import { getApiClient } from '@/features/assets/lib/apiClient';
import { z } from 'zod';
import { UserSchema, type User } from './types';

export async function listUsers(): Promise<User[]> {
  const res = await getApiClient().get('/users');
  return z.array(UserSchema).parse(res.data);
}


