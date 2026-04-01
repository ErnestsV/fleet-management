import { apiClient } from '@/lib/api/client';
import type { Assignment, PaginatedResponse } from '@/types/domain';

export async function fetchAssignments(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<Assignment>> {
  const { data } = await apiClient.get('/vehicle-driver-assignments', { params });
  return data;
}

export async function createAssignment(payload: {
  vehicle_id: number;
  driver_id: number;
  assigned_from: string;
  assigned_until?: string | null;
}): Promise<{ data: Assignment }> {
  const { data } = await apiClient.post('/vehicle-driver-assignments', payload);
  return { data: data.data ?? data };
}

export async function endAssignment(assignmentId: number, assigned_until: string): Promise<{ data: Assignment }> {
  const { data } = await apiClient.post(`/vehicle-driver-assignments/${assignmentId}/end`, { assigned_until });
  return { data: data.data ?? data };
}
