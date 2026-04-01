import { apiClient } from '@/lib/api/client';
import type { AuthUser, PaginatedResponse, UserRole } from '@/types/domain';

export async function fetchUsers(): Promise<PaginatedResponse<AuthUser>> {
  const { data } = await apiClient.get('/users');
  return data;
}

export async function createUser(payload: {
  company_id?: number | null;
  name: string;
  email: string;
  password?: string;
  timezone?: string;
  is_active?: boolean;
  role: UserRole;
}): Promise<{ data: AuthUser }> {
  const { data } = await apiClient.post('/users', payload);
  return { data: data.data ?? data };
}

export async function updateUser(
  userId: number,
  payload: {
    name: string;
    email: string;
    password?: string;
    timezone?: string;
    is_active: boolean;
    role: UserRole;
  },
): Promise<{ data: AuthUser }> {
  const { data } = await apiClient.patch(`/users/${userId}`, payload);
  return { data: data.data ?? data };
}
