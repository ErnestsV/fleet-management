import { apiClient } from '@/lib/api/client';
import type { PaginatedResponse, PlatformActivityItem, PlatformFailedJob, PlatformOperationsSummary } from '@/types/domain';

export async function fetchPlatformOperations(): Promise<{ data: PlatformOperationsSummary }> {
  const { data } = await apiClient.get('/platform/operations');

  return data;
}

export async function fetchPlatformFailedJobs(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<PlatformFailedJob>> {
  const { data } = await apiClient.get('/platform/failed-jobs', { params });

  return data;
}

export async function fetchPlatformActivity(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<PlatformActivityItem>> {
  const { data } = await apiClient.get('/platform/activity', { params });

  return data;
}
