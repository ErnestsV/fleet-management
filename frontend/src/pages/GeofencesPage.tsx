import { useCallback, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DismissibleAlert } from '@/components/ui/DismissibleAlert';
import { GeofenceFormPanel } from '@/features/geofences/components/GeofenceFormPanel';
import { GeofenceListPanel } from '@/features/geofences/components/GeofenceListPanel';
import {
  buildGeofencePayload,
  createEmptyGeofenceFormValues,
  createGeofenceFormValuesFromGeofence,
} from '@/features/geofences/form';
import { useCreateGeofence, useDeleteGeofence, useGeofences, useUpdateGeofence } from '@/features/geofences/useGeofences';
import { MapPlaceholder } from '@/components/maps/MapPlaceholder';
import { getApiErrorMessage } from '@/lib/api/errors';
import type { Geofence } from '@/types/domain';

export function GeofencesPage() {
  const [editing, setEditing] = useState<Geofence | null>(null);
  const [form, setForm] = useState(createEmptyGeofenceFormValues);
  const { data, isLoading, isError } = useGeofences();
  const createMutation = useCreateGeofence();
  const updateMutation = useUpdateGeofence();
  const deleteMutation = useDeleteGeofence();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const dismissSuccessMessage = useCallback(() => setSuccessMessage(null), []);
  const dismissCreateError = useCallback(() => createMutation.reset(), [createMutation]);
  const dismissUpdateError = useCallback(() => updateMutation.reset(), [updateMutation]);
  const dismissDeleteError = useCallback(() => deleteMutation.reset(), [deleteMutation]);

  const resetForm = () => {
    setEditing(null);
    setForm(createEmptyGeofenceFormValues());
  };

  const submit = () => {
    const payload = buildGeofencePayload(form);

    if (editing) {
      updateMutation.mutate({ geofenceId: editing.id, payload }, {
        onSuccess: () => {
          setSuccessMessage('Geofence updated successfully.');
          resetForm();
        },
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setSuccessMessage('Geofence created successfully.');
          resetForm();
        },
      });
    }
  };

  return (
    <div>
      <PageHeader title="Geofences" description="Circle geofences for the MVP UI with polygon-ready backend geometry." />
      {successMessage ? <DismissibleAlert className="mb-6" message={successMessage} onClose={dismissSuccessMessage} /> : null}
      {createMutation.isError ? <DismissibleAlert className="mb-6" tone="error" message={getApiErrorMessage(createMutation.error)} onClose={dismissCreateError} /> : null}
      {updateMutation.isError ? <DismissibleAlert className="mb-6" tone="error" message={getApiErrorMessage(updateMutation.error)} onClose={dismissUpdateError} /> : null}
      {deleteMutation.isError ? <DismissibleAlert className="mb-6" tone="error" message={getApiErrorMessage(deleteMutation.error)} onClose={dismissDeleteError} /> : null}
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <GeofenceFormPanel editingId={editing?.id ?? null} form={form} onChange={setForm} onSubmit={submit} onCancel={resetForm} />
        <div className="space-y-6">
          <MapPlaceholder />
          <GeofenceListPanel
            geofences={data?.data ?? []}
            isLoading={isLoading}
            isError={isError}
            onEdit={(geofence) => {
              setEditing(geofence);
              setForm(createGeofenceFormValuesFromGeofence(geofence));
            }}
            onToggleActive={(geofence) =>
              updateMutation.mutate({
                geofenceId: geofence.id,
                payload: {
                  name: geofence.name,
                  type: geofence.type,
                  is_active: !geofence.is_active,
                  geometry: geofence.geometry,
                },
              }, {
                onSuccess: () => {
                  setSuccessMessage(`Geofence ${!geofence.is_active ? 'activated' : 'deactivated'} successfully.`);
                  if (editing?.id === geofence.id) {
                    resetForm();
                  }
                },
              })
            }
            onDelete={(geofenceId) => deleteMutation.mutate(geofenceId)}
          />
        </div>
      </div>
    </div>
  );
}
