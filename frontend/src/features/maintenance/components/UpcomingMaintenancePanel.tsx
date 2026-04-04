import { Panel } from '@/components/ui/Panel';
import { formatDate, formatNumber } from '@/lib/utils/format';
import type { MaintenanceSchedule } from '@/types/domain';

type UpcomingMaintenancePanelProps = {
  items: MaintenanceSchedule[];
  isLoading: boolean;
  isError: boolean;
};

export function UpcomingMaintenancePanel({ items, isLoading, isError }: UpcomingMaintenancePanelProps) {
  return (
    <Panel title="Upcoming" description="Schedules due soon by date or mileage.">
      {isLoading ? <div className="text-sm text-slate-500">Loading upcoming maintenance...</div> : null}
      {isError ? <div className="text-sm text-rose-600">Failed to load upcoming maintenance.</div> : null}
      {!isLoading && !isError ? (
        items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-950">{item.name}</div>
                    <div className="text-sm text-slate-500">
                      {item.vehicle?.plate_number ?? item.vehicle_id}
                      {item.vehicle?.name ? ` · ${item.vehicle.name}` : ''}
                    </div>
                  </div>
                  <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                    {item.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-slate-700">
                  <div>Due date: <span className="font-medium">{formatDate(item.next_due_date)}</span></div>
                  <div>Due odometer: <span className="font-medium">{formatNumber(item.next_due_odometer_km, 'km')}</span></div>
                  <div>Interval: <span className="font-medium">{item.interval_days ? `${item.interval_days} days` : 'No day interval'}</span>{item.interval_km ? ` · ${formatNumber(item.interval_km, 'km')}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">No upcoming maintenance items.</div>
        )
      ) : null}
    </Panel>
  );
}
