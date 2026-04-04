import { Panel } from '@/components/ui/Panel';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Geofence } from '@/types/domain';

type GeofenceListPanelProps = {
  geofences: Geofence[];
  isLoading: boolean;
  isError: boolean;
  onEdit: (geofence: Geofence) => void;
  onToggleActive: (geofence: Geofence) => void;
  onDelete: (geofenceId: number) => void;
};

export function GeofenceListPanel({ geofences, isLoading, isError, onEdit, onToggleActive, onDelete }: GeofenceListPanelProps) {
  return (
    <Panel title="Geofence list" description="Entry and exit alerts are generated from current vehicle position against active circle geofences.">
      {isLoading ? <div className="text-sm text-slate-500">Loading geofences...</div> : null}
      {isError ? <div className="text-sm text-rose-600">Failed to load geofences.</div> : null}
      {!isLoading && !isError ? (
        geofences.length > 0 ? (
          <div className="space-y-3">
            {geofences.map((geofence) => (
              <div key={geofence.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4">
                <button type="button" className="text-left" onClick={() => onEdit(geofence)}>
                  <div className="font-semibold">{geofence.name}</div>
                  <div className="text-sm text-slate-500">{geofence.geometry.radius_m} m radius</div>
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={geofence.is_active ? 'active' : 'offline'} />
                  <button type="button" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold" onClick={() => onEdit(geofence)}>
                    Edit
                  </button>
                  <button type="button" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold" onClick={() => onToggleActive(geofence)}>
                    {geofence.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button type="button" className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => onDelete(geofence.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-sm text-slate-500">No geofences have been created yet.</div>
        )
      ) : null}
    </Panel>
  );
}
