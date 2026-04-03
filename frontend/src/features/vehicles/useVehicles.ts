import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createVehicle, deleteVehicle, fetchVehicle, fetchVehicles, rotateVehicleDeviceToken, updateVehicle } from '@/lib/api/vehicles';

export function useVehicles(params?: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: ['vehicles', params],
    queryFn: () => fetchVehicles(params),
  });
}

export function useVehicle(vehicleId: number | null) {
  return useQuery({
    queryKey: ['vehicle', vehicleId],
    queryFn: () => fetchVehicle(vehicleId as number),
    enabled: Boolean(vehicleId),
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVehicle,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vehicles'] }),
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ vehicleId, payload }: { vehicleId: number; payload: Record<string, unknown> }) => updateVehicle(vehicleId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', variables.vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVehicle,
    onSuccess: (_, vehicleId) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.removeQueries({ queryKey: ['vehicle', vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}

export function useRotateVehicleDeviceToken() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rotateVehicleDeviceToken,
    onSuccess: (_, vehicleId) => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicle', vehicleId] });
    },
  });
}
