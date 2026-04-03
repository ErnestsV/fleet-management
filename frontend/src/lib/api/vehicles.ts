import { apiClient } from '@/lib/api/client';
import type { PaginatedResponse, Vehicle } from '@/types/domain';

export type VehicleProvisioningResponse = {
  data: Vehicle;
  provisioning_token: string;
};

function requireProvisioningToken(data: Record<string, unknown>): string {
  const token = data.provisioning_token;

  if (typeof token !== 'string' || token.length === 0) {
    throw new Error('Vehicle provisioning token was missing from the API response.');
  }

  return token;
}

export async function fetchVehicles(params?: Record<string, string | number | boolean | undefined>): Promise<PaginatedResponse<Vehicle>> {
  const { data } = await apiClient.get('/vehicles', { params });
  return data;
}

export async function fetchVehicle(vehicleId: number): Promise<{ data: Vehicle }> {
  const { data } = await apiClient.get(`/vehicles/${vehicleId}`);
  return { data: data.data ?? data };
}

export async function createVehicle(payload: Record<string, unknown>): Promise<VehicleProvisioningResponse> {
  const { data } = await apiClient.post('/vehicles', payload);
  return { data: data.data ?? data, provisioning_token: requireProvisioningToken(data) };
}

export async function updateVehicle(vehicleId: number, payload: Record<string, unknown>): Promise<{ data: Vehicle }> {
  const { data } = await apiClient.patch(`/vehicles/${vehicleId}`, payload);
  return { data: data.data ?? data };
}

export async function deleteVehicle(vehicleId: number): Promise<void> {
  await apiClient.delete(`/vehicles/${vehicleId}`);
}

export async function rotateVehicleDeviceToken(vehicleId: number): Promise<VehicleProvisioningResponse> {
  const { data } = await apiClient.post(`/vehicles/${vehicleId}/device-token/rotate`);
  return { data: data.data ?? data, provisioning_token: requireProvisioningToken(data) };
}
