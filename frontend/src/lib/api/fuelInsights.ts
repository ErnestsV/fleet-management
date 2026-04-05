import { apiClient } from '@/lib/api/client';
import type { FuelAnomalyRow, FuelAnomalySummary, PaginatedResponse } from '@/types/domain';

export async function fetchFuelInsights(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<FuelAnomalyRow, FuelAnomalySummary>> {
  const { data } = await apiClient.get('/fuel-insights', { params });
  return data;
}

export async function resolveFuelAlert(alertId: number) {
  const { data } = await apiClient.post(`/alerts/${alertId}/resolve`);
  return data;
}
