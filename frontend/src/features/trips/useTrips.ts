import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { fetchTrip, fetchTrips, fetchVehicleTrips } from '@/lib/api/trips';
import type { PaginatedResponse, Trip, TripSummary } from '@/types/domain';

export function useTrips(params?: Record<string, string | number | boolean | undefined>) {
  return useQuery<PaginatedResponse<Trip, TripSummary>>({
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
  return useQuery<PaginatedResponse<Trip, TripSummary>>({
    queryKey: ['vehicle-trips', vehicleId],
    queryFn: () => fetchVehicleTrips(vehicleId as number),
    enabled: Boolean(vehicleId),
  });
}
