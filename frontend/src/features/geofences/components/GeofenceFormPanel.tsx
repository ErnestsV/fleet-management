import { CheckboxField } from '@/components/ui/CheckboxField';
import { Panel } from '@/components/ui/Panel';
import type { GeofenceFormValues } from '@/features/geofences/form';

type GeofenceFormPanelProps = {
  editingId: number | null;
  form: GeofenceFormValues;
  onChange: (updater: (current: GeofenceFormValues) => GeofenceFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function GeofenceFormPanel({ editingId, form, onChange, onSubmit, onCancel }: GeofenceFormPanelProps) {
  return (
    <Panel title={editingId ? 'Edit geofence' : 'Create geofence'} description="Map drawing is placeholder-only for now; coordinates remain provider-agnostic.">
      <div className="space-y-3">
        <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Geofence name" value={form.name} onChange={(event) => onChange((state) => ({ ...state, name: event.target.value }))} />
        <div className="grid gap-3 md:grid-cols-2">
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Center latitude" value={form.center_lat} onChange={(event) => onChange((state) => ({ ...state, center_lat: event.target.value }))} />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Center longitude" value={form.center_lng} onChange={(event) => onChange((state) => ({ ...state, center_lng: event.target.value }))} />
        </div>
        <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Radius (m)" value={form.radius_m} onChange={(event) => onChange((state) => ({ ...state, radius_m: event.target.value }))} />
        <CheckboxField checked={form.is_active} onChange={(event) => onChange((state) => ({ ...state, is_active: event.target.checked }))} label="Active geofence" />
        <div className="flex gap-3">
          <button className="flex-1 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white" onClick={onSubmit}>
            {editingId ? 'Save geofence' : 'Create geofence'}
          </button>
          {editingId ? (
            <button className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700" onClick={onCancel}>
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}
