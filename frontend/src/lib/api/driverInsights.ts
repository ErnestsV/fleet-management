import { apiClient } from '@/lib/api/client';
import type { DriverInsightsSummary } from '@/types/domain';

export async function fetchDriverInsights(): Promise<DriverInsightsSummary> {
  const { data } = await apiClient.get('/driver-insights');
  return data;
}
