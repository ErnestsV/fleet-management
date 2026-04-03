import { useQuery } from '@tanstack/react-query';
import { fetchDashboardSummary } from '@/lib/api/dashboard';

type UseDashboardSummaryOptions = {
  refetchInterval?: number | false;
};

export function useDashboardSummary(options?: UseDashboardSummaryOptions) {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: fetchDashboardSummary,
    refetchInterval: options?.refetchInterval ?? false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
