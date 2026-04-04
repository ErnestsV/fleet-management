import { Panel } from '@/components/ui/Panel';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate, formatNumber } from '@/lib/utils/format';
import type { MaintenanceSchedule } from '@/types/domain';

type MaintenanceSchedulesPanelProps = {
  items: MaintenanceSchedule[];
  isLoading: boolean;
  isError: boolean;
  onDelete: (scheduleId: number) => void;
};

export function MaintenanceSchedulesPanel({ items, isLoading, isError, onDelete }: MaintenanceSchedulesPanelProps) {
  return (
    <Panel title="Schedules" description="Current maintenance schedule definitions.">
      {isLoading ? <div className="text-sm text-slate-500">Loading schedules...</div> : null}
      {isError ? <div className="text-sm text-rose-600">Failed to load schedules.</div> : null}
      {!isLoading && !isError ? (
        items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 p-4">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-950">{item.name}</div>
                  <div className="text-sm text-slate-500">
                    {item.vehicle?.plate_number ?? item.vehicle_id}
                    {item.vehicle?.name ? ` · ${item.vehicle.name}` : ''}
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-700">
                    <div>Next due date: <span className="font-medium">{formatDate(item.next_due_date)}</span></div>
                    <div>Next due odometer: <span className="font-medium">{formatNumber(item.next_due_odometer_km, 'km')}</span></div>
                    <div>Interval days: <span className="font-medium">{item.interval_days ?? 'Not set'}</span></div>
                    <div>Interval km: <span className="font-medium">{formatNumber(item.interval_km, 'km')}</span></div>
                    <div>Status: <StatusBadge value={item.is_active ? 'active' : 'offline'} /></div>
                  </div>
                </div>
                <button className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => onDelete(item.id)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">No schedules created yet.</div>
        )
      ) : null}
    </Panel>
  );
}
