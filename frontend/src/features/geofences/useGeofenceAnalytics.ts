import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchGeofenceAnalytics, type GeofenceAnalyticsFilters } from '@/lib/api/geofenceAnalytics';

export function useGeofenceAnalytics(filters: GeofenceAnalyticsFilters, enabled = true) {
  return useQuery({
    queryKey: ['geofence-analytics', filters],
    queryFn: () => fetchGeofenceAnalytics(filters),
    placeholderData: keepPreviousData,
    enabled,
  });
}
