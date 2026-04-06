import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchTelemetryHealth } from '@/lib/api/telemetryHealth';
import type { PaginatedResponse, TelemetryHealthRow, TelemetryHealthSummary } from '@/types/domain';

type UseTelemetryHealthOptions = {
  refetchInterval?: number | false;
};

export function useTelemetryHealth(
  params?: Record<string, string | number | boolean | undefined>,
  options?: UseTelemetryHealthOptions,
) {
  return useQuery<PaginatedResponse<TelemetryHealthRow, TelemetryHealthSummary>>({
    queryKey: ['telemetry-health', params],
    queryFn: () => fetchTelemetryHealth(params),
    refetchInterval: options?.refetchInterval ?? false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
}
