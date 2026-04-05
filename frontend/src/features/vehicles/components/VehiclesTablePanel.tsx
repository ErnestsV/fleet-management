import { DataTable, DataTableBody, DataTableHead } from '@/components/ui/DataTable';
import { Panel } from '@/components/ui/Panel';
import { SearchField } from '@/components/ui/SearchField';
import { SelectField } from '@/components/ui/SelectField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateTime } from '@/lib/utils/format';
import type { PaginatedResponse, Vehicle } from '@/types/domain';

type VehiclesTablePanelProps = {
  search: string;
  status: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  data?: PaginatedResponse<Vehicle>;
  isLoading: boolean;
  isError: boolean;
  onSelect: (vehicleId: number) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
};

export function VehiclesTablePanel({
  search,
  status,
  onSearchChange,
  onStatusChange,
  data,
  isLoading,
  isError,
  onSelect,
  currentPage,
  onPageChange,
}: VehiclesTablePanelProps) {
  const lastPage = data?.meta?.last_page ?? 1;
  const pageNumbers = Array.from({ length: lastPage }, (_, index) => index + 1);

  return (
    <Panel
      title="Fleet table"
      description="Search, filter by live status, inspect, edit, and deactivate vehicles."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <SearchField value={search} onChange={onSearchChange} placeholder="Search vehicles" />
          <SelectField className="py-2" value={status} onValueChange={onStatusChange}>
            <option value="">All statuses</option>
            <option value="moving">Moving</option>
            <option value="idling">Idling</option>
            <option value="stopped">Stopped</option>
            <option value="offline">Offline</option>
            <option value="unknown">Unknown</option>
          </SelectField>
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
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-sm text-slate-500">No vehicles match the current search or status filter.</div>
        )
      ) : null}
      {!isLoading && !isError && lastPage > 1 ? (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                currentPage === pageNumber
                  ? 'bg-brand-600 text-white'
                  : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onPageChange(Math.min(lastPage, currentPage + 1))}
            disabled={currentPage === lastPage}
          >
            Next
          </button>
        </div>
      ) : null}
    </Panel>
  );
}
