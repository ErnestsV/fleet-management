import { useQuery } from '@tanstack/react-query';
import { fetchAlerts } from '@/lib/api/alerts';

export function useAlerts(params?: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: ['alerts', params],
    queryFn: () => fetchAlerts(params),
  });
}
