import { DataTable, DataTableBody, DataTableHead } from '@/components/ui/DataTable';
import { Panel } from '@/components/ui/Panel';
import { SearchField } from '@/components/ui/SearchField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Driver, PaginatedResponse } from '@/types/domain';

type DriversTablePanelProps = {
  search: string;
  onSearchChange: (value: string) => void;
  data?: PaginatedResponse<Driver>;
  isLoading: boolean;
  isError: boolean;
  onSelect: (driverId: number) => void;
};

export function DriversTablePanel({ search, onSearchChange, data, isLoading, isError, onSelect }: DriversTablePanelProps) {
  return (
    <Panel
      title="Driver table"
      description="Review and manage driver records."
      actions={<SearchField value={search} onChange={onSearchChange} placeholder="Search drivers" />}
    >
      {isLoading ? <div className="text-sm text-slate-500">Loading drivers...</div> : null}
      {isError ? <div className="text-sm text-rose-600">Failed to load drivers.</div> : null}
      {!isLoading && !isError ? (
        (data?.data?.length ?? 0) > 0 ? (
          <DataTable>
            <DataTableHead>
              <tr>
                <th className="px-4 py-3">Driver</th>
                <th className="px-4 py-3">Assigned vehicle</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </DataTableHead>
            <DataTableBody>
              {(data?.data ?? []).map((driver) => (
                <tr key={driver.id} className="cursor-pointer hover:bg-slate-50" onClick={() => onSelect(driver.id)}>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{driver.name}</div>
                    <div className="text-slate-500">{driver.email ?? driver.phone ?? 'No contact info'}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{driver.assigned_vehicle?.plate_number ?? 'Unassigned'}</td>
                  <td className="px-4 py-3"><StatusBadge value={driver.is_active ? 'active' : 'offline'} /></td>
                </tr>
              ))}
            </DataTableBody>
          </DataTable>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-sm text-slate-500">No drivers match the current search.</div>
        )
      ) : null}
    </Panel>
  );
}
