import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createMaintenanceRecord,
  createMaintenanceSchedule,
  deleteMaintenanceRecord,
  deleteMaintenanceSchedule,
  fetchMaintenanceRecords,
  fetchMaintenanceSchedules,
  fetchUpcomingMaintenance,
  updateMaintenanceRecord,
  updateMaintenanceSchedule,
} from '@/lib/api/maintenance';

export function useMaintenanceSchedules(params?: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: ['maintenance-schedules', params],
    queryFn: () => fetchMaintenanceSchedules(params),
  });
}

export function useUpcomingMaintenance() {
  return useQuery({
    queryKey: ['maintenance-upcoming'],
    queryFn: fetchUpcomingMaintenance,
  });
}

export function useMaintenanceRecords(params?: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: ['maintenance-records', params],
    queryFn: () => fetchMaintenanceRecords(params),
  });
}

export function useCreateMaintenanceSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMaintenanceSchedule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance-schedules'] }),
  });
}

export function useUpdateMaintenanceSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ scheduleId, payload }: { scheduleId: number; payload: Record<string, unknown> }) => updateMaintenanceSchedule(scheduleId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance-schedules'] }),
  });
}

export function useDeleteMaintenanceSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMaintenanceSchedule,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance-schedules'] }),
  });
}

export function useCreateMaintenanceRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMaintenanceRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-records'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-upcoming'] });
    },
  });
}

export function useUpdateMaintenanceRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ recordId, payload }: { recordId: number; payload: Record<string, unknown> }) => updateMaintenanceRecord(recordId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-records'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-upcoming'] });
    },
  });
}

export function useDeleteMaintenanceRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteMaintenanceRecord,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance-records'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance-upcoming'] });
    },
  });
}
