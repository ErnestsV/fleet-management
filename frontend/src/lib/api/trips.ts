import { apiClient } from '@/lib/api/client';
import type { PaginatedResponse, Trip, TripSummary } from '@/types/domain';

export async function fetchTrips(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<Trip, TripSummary>> {
  const { data } = await apiClient.get('/trips', { params });
  return data;
}

export async function fetchVehicleTrips(vehicleId: number): Promise<PaginatedResponse<Trip, TripSummary>> {
  const { data } = await apiClient.get(`/vehicles/${vehicleId}/trips`);
  return data;
}

export async function fetchTrip(tripId: number): Promise<{ data: Trip }> {
  const { data } = await apiClient.get(`/trips/${tripId}`);
  return { data: data.data ?? data };
}
