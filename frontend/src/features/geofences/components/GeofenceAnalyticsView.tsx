import { DataTable, DataTableBody, DataTableHead } from '@/components/ui/DataTable';
import { Panel } from '@/components/ui/Panel';
import { SearchField } from '@/components/ui/SearchField';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateTime } from '@/lib/utils/format';
import type { GeofenceAnalyticsRow, GeofenceAnalyticsSummary } from '@/types/domain';

const PAGE_WINDOW_SIZE = 5;

function formatMinutes(value: number | null) {
  if (value == null) {
    return 'N/A';
  }

  if (value >= 60) {
    return `${(value / 60).toFixed(1)} h`;
  }

  return `${value.toFixed(0)} min`;
}

export function GeofenceAnalyticsView({
  summary,
  rows,
  search,
  onSearchChange,
  currentPage,
  lastPage,
  onPageChange,
  isLoading,
  isError,
}: {
  summary?: GeofenceAnalyticsSummary;
  rows: GeofenceAnalyticsRow[];
  search: string;
  onSearchChange: (value: string) => void;
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  isError: boolean;
}) {
  const pageWindowStart = Math.max(1, Math.min(currentPage - Math.floor(PAGE_WINDOW_SIZE / 2), Math.max(1, lastPage - PAGE_WINDOW_SIZE + 1)));
  const pageWindowEnd = Math.min(lastPage, pageWindowStart + PAGE_WINDOW_SIZE - 1);
  const pageNumbers = Array.from({ length: pageWindowEnd - pageWindowStart + 1 }, (_, index) => pageWindowStart + index);
  const emptyMessage = search
    ? 'No geofence analytics match the current search.'
    : 'No geofence visits have been detected in the current window.';

  const stats = summary ? [
    { label: 'Active geofences', value: String(summary.summary.active_geofences), hint: `${summary.window.days}-day scoped location intelligence` },
    { label: 'Entries', value: String(summary.summary.total_entries), hint: 'Entered monitored locations' },
    { label: 'Exits', value: String(summary.summary.total_exits), hint: 'Exited monitored locations' },
    { label: 'Active visits', value: String(summary.summary.active_visits), hint: 'Vehicles currently inside monitored zones' },
    { label: 'Total dwell', value: `${summary.summary.total_dwell_hours.toFixed(1)} h`, hint: 'Resolved on-site time across visits' },
    { label: 'Avg dwell', value: summary.summary.average_dwell_minutes != null ? formatMinutes(summary.summary.average_dwell_minutes) : 'N/A', hint: 'Average resolved visit duration' },
  ] : [];
  const sidePanelContent = isLoading
    ? <div className="text-sm text-slate-500">Loading analytics summary...</div>
    : isError
      ? <div className="text-sm text-rose-600">Failed to load analytics summary.</div>
      : null;

  return (
    <div className="space-y-6">
      {summary ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel
          title="Location activity"
          description="Visit counts and dwell behaviour derived from geofence entry and exit alerts across the current analytics window."
          actions={<SearchField value={search} onChange={onSearchChange} placeholder="Search geofences" />}
        >
          {isLoading ? <div className="text-sm text-slate-500">Loading geofence analytics...</div> : null}
          {isError ? <div className="text-sm text-rose-600">Failed to load geofence analytics.</div> : null}
          {!isLoading && !isError ? (
            rows.length > 0 ? (
              <>
                <DataTable>
                  <DataTableHead>
                    <tr>
                      <th className="px-4 py-3">Geofence</th>
                      <th className="px-4 py-3">Entries</th>
                      <th className="px-4 py-3">Exits</th>
                      <th className="px-4 py-3">Vehicles</th>
                      <th className="px-4 py-3">Active visits</th>
                      <th className="px-4 py-3">Avg dwell</th>
                      <th className="px-4 py-3">Total dwell</th>
                      <th className="px-4 py-3">Last activity</th>
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {rows.map((row) => (
                      <tr key={row.geofence_id}>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{row.name}</div>
                          <div className="mt-2">
                            <StatusBadge value={row.is_active ? 'active' : 'offline'} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{row.entry_count}</td>
                        <td className="px-4 py-3 text-slate-600">{row.exit_count}</td>
                        <td className="px-4 py-3 text-slate-600">{row.unique_vehicle_count}</td>
                        <td className="px-4 py-3 text-slate-600">{row.active_visit_count}</td>
                        <td className="px-4 py-3 text-slate-600">{formatMinutes(row.average_dwell_minutes)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatMinutes(row.total_dwell_minutes)}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDateTime(row.last_activity_at)}</td>
                      </tr>
                    ))}
                  </DataTableBody>
                </DataTable>
                {lastPage > 1 ? (
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
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-sm text-slate-500">
                {emptyMessage}
              </div>
            )
          ) : null}
        </Panel>

        <div className="space-y-6">
          <Panel
            title="Top visited locations"
            description="Most-entered locations in the current analytics window."
          >
            <div className="space-y-3">
              {sidePanelContent ?? (summary?.top_visited_locations.length ? summary.top_visited_locations.map((location) => (
                <div key={location.geofence_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900">{location.name}</div>
                      <div className="text-sm text-slate-500">{location.unique_vehicle_count} vehicle{location.unique_vehicle_count === 1 ? '' : 's'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-semibold text-slate-950">{location.entry_count}</div>
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Entries</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-slate-500">No geofence visits have been detected in the current window.</div>
              ))}
            </div>
          </Panel>

          <Panel
            title="Longest dwell"
            description="Locations where resolved visits are spending the longest time."
          >
            <div className="space-y-3">
              {sidePanelContent ?? (summary?.longest_dwell_locations.length ? summary.longest_dwell_locations.map((location) => (
                <div key={location.geofence_id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-slate-900">{location.name}</div>
                      <div className="text-sm text-slate-500">{formatMinutes(location.total_dwell_minutes)} total dwell</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-semibold text-slate-950">{formatMinutes(location.average_dwell_minutes)}</div>
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Avg dwell</div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-slate-500">No resolved dwell samples are available yet.</div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
