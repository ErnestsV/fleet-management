import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, DataTableBody, DataTableHead } from '@/components/ui/DataTable';
import { Panel } from '@/components/ui/Panel';
import { SelectField } from '@/components/ui/SelectField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAlerts } from '@/features/alerts/useAlerts';

export function AlertsPage() {
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const { data, isLoading, isError } = useAlerts({
    type: type || undefined,
    status: status || undefined,
  });

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
      </Panel>
    </div>
  );
}
