import { apiClient } from '@/lib/api/client';
import type { GeofenceAnalyticsRow, GeofenceAnalyticsSummary, PaginatedResponse } from '@/types/domain';

export type GeofenceAnalyticsFilters = {
  search?: string;
  page?: number;
  per_page?: number;
};

export async function fetchGeofenceAnalytics(
  filters: GeofenceAnalyticsFilters = {},
): Promise<PaginatedResponse<GeofenceAnalyticsRow, GeofenceAnalyticsSummary>> {
  const { data } = await apiClient.get('/geofence-analytics', { params: filters });
  return data;
}
