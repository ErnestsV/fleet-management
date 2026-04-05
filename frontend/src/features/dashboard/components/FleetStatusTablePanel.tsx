import { DataTable, DataTableBody, DataTableHead } from '@/components/ui/DataTable';
import { Panel } from '@/components/ui/Panel';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { DashboardSummary } from '@/types/domain';
import { formatDateTime } from '@/lib/utils/format';

type FleetVehicle = DashboardSummary['fleet'][number];

export function FleetStatusTablePanel({
  rows,
  lastPage,
  currentPage,
  pageNumbers,
  onPrevious,
  onNext,
  onPageSelect,
}: {
  rows: FleetVehicle[];
  lastPage: number;
  currentPage: number;
  pageNumbers: number[];
  onPrevious: () => void;
  onNext: () => void;
  onPageSelect: (page: number) => void;
}) {
  return (
    <Panel title="Fleet status table" description="Current vehicle state prioritized for operations review: moving first, then idling, stopped, offline, and unknown states.">
      {rows.length > 0 ? (
        <>
          <DataTable>
            <DataTableHead>
              <tr>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Speed</th>
                <th className="px-4 py-3">Fuel</th>
                <th className="px-4 py-3">Last event</th>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {rows.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{vehicle.plate_number}</div>
                    <div className="text-slate-500">{vehicle.name}</div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge value={vehicle.status} /></td>
                  <td className="px-4 py-3 text-slate-600">{vehicle.driver ?? 'Unassigned'}</td>
                  <td className="px-4 py-3 text-slate-600">{vehicle.speed_kmh ?? 0} km/h</td>
                  <td className="px-4 py-3 text-slate-600">{vehicle.fuel_level != null ? `${vehicle.fuel_level}%` : 'N/A'}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDateTime(vehicle.last_event_at) ?? 'No data'}</td>
                </tr>
              ))}
            </DataTableBody>
          </DataTable>
          {lastPage > 1 ? (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={onPrevious}
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
                  onClick={() => onPageSelect(pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={onNext}
                disabled={currentPage === lastPage}
              >
                Next
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">No fleet state data is available yet.</div>
      )}
    </Panel>
  );
}
