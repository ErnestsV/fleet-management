import { apiClient } from '@/lib/api/client';
import type { Geofence, PaginatedResponse } from '@/types/domain';

export async function fetchGeofences(): Promise<PaginatedResponse<Geofence>> {
  const { data } = await apiClient.get('/geofences');
  return data;
}

export async function createGeofence(payload: Record<string, unknown>): Promise<{ data: Geofence }> {
  const { data } = await apiClient.post('/geofences', payload);
  return { data: data.data ?? data };
}

export async function updateGeofence(geofenceId: number, payload: Record<string, unknown>): Promise<{ data: Geofence }> {
  const { data } = await apiClient.patch(`/geofences/${geofenceId}`, payload);
  return { data: data.data ?? data };
}

export async function deleteGeofence(geofenceId: number): Promise<void> {
  await apiClient.delete(`/geofences/${geofenceId}`);
}
