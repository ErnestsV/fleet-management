import type { Geofence } from '@/types/domain';

export type GeofenceFormValues = {
  name: string;
  center_lat: string;
  center_lng: string;
  radius_m: string;
  is_active: boolean;
};

export function createEmptyGeofenceFormValues(): GeofenceFormValues {
  return {
    name: '',
    center_lat: '56.9496',
    center_lng: '24.1052',
    radius_m: '500',
    is_active: true,
  };
}

export function createGeofenceFormValuesFromGeofence(geofence: Geofence): GeofenceFormValues {
  return {
    name: geofence.name,
    center_lat: String(geofence.geometry.center?.lat ?? ''),
    center_lng: String(geofence.geometry.center?.lng ?? ''),
    radius_m: String(geofence.geometry.radius_m ?? ''),
    is_active: geofence.is_active,
  };
}

export function buildGeofencePayload(form: GeofenceFormValues) {
  return {
    name: form.name,
    type: 'circle' as const,
    is_active: form.is_active,
    geometry: {
      center: {
        lat: Number(form.center_lat),
        lng: Number(form.center_lng),
      },
      radius_m: Number(form.radius_m),
    },
  };
}
