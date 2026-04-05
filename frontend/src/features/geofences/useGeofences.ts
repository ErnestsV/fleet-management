import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createGeofence, deleteGeofence, fetchGeofences, updateGeofence } from '@/lib/api/geofences';

export function useGeofences() {
  return useQuery({
    queryKey: ['geofences'],
    queryFn: fetchGeofences,
  });
}

export function useCreateGeofence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createGeofence,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofences'] });
      queryClient.invalidateQueries({ queryKey: ['geofence-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}

export function useUpdateGeofence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ geofenceId, payload }: { geofenceId: number; payload: Record<string, unknown> }) => updateGeofence(geofenceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofences'] });
      queryClient.invalidateQueries({ queryKey: ['geofence-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}

export function useDeleteGeofence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteGeofence,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofences'] });
      queryClient.invalidateQueries({ queryKey: ['geofence-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}
