import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, DataTableBody, DataTableHead } from '@/components/ui/DataTable';
import { Panel } from '@/components/ui/Panel';
import { SelectField } from '@/components/ui/SelectField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAlerts } from '@/features/alerts/useAlerts';

const ALERTS_PER_PAGE = 10;

export function AlertsPage() {
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useAlerts({
    type: type || undefined,
    status: status || undefined,
    page,
    per_page: ALERTS_PER_PAGE,
  }, { refetchInterval: 10000 });

  useEffect(() => {
    setPage(1);
  }, [type, status]);

  const currentPage = data?.meta?.current_page ?? 1;
  const lastPage = data?.meta?.last_page ?? 1;
  const pageNumbers = Array.from({ length: lastPage }, (_, index) => index + 1);

  return (
    <div>
      <PageHeader title="Alerts" description="Speeding, idling, offline, geofence, and maintenance alert visibility." />
      <Panel
        title="Alert stream"
        description="Operational alert queue with basic filtering."
        actions={
          <div className="flex gap-2 flex-wrap">
            <SelectField className="py-2" value={type} onValueChange={setType}>
              <option value="">All types</option>
              <option value="speeding">Speeding</option>
              <option value="prolonged_idling">Prolonged idling</option>
              <option value="unexpected_fuel_drop">Unexpected fuel drop</option>
              <option value="possible_fuel_theft">Possible fuel theft</option>
              <option value="refuel_without_trip">Refuel without trip</option>
              <option value="abnormal_fuel_consumption">Abnormal fuel consumption</option>
              <option value="offline_vehicle">Offline vehicle</option>
              <option value="maintenance_due">Maintenance due</option>
              <option value="driver_license_expired">Driver license expired</option>
            </SelectField>
            <SelectField className="py-2" value={status} onValueChange={setStatus}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
            </SelectField>
          </div>
        }
      >
        {isLoading ? <div className="text-sm text-slate-500">Loading alerts...</div> : null}
        {isError ? <div className="text-sm text-rose-600">Failed to load alerts.</div> : null}
        {!isLoading && !isError ? (
          (data?.data?.length ?? 0) > 0 ? (
            <DataTable>
              <DataTableHead>
                  <tr>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Triggered</th>
                  </tr>
              </DataTableHead>
              <DataTableBody>
                  {(data?.data ?? []).map((alert) => (
                    <tr key={alert.id}>
                      <td className="px-4 py-3">
                        <div className="font-semibold capitalize">{alert.type.replace(/_/g, ' ')}</div>
                        <div className="text-slate-500">{alert.message}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{alert.vehicle?.plate_number ?? 'N/A'}</td>
                      <td className="px-4 py-3"><StatusBadge value={alert.severity} /></td>
                      <td className="px-4 py-3"><StatusBadge value={alert.status} /></td>
                      <td className="px-4 py-3 text-slate-600">{new Date(alert.triggered_at).toLocaleString()}</td>
                    </tr>
                  ))}
              </DataTableBody>
            </DataTable>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-sm text-slate-500">No alerts match the current filters.</div>
          )
        ) : null}
        {!isLoading && !isError && lastPage > 1 ? (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
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
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setPage((current) => Math.min(lastPage, current + 1))}
              disabled={currentPage === lastPage}
            >
              Next
            </button>
          </div>
        ) : null}
      </Panel>
    </div>
  );
}
