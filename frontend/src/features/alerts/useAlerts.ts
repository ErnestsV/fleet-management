import { useQuery } from '@tanstack/react-query';
import { fetchAlerts } from '@/lib/api/alerts';

type UseAlertsOptions = {
  refetchInterval?: number | false;
};

export function useAlerts(
  params?: Record<string, string | number | boolean | undefined>,
  options?: UseAlertsOptions,
) {
  return useQuery({
    queryKey: ['alerts', params],
    queryFn: () => fetchAlerts(params),
    refetchInterval: options?.refetchInterval ?? false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
