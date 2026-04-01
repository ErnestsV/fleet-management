import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { CheckboxField } from '@/components/ui/CheckboxField';
import { Panel } from '@/components/ui/Panel';
import { useCreateGeofence, useDeleteGeofence, useGeofences, useUpdateGeofence } from '@/features/geofences/useGeofences';
import { MapPlaceholder } from '@/components/maps/MapPlaceholder';
import type { Geofence } from '@/types/domain';

export function GeofencesPage() {
  const [editing, setEditing] = useState<Geofence | null>(null);
  const [form, setForm] = useState({
    name: '',
    center_lat: '56.9496',
    center_lng: '24.1052',
    radius_m: '500',
    is_active: true,
  });
  const { data, isLoading, isError } = useGeofences();
  const createMutation = useCreateGeofence();
  const updateMutation = useUpdateGeofence();
  const deleteMutation = useDeleteGeofence();

  const submit = () => {
    const payload = {
      name: form.name,
      type: 'circle',
      is_active: form.is_active,
      geometry: {
        center: {
          lat: Number(form.center_lat),
          lng: Number(form.center_lng),
        },
        radius_m: Number(form.radius_m),
      },
    };

    if (editing) {
      updateMutation.mutate({ geofenceId: editing.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div>
      <PageHeader title="Geofences" description="Circle geofences for the MVP UI with polygon-ready backend geometry." />
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
        <Panel title={editing ? 'Edit geofence' : 'Create geofence'} description="Map drawing is placeholder-only for now; coordinates remain provider-agnostic.">
          <div className="space-y-3">
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Geofence name" value={form.name} onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))} />
            <div className="grid gap-3 md:grid-cols-2">
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Center latitude" value={form.center_lat} onChange={(event) => setForm((state) => ({ ...state, center_lat: event.target.value }))} />
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Center longitude" value={form.center_lng} onChange={(event) => setForm((state) => ({ ...state, center_lng: event.target.value }))} />
            </div>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Radius (m)" value={form.radius_m} onChange={(event) => setForm((state) => ({ ...state, radius_m: event.target.value }))} />
            <CheckboxField checked={form.is_active} onChange={(event) => setForm((state) => ({ ...state, is_active: event.target.checked }))} label="Active geofence" />
            <button className="w-full rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white" onClick={submit}>
              {editing ? 'Save geofence' : 'Create geofence'}
            </button>
          </div>
        </Panel>
        <div className="space-y-6">
          <MapPlaceholder />
          <Panel title="Geofence list" description="Entry and exit alerts are generated from current vehicle position against active circle geofences.">
            {isLoading ? <div className="text-sm text-slate-500">Loading geofences...</div> : null}
            {isError ? <div className="text-sm text-rose-600">Failed to load geofences.</div> : null}
            {!isLoading && !isError ? (
              (data?.data?.length ?? 0) > 0 ? (
                <div className="space-y-3">
                  {(data?.data ?? []).map((geofence) => (
                    <div key={geofence.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                      <button
                        className="text-left"
                        onClick={() => {
                          setEditing(geofence);
                          setForm({
                            name: geofence.name,
                            center_lat: String(geofence.geometry.center?.lat ?? ''),
                            center_lng: String(geofence.geometry.center?.lng ?? ''),
                            radius_m: String(geofence.geometry.radius_m ?? ''),
                            is_active: geofence.is_active,
                          });
                        }}
                      >
                        <div className="font-semibold">{geofence.name}</div>
                        <div className="text-sm text-slate-500">{geofence.geometry.radius_m} m radius</div>
                      </button>
                      <button className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => deleteMutation.mutate(geofence.id)}>
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-sm text-slate-500">No geofences have been created yet.</div>
              )
            ) : null}
          </Panel>
        </div>
      </div>
    </div>
  );
}
