import { Panel } from '@/components/ui/Panel';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils/format';
import type { MaintenanceRecord } from '@/types/domain';

type MaintenanceRecordsPanelProps = {
  items: MaintenanceRecord[];
  isLoading: boolean;
  isError: boolean;
  onDelete: (recordId: number) => void;
};

export function MaintenanceRecordsPanel({ items, isLoading, isError, onDelete }: MaintenanceRecordsPanelProps) {
  return (
    <Panel title="Service records" description="Completed maintenance work history.">
      {isLoading ? <div className="text-sm text-slate-500">Loading records...</div> : null}
      {isError ? <div className="text-sm text-rose-600">Failed to load records.</div> : null}
      {!isLoading && !isError ? (
        items.length > 0 ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 p-4">
                <div className="min-w-0">
                  <div className="font-semibold text-slate-950">{item.title}</div>
                  <div className="text-sm text-slate-500">
                    {item.vehicle?.plate_number ?? item.vehicle_id}
                    {item.vehicle?.name ? ` · ${item.vehicle.name}` : ''}
                  </div>
                  <div className="mt-3 grid gap-2 text-sm text-slate-700">
                    <div>Service date: <span className="font-medium">{formatDate(item.service_date)}</span></div>
                    <div>Odometer: <span className="font-medium">{formatNumber(item.odometer_km, 'km')}</span></div>
                    <div>Cost: <span className="font-medium">{formatCurrency(item.cost_amount, item.currency)}</span></div>
                    {item.notes ? <div>Notes: <span className="font-medium">{item.notes}</span></div> : null}
                  </div>
                </div>
                <button className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => onDelete(item.id)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">No service records logged yet.</div>
        )
      ) : null}
    </Panel>
  );
}
