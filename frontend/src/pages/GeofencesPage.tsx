import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { DismissibleAlert } from '@/components/ui/DismissibleAlert';
import { GeofenceAnalyticsView } from '@/features/geofences/components/GeofenceAnalyticsView';
import { GeofenceManageView } from '@/features/geofences/components/GeofenceManageView';
import {
  buildGeofencePayload,
  createEmptyGeofenceFormValues,
  createGeofenceFormValuesFromGeofence,
} from '@/features/geofences/form';
import { useGeofenceAnalytics } from '@/features/geofences/useGeofenceAnalytics';
import { useCreateGeofence, useDeleteGeofence, useGeofences, useUpdateGeofence } from '@/features/geofences/useGeofences';
import { getApiErrorMessage } from '@/lib/api/errors';
import type { Geofence } from '@/types/domain';

export function GeofencesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [editing, setEditing] = useState<Geofence | null>(null);
  const [form, setForm] = useState(createEmptyGeofenceFormValues);
  const [geofenceFocusVersion, setGeofenceFocusVersion] = useState(0);
  const [focusedGeofenceCircle, setFocusedGeofenceCircle] = useState<{ latitude: number; longitude: number; radiusM: number } | null>(null);
  const [analyticsSearch, setAnalyticsSearch] = useState('');
  const [analyticsPage, setAnalyticsPage] = useState(1);
  const radiusRef = useRef(form.radius_m);
  const { data, isLoading, isError } = useGeofences();
  const activeTab = searchParams.get('tab') === 'analytics' ? 'analytics' : 'manage';
  const analyticsQuery = useGeofenceAnalytics({
    search: analyticsSearch || undefined,
    page: analyticsPage,
    per_page: 10,
  }, activeTab === 'analytics');
  const createMutation = useCreateGeofence();
  const updateMutation = useUpdateGeofence();
  const deleteMutation = useDeleteGeofence();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const dismissSuccessMessage = useCallback(() => setSuccessMessage(null), []);
  const dismissCreateError = useCallback(() => createMutation.reset(), [createMutation]);
  const dismissUpdateError = useCallback(() => updateMutation.reset(), [updateMutation]);
  const dismissDeleteError = useCallback(() => deleteMutation.reset(), [deleteMutation]);
  const deleteGeofence = useCallback((geofenceId: number) => {
    deleteMutation.mutate(geofenceId, {
      onSuccess: () => {
        if (editing?.id === geofenceId) {
          resetForm();
        }
      },
    });
  }, [deleteMutation, editing?.id]);

  useEffect(() => {
    radiusRef.current = form.radius_m;
  }, [form.radius_m]);

  useEffect(() => {
    setAnalyticsPage(1);
  }, [analyticsSearch]);

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
      <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2">
        <button
          type="button"
          className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'manage'
              ? 'bg-brand-600 text-white'
              : 'text-slate-700 hover:bg-slate-50'
          }`}
          onClick={() => setSearchParams({ tab: 'manage' })}
        >
          Manage
        </button>
        <button
          type="button"
          className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
            activeTab === 'analytics'
              ? 'bg-brand-600 text-white'
              : 'text-slate-700 hover:bg-slate-50'
          }`}
          onClick={() => setSearchParams({ tab: 'analytics' })}
        >
          Analytics
        </button>
      </div>

      {activeTab === 'manage' ? (
        <GeofenceManageView
          editing={editing}
          form={form}
          geofences={data?.data ?? []}
          isLoading={isLoading}
          isError={isError}
          geofenceFocusVersion={geofenceFocusVersion}
          focusedGeofenceCircle={focusedGeofenceCircle}
          onFormChange={setForm}
          onSubmit={submit}
          onCancel={resetForm}
          onEdit={startEditingGeofence}
          onToggleActive={toggleGeofenceActive}
          onDelete={deleteGeofence}
          onMapGeofenceSelect={handleMapGeofenceSelect}
          onMapClick={handleMapClick}
        />
      ) : (
        <GeofenceAnalyticsView
          summary={analyticsQuery.data?.summary}
          rows={analyticsQuery.data?.data ?? []}
          search={analyticsSearch}
          onSearchChange={setAnalyticsSearch}
          currentPage={analyticsQuery.data?.meta?.current_page ?? 1}
          lastPage={analyticsQuery.data?.meta?.last_page ?? 1}
          onPageChange={setAnalyticsPage}
          isLoading={analyticsQuery.isLoading}
          isError={analyticsQuery.isError}
        />
      )}
    </div>
  );
}
