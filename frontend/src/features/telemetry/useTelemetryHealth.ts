import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchTelemetryHealth } from '@/lib/api/telemetryHealth';

type UseTelemetryHealthOptions = {
  refetchInterval?: number | false;
};

export function useTelemetryHealth(
  params?: Record<string, string | number | boolean | undefined>,
  options?: UseTelemetryHealthOptions,
) {
  return useQuery({
    queryKey: ['telemetry-health', params],
    queryFn: () => fetchTelemetryHealth(params),
    refetchInterval: options?.refetchInterval ?? false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
}
