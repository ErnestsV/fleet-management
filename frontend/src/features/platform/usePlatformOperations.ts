import { useQuery } from '@tanstack/react-query';
import { fetchPlatformActivity, fetchPlatformFailedJobs, fetchPlatformOperations } from '@/lib/api/platformOperations';
import type { PaginatedResponse, PlatformActivityItem, PlatformFailedJob } from '@/types/domain';

export function usePlatformOperations(enabled = true) {
  return useQuery({
    queryKey: ['platform-operations'],
    queryFn: fetchPlatformOperations,
    enabled,
    refetchInterval: 30000,
  });
}

export function usePlatformFailedJobs(params: Record<string, string | number | boolean | undefined>, enabled = true) {
  return useQuery<PaginatedResponse<PlatformFailedJob>>({
    queryKey: ['platform-failed-jobs', params],
    queryFn: () => fetchPlatformFailedJobs(params),
    enabled,
  });
}

export function usePlatformActivity(params: Record<string, string | number | boolean | undefined>, enabled = true) {
  return useQuery<PaginatedResponse<PlatformActivityItem>>({
    queryKey: ['platform-activity', params],
    queryFn: () => fetchPlatformActivity(params),
    enabled,
  });
}
