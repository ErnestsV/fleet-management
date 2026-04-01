import { apiClient } from '@/lib/api/client';
import type { DashboardSummary } from '@/types/domain';

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await apiClient.get('/dashboard/summary');
  return data;
}
