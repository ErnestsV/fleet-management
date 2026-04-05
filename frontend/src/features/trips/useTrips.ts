import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchTrip, fetchTrips, fetchVehicleTrips } from '@/lib/api/trips';

export function useTrips(params?: Record<string, string | number | boolean | undefined>) {
  return useQuery({
    queryKey: ['trips', params],
    queryFn: () => fetchTrips(params),
    placeholderData: keepPreviousData,
  });
}

export function useTrip(tripId: number | null) {
  return useQuery({
    queryKey: ['trip', tripId],
    queryFn: () => fetchTrip(tripId as number),
    enabled: Boolean(tripId),
  });
}

export function useVehicleTrips(vehicleId: number | null) {
  return useQuery({
    queryKey: ['vehicle-trips', vehicleId],
    queryFn: () => fetchVehicleTrips(vehicleId as number),
    enabled: Boolean(vehicleId),
  });
}
