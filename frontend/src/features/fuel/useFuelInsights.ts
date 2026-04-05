import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchFuelInsights, resolveFuelAlert } from '@/lib/api/fuelInsights';

type UseFuelInsightsOptions = {
  refetchInterval?: number | false;
};

export function useFuelInsights(
  params?: Record<string, string | number | boolean | undefined>,
  options?: UseFuelInsightsOptions,
) {
  return useQuery({
    queryKey: ['fuel-insights', params],
    queryFn: () => fetchFuelInsights(params),
    refetchInterval: options?.refetchInterval ?? false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
}

export function useResolveFuelAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resolveFuelAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-insights'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}
