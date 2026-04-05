import { OperationsMap } from '@/components/maps/OperationsMap';
import { GeofenceFormPanel } from '@/features/geofences/components/GeofenceFormPanel';
import { GeofenceListPanel } from '@/features/geofences/components/GeofenceListPanel';
import type { GeofenceFormValues } from '@/features/geofences/form';
import type { Geofence } from '@/types/domain';
import type { Dispatch, SetStateAction } from 'react';

type GeofenceManageViewProps = {
  editing: Geofence | null;
  form: GeofenceFormValues;
  geofences: Geofence[];
  isLoading: boolean;
  isError: boolean;
  geofenceFocusVersion: number;
  focusedGeofenceCircle: { latitude: number; longitude: number; radiusM: number } | null;
  onFormChange: Dispatch<SetStateAction<GeofenceFormValues>>;
  onSubmit: () => void;
  onCancel: () => void;
  onEdit: (geofence: Geofence) => void;
  onToggleActive: (geofence: Geofence) => void;
  onDelete: (geofenceId: number) => void;
  onMapGeofenceSelect: (geofenceId: number | string) => void;
  onMapClick: ({ latitude, longitude }: { latitude: number; longitude: number }) => void;
};

export function GeofenceManageView({
  editing,
  form,
  geofences,
  isLoading,
  isError,
  geofenceFocusVersion,
  focusedGeofenceCircle,
  onFormChange,
  onSubmit,
  onCancel,
  onEdit,
  onToggleActive,
  onDelete,
  onMapGeofenceSelect,
  onMapClick,
}: GeofenceManageViewProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
      <GeofenceFormPanel editingId={editing?.id ?? null} form={form} onChange={onFormChange} onSubmit={onSubmit} onCancel={onCancel} />
      <div className="space-y-6">
        <OperationsMap
          geofenceCircles={[
            ...geofences
              .filter((geofence) => geofence.id !== editing?.id)
              .map((geofence) => ({
                id: geofence.id,
                label: geofence.name,
                latitude: geofence.geometry.center?.lat ?? 0,
                longitude: geofence.geometry.center?.lng ?? 0,
                radiusM: geofence.geometry.radius_m ?? 0,
                isActive: geofence.is_active,
              })),
            ...(form.center_lat && form.center_lng && form.radius_m ? [{
              id: editing?.id ?? 'draft-geofence',
              label: editing ? `${form.name || 'Selected geofence'} (editing)` : `${form.name || 'Draft geofence'} (draft)`,
              latitude: Number(form.center_lat),
              longitude: Number(form.center_lng),
              radiusM: Number(form.radius_m),
              isActive: form.is_active,
            }] : []),
          ]}
          selectedGeofenceId={editing?.id ?? null}
          geofenceFocusKey={editing ? `${editing.id}:${geofenceFocusVersion}` : null}
          focusedGeofenceCircle={focusedGeofenceCircle}
          caption="Click the map to set the geofence center. Expand for precise review and editing."
          emptyMessage="No geofence geometry is available yet."
          allowFullscreen
          fullscreenSidebarTitle="Geofence list"
          fullscreenSidebar={(
            <GeofenceListPanel
              geofences={geofences}
              isLoading={isLoading}
              isError={isError}
              framed={false}
              stickySearch
              scrollable
              onEdit={onEdit}
              onToggleActive={onToggleActive}
              onDelete={onDelete}
            />
          )}
          heightClassName="min-h-[420px]"
          onGeofenceSelect={onMapGeofenceSelect}
          onMapClick={onMapClick}
        />
        <GeofenceListPanel
          geofences={geofences}
          isLoading={isLoading}
          isError={isError}
          onEdit={onEdit}
          onToggleActive={onToggleActive}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}
