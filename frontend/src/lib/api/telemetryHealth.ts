import { apiClient } from '@/lib/api/client';
import type { PaginatedResponse, TelemetryHealthRow, TelemetryHealthSummary } from '@/types/domain';

export async function fetchTelemetryHealth(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<TelemetryHealthRow, TelemetryHealthSummary>> {
  const { data } = await apiClient.get('/telemetry-health', { params });
  return data;
}
