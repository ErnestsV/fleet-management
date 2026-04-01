import { apiClient } from '@/lib/api/client';
import type { MaintenanceRecord, MaintenanceSchedule, PaginatedResponse } from '@/types/domain';

export async function fetchMaintenanceSchedules(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<MaintenanceSchedule>> {
  const { data } = await apiClient.get('/maintenance-schedules', { params });
  return data;
}

export async function fetchUpcomingMaintenance(): Promise<PaginatedResponse<MaintenanceSchedule>> {
  const { data } = await apiClient.get('/maintenance-upcoming');
  return data;
}

export async function createMaintenanceSchedule(payload: Record<string, unknown>): Promise<{ data: MaintenanceSchedule }> {
  const { data } = await apiClient.post('/maintenance-schedules', payload);
  return { data: data.data ?? data };
}

export async function updateMaintenanceSchedule(scheduleId: number, payload: Record<string, unknown>): Promise<{ data: MaintenanceSchedule }> {
  const { data } = await apiClient.patch(`/maintenance-schedules/${scheduleId}`, payload);
  return { data: data.data ?? data };
}

export async function deleteMaintenanceSchedule(scheduleId: number): Promise<void> {
  await apiClient.delete(`/maintenance-schedules/${scheduleId}`);
}

export async function fetchMaintenanceRecords(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<MaintenanceRecord>> {
  const { data } = await apiClient.get('/maintenance-records', { params });
  return data;
}

export async function createMaintenanceRecord(payload: Record<string, unknown>): Promise<{ data: MaintenanceRecord }> {
  const { data } = await apiClient.post('/maintenance-records', payload);
  return { data: data.data ?? data };
}

export async function updateMaintenanceRecord(recordId: number, payload: Record<string, unknown>): Promise<{ data: MaintenanceRecord }> {
  const { data } = await apiClient.patch(`/maintenance-records/${recordId}`, payload);
  return { data: data.data ?? data };
}

export async function deleteMaintenanceRecord(recordId: number): Promise<void> {
  await apiClient.delete(`/maintenance-records/${recordId}`);
}
