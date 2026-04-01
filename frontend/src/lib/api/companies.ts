import { apiClient } from '@/lib/api/client';
import type { Company, PaginatedResponse } from '@/types/domain';

export async function fetchCompanies(): Promise<PaginatedResponse<Company>> {
  const { data } = await apiClient.get('/companies');
  return data;
}

export async function createCompany(payload: {
  name: string;
  timezone?: string;
  is_active: boolean;
  owner?: {
    name: string;
    email: string;
    password?: string;
    role: 'owner' | 'admin';
  };
}): Promise<{ data: Company }> {
  const { data } = await apiClient.post('/companies', payload);
  return { data: data.data ?? data };
}

export async function updateCompany(
  companyId: number,
  payload: {
    name: string;
    timezone?: string;
    slug?: string;
    is_active: boolean;
  },
): Promise<{ data: Company }> {
  const { data } = await apiClient.patch(`/companies/${companyId}`, payload);
  return { data: data.data ?? data };
}
