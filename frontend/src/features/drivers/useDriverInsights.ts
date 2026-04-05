import { useQuery } from '@tanstack/react-query';
import { fetchDriverInsights } from '@/lib/api/driverInsights';

type UseDriverInsightsOptions = {
  refetchInterval?: number | false;
};

export function useDriverInsights(options?: UseDriverInsightsOptions) {
  return useQuery({
    queryKey: ['driver-insights'],
    queryFn: fetchDriverInsights,
    refetchInterval: options?.refetchInterval ?? false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
