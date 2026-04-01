import { apiClient } from '@/lib/api/client';
import type { Driver, PaginatedResponse } from '@/types/domain';

export async function fetchDrivers(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<Driver>> {
  const { data } = await apiClient.get('/drivers', { params });
  return data;
}

export async function fetchDriver(driverId: number): Promise<{ data: Driver }> {
  const { data } = await apiClient.get(`/drivers/${driverId}`);
  return { data: data.data ?? data };
}

export async function createDriver(payload: Record<string, unknown>): Promise<{ data: Driver }> {
  const { data } = await apiClient.post('/drivers', payload);
  return { data: data.data ?? data };
}

export async function updateDriver(driverId: number, payload: Record<string, unknown>): Promise<{ data: Driver }> {
  const { data } = await apiClient.patch(`/drivers/${driverId}`, payload);
  return { data: data.data ?? data };
}

export async function deleteDriver(driverId: number): Promise<void> {
  await apiClient.delete(`/drivers/${driverId}`);
}
