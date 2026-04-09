import { useQuery } from '@tanstack/react-query';
import { fetchAlerts } from '@/lib/api/alerts';
import type { AlertItem, PaginatedResponse } from '@/types/domain';

type UseAlertsOptions = {
  enabled?: boolean;
  refetchInterval?: number | false;
};

export function useAlerts(
  params?: Record<string, string | number | boolean | undefined>,
  options?: UseAlertsOptions,
) {
  return useQuery<PaginatedResponse<AlertItem>>({
    queryKey: ['alerts', params],
    queryFn: () => fetchAlerts(params),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval ?? false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
