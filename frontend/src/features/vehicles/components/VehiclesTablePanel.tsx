import { DataTable, DataTableBody, DataTableHead } from '@/components/ui/DataTable';
import { Panel } from '@/components/ui/Panel';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateTime } from '@/lib/utils/format';
import type { PaginatedResponse, Vehicle } from '@/types/domain';

type VehiclesTablePanelProps = {
  search: string;
  onSearchChange: (value: string) => void;
  data?: PaginatedResponse<Vehicle>;
  isLoading: boolean;
  isError: boolean;
  onSelect: (vehicleId: number) => void;
};

export function VehiclesTablePanel({ search, onSearchChange, data, isLoading, isError, onSelect }: VehiclesTablePanelProps) {
  return (
    <Panel
      title="Fleet table"
      description="Search, inspect, edit, and deactivate vehicles."
      actions={
        <div className="relative">
          <input
            className="rounded-2xl border border-slate-200 px-4 py-2 pr-10 text-sm"
            placeholder="Search vehicles"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          {search ? (
            <button
              type="button"
              aria-label="Clear vehicle search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
              onClick={() => onSearchChange('')}
            >
              ×
            </button>
          ) : null}
        </div>
      }
    >
      {isLoading ? <div className="text-sm text-slate-500">Loading vehicles...</div> : null}
      {isError ? <div className="text-sm text-rose-600">Failed to load vehicles.</div> : null}
      {!isLoading && !isError ? (
        (data?.data?.length ?? 0) > 0 ? (
          <DataTable>
            <DataTableHead>
              <tr>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Last event</th>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {(data?.data ?? []).map((vehicle) => (
                <tr key={vehicle.id} className="cursor-pointer hover:bg-slate-50" onClick={() => onSelect(vehicle.id)}>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{vehicle.plate_number}</div>
                    <div className="text-slate-500">{vehicle.name}</div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge value={vehicle.state?.status ?? (vehicle.is_active ? undefined : 'offline')} /></td>
                  <td className="px-4 py-3 text-slate-600">{vehicle.assigned_driver?.name ?? 'Unassigned'}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDateTime(vehicle.state?.last_event_at)}</td>
                </tr>
              ))}
            </DataTableBody>
          </DataTable>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-sm text-slate-500">No vehicles match the current search.</div>
        )
      ) : null}
    </Panel>
  );
}
