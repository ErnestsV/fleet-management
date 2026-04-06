import { useQuery } from '@tanstack/react-query';
import { fetchDriverInsights } from '@/lib/api/driverInsights';
import type { DriverInsightsSummary } from '@/types/domain';

type UseDriverInsightsOptions = {
  refetchInterval?: number | false;
};

export function useDriverInsights(options?: UseDriverInsightsOptions) {
  return useQuery<DriverInsightsSummary>({
    queryKey: ['driver-insights'],
    queryFn: fetchDriverInsights,
    refetchInterval: options?.refetchInterval ?? false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
