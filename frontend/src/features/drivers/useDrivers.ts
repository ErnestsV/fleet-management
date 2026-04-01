import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createDriver, deleteDriver, fetchDriver, fetchDrivers, updateDriver } from '@/lib/api/drivers';

export function useDrivers(params?: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: ['drivers', params],
    queryFn: () => fetchDrivers(params),
  });
}

export function useDriver(driverId: number | null) {
  return useQuery({
    queryKey: ['driver', driverId],
    queryFn: () => fetchDriver(driverId as number),
    enabled: Boolean(driverId),
  });
}

export function useCreateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDriver,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] }),
  });
}

export function useUpdateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ driverId, payload }: { driverId: number; payload: Record<string, unknown> }) => updateDriver(driverId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['driver', variables.driverId] });
    },
  });
}

export function useDeleteDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDriver,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['drivers'] }),
  });
}
