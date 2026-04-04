import { useCallback, useEffect, useRef, useState } from 'react';
import { OperationsMap } from '@/components/maps/OperationsMap';
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
import { getApiErrorMessage } from '@/lib/api/errors';
import type { Geofence } from '@/types/domain';

export function GeofencesPage() {
  const [editing, setEditing] = useState<Geofence | null>(null);
  const [form, setForm] = useState(createEmptyGeofenceFormValues);
  const [geofenceFocusVersion, setGeofenceFocusVersion] = useState(0);
  const [focusedGeofenceCircle, setFocusedGeofenceCircle] = useState<{ latitude: number; longitude: number; radiusM: number } | null>(null);
  const radiusRef = useRef(form.radius_m);
  const { data, isLoading, isError } = useGeofences();
  const createMutation = useCreateGeofence();
  const updateMutation = useUpdateGeofence();
  const deleteMutation = useDeleteGeofence();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const dismissSuccessMessage = useCallback(() => setSuccessMessage(null), []);
  const dismissCreateError = useCallback(() => createMutation.reset(), [createMutation]);
  const dismissUpdateError = useCallback(() => updateMutation.reset(), [updateMutation]);
  const dismissDeleteError = useCallback(() => deleteMutation.reset(), [deleteMutation]);

  useEffect(() => {
    radiusRef.current = form.radius_m;
  }, [form.radius_m]);

  const resetForm = () => {
    setEditing(null);
    setForm(createEmptyGeofenceFormValues());
    setFocusedGeofenceCircle(null);
  };

  const startEditingGeofence = useCallback((geofence: Geofence) => {
    setEditing(geofence);
    setForm(createGeofenceFormValuesFromGeofence(geofence));
    setFocusedGeofenceCircle({
      latitude: geofence.geometry.center?.lat ?? 0,
      longitude: geofence.geometry.center?.lng ?? 0,
      radiusM: geofence.geometry.radius_m ?? 0,
    });
    setGeofenceFocusVersion((current) => current + 1);
  }, []);

  const toggleGeofenceActive = useCallback((geofence: Geofence) => {
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
    });
  }, [editing?.id, updateMutation]);

  const handleMapGeofenceSelect = useCallback((geofenceId: number | string) => {
    const geofence = (data?.data ?? []).find((item) => item.id === Number(geofenceId));

    if (!geofence) {
      return;
    }

    startEditingGeofence(geofence);
  }, [data?.data, startEditingGeofence]);

  const handleMapClick = useCallback(({ latitude, longitude }: { latitude: number; longitude: number }) => {
    setForm((state) => ({
      ...state,
      center_lat: latitude.toFixed(6),
      center_lng: longitude.toFixed(6),
    }));

    setFocusedGeofenceCircle((current) => ({
      latitude,
      longitude,
      radiusM: current?.radiusM ?? Number(radiusRef.current || 0),
    }));
  }, []);

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
          <OperationsMap
            geofenceCircles={[
              ...(data?.data ?? [])
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
            fullscreenSidebar={
              <GeofenceListPanel
                geofences={data?.data ?? []}
                isLoading={isLoading}
                isError={isError}
                framed={false}
                stickySearch
                scrollable
                onEdit={startEditingGeofence}
                onToggleActive={toggleGeofenceActive}
                onDelete={(geofenceId) => deleteMutation.mutate(geofenceId)}
              />
            }
            heightClassName="min-h-[420px]"
            onGeofenceSelect={handleMapGeofenceSelect}
            onMapClick={handleMapClick}
          />
          <GeofenceListPanel
            geofences={data?.data ?? []}
            isLoading={isLoading}
            isError={isError}
            onEdit={startEditingGeofence}
            onToggleActive={toggleGeofenceActive}
            onDelete={(geofenceId) => deleteMutation.mutate(geofenceId)}
          />
        </div>
      </div>
    </div>
  );
}
