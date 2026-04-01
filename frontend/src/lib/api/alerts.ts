import { apiClient } from '@/lib/api/client';
import type { AlertItem, PaginatedResponse } from '@/types/domain';

export async function fetchAlerts(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<AlertItem>> {
  const { data } = await apiClient.get('/alerts', { params });
  return data;
}
