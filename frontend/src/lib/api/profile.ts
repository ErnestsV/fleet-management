import { apiClient } from '@/lib/api/client';
import type { AuthUser } from '@/types/domain';

export async function updateProfile(payload: { name: string; email: string; timezone?: string }): Promise<AuthUser> {
  const { data } = await apiClient.patch('/auth/profile', payload);
  return data.data ?? data;
}

export async function changePassword(payload: {
  current_password: string;
  password: string;
  password_confirmation: string;
}): Promise<{ message: string }> {
  const { data } = await apiClient.post('/auth/change-password', payload);
  return data;
}
