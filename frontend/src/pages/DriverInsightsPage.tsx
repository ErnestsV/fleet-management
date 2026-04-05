import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { CircleHelp } from 'lucide-react';
import { DataTable, DataTableBody, DataTableHead } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { SearchField } from '@/components/ui/SearchField';
import { SelectField } from '@/components/ui/SelectField';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useDriverInsights } from '@/features/drivers/useDriverInsights';

const DRIVER_INSIGHTS_PAGE_SIZE = 10;

function RankingPanel({
  title,
  items,
  tone,
  empty,
}: {
  title: string;
  items: { driver_id: number; label: string; score: number }[];
  tone: 'good' | 'bad' | 'neutral';
  empty: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-4 space-y-3">
        {items.length > 0 ? items.map((item) => (
          <div key={`${title}-${item.driver_id}`} className="flex items-center justify-between gap-4">
            <div className="text-sm font-medium text-slate-700">{item.label}</div>
            <div className={`rounded-full px-3 py-1 text-xs font-semibold ${
              tone === 'good'
                ? 'bg-emerald-100 text-emerald-700'
                : tone === 'bad'
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-sky-100 text-sky-700'
            }`}
            >
              {item.score > 0 ? '+' : ''}{item.score.toFixed(1)}
            </div>
          </div>
        )) : <div className="text-sm text-slate-500">{empty}</div>}
      </div>
    </div>
  );
}

export function DriverInsightsPage() {
  const { data, isLoading, isError } = useDriverInsights({ refetchInterval: 30000 });
  const [search, setSearch] = useState('');
  const [activityFilter, setActivityFilter] = useState('');
  const [driverStatusFilter, setDriverStatusFilter] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);

  const filteredDrivers = useMemo(() => {
    if (!data) {
      return [];
    }

    const normalizedQuery = search.trim().toLowerCase();

    return data.drivers.filter((driver) => {
      if (selectedDriverId != null && driver.driver_id !== selectedDriverId) {
        return false;
      }

      if (normalizedQuery && !driver.name.toLowerCase().includes(normalizedQuery)) {
        return false;
      }

      if (activityFilter === 'active_window' && !driver.has_activity) {
        return false;
      }

      if (activityFilter === 'no_activity' && driver.has_activity) {
        return false;
      }

      if (driverStatusFilter === 'active' && !driver.is_active) {
        return false;
      }

      if (driverStatusFilter === 'inactive' && driver.is_active) {
        return false;
      }

      if (performanceFilter === 'clean' && (driver.speeding_alerts > 0 || driver.idling_alerts > 0)) {
        return false;
      }

      if (performanceFilter === 'speeding' && driver.speeding_alerts === 0) {
        return false;
      }

      if (performanceFilter === 'idling' && driver.idling_alerts === 0) {
        return false;
      }

      if (performanceFilter === 'needs_coaching' && !((driver.score ?? 100) < 70 || driver.speeding_alerts > 0 || driver.idling_alerts > 0)) {
        return false;
      }

      if (performanceFilter === 'high_score' && (driver.score == null || driver.score < 80)) {
        return false;
      }

      if (performanceFilter === 'unscored' && driver.score != null) {
        return false;
      }

      return true;
    });
  }, [activityFilter, data, driverStatusFilter, performanceFilter, search, selectedDriverId]);

  useEffect(() => {
    setPage(1);
  }, [search, activityFilter, driverStatusFilter, performanceFilter, selectedDriverId]);

  const lastPage = Math.max(1, Math.ceil(filteredDrivers.length / DRIVER_INSIGHTS_PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), lastPage);
  const visibleDrivers = filteredDrivers.slice((currentPage - 1) * DRIVER_INSIGHTS_PAGE_SIZE, currentPage * DRIVER_INSIGHTS_PAGE_SIZE);
  const pageNumbers = Array.from({ length: lastPage }, (_, index) => index + 1);
  const selectedDriver = data?.drivers.find((driver) => driver.driver_id === selectedDriverId) ?? null;
  const scopedDrivers = selectedDriver ? filteredDrivers.filter((driver) => driver.driver_id === selectedDriver.driver_id) : filteredDrivers;
  const scoredScopedDrivers = scopedDrivers.filter((driver) => driver.score != null);

  const scopedStats = data ? [
    { label: 'Active drivers', value: String(scopedDrivers.filter((driver) => driver.has_activity).length), hint: selectedDriver ? 'Trips attributed to selected driver in the last 7 days' : 'With at least one trip in the last 7 days' },
    { label: 'Distance', value: `${scopedDrivers.reduce((sum, driver) => sum + driver.distance_km, 0).toFixed(1)} km`, hint: 'Attributed through assignment windows' },
    { label: 'Trips', value: String(scopedDrivers.reduce((sum, driver) => sum + driver.trip_count, 0)), hint: 'Completed in the last 7 days' },
    { label: 'Avg trip distance', value: scopedDrivers.filter((driver) => driver.trip_count > 0).length > 0 ? `${(scopedDrivers.filter((driver) => driver.trip_count > 0).reduce((sum, driver) => sum + driver.avg_trip_distance_km, 0) / scopedDrivers.filter((driver) => driver.trip_count > 0).length).toFixed(1)} km` : 'N/A', hint: 'Average trip length across the current scope' },
    { label: 'Avg trip duration', value: scopedDrivers.filter((driver) => driver.trip_count > 0).length > 0 ? `${(scopedDrivers.filter((driver) => driver.trip_count > 0).reduce((sum, driver) => sum + driver.avg_trip_duration_minutes, 0) / scopedDrivers.filter((driver) => driver.trip_count > 0).length).toFixed(1)} min` : 'N/A', hint: 'Average completed trip duration' },
    { label: 'Drive time', value: `${scopedDrivers.reduce((sum, driver) => sum + driver.total_drive_hours, 0).toFixed(1)} h`, hint: 'Total completed trip time in the last 7 days' },
    { label: 'After-hours trips', value: String(scopedDrivers.reduce((sum, driver) => sum + driver.after_hours_trip_count, 0)), hint: 'Trips starting outside the default 07:00-19:00 working window' },
    { label: 'Average score', value: scoredScopedDrivers.length > 0 ? ((scoredScopedDrivers.reduce((sum, driver) => sum + (driver.score ?? 0), 0)) / scoredScopedDrivers.length).toFixed(1) : 'N/A', hint: selectedDriver ? 'Selected driver score' : 'Trip output balanced against alert rate' },
  ] : [];

  const chartDrivers = scoredScopedDrivers.slice(0, 10);

  return (
    <div>
      <PageHeader
        title="Driver insights"
        description="Management-facing driver analytics for the last 7 days, based on trip activity and speeding/idling alerts during assignment windows."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
        {scopedStats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {isLoading ? <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">Loading driver insights...</div> : null}
      {isError ? <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Failed to load driver insights.</div> : null}
      {!isLoading && !isError && !data ? <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No driver insight data is available yet.</div> : null}

      {!isLoading && !isError && data ? (
        <>
          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
            <Panel
              title="Driver score distribution"
              description={selectedDriver
                ? `${selectedDriver.name} in ${data.window.label}. Clear the selection to compare multiple drivers again.`
                : `${data.window.label} score view from activity and alert-rate signals. Click a driver row below to focus the entire page on that driver.`}
            >
              <div className="h-80">
                {chartDrivers.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartDrivers}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="score" fill="#1f8f63" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                    No completed driver-attributed trips are available for this window yet.
                  </div>
                )}
              </div>
            </Panel>

            <Panel
              title={selectedDriver ? 'Selected driver snapshot' : 'Leaderboards'}
              description={selectedDriver ? 'Focused view of the selected driver. Use the button below to return to the fleet-wide comparison.' : 'Fast management views for recognition, coaching, and improvement.'}
            >
              <div className="grid gap-4">
                {selectedDriver ? (
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-semibold text-slate-950">{selectedDriver.name}</div>
                        <div className="mt-1 text-sm text-slate-500">{selectedDriver.has_activity ? 'Trips are present in the current insight window.' : 'No trips are attributed in the current insight window.'}</div>
                      </div>
                      <StatusBadge value={selectedDriver.is_active ? 'active' : 'inactive'} />
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Speeding alerts</div>
                        <div className="mt-2 text-2xl font-semibold text-slate-950">{selectedDriver.speeding_alerts}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Idling alerts</div>
                        <div className="mt-2 text-2xl font-semibold text-slate-950">{selectedDriver.idling_alerts}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Current score</div>
                        <div className="mt-2 text-2xl font-semibold text-slate-950">{selectedDriver.score != null ? selectedDriver.score.toFixed(1) : 'N/A'}</div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Score delta</div>
                        <div className={`mt-2 text-2xl font-semibold ${selectedDriver.score_delta == null ? 'text-slate-500' : selectedDriver.score_delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {selectedDriver.score_delta != null ? `${selectedDriver.score_delta > 0 ? '+' : ''}${selectedDriver.score_delta.toFixed(1)}` : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="mt-4 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      onClick={() => setSelectedDriverId(null)}
                    >
                      Clear driver focus
                    </button>
                  </div>
                ) : (
                  <>
                    <RankingPanel title="Top drivers this week" items={data.leaderboards.top_drivers} tone="good" empty="No scored drivers yet." />
                    <RankingPanel title="Needs coaching" items={data.leaderboards.needs_coaching} tone="bad" empty="No coaching flags in this window." />
                    <RankingPanel title="Most improved" items={data.leaderboards.most_improved} tone="neutral" empty="A prior comparison window is not available yet." />
                  </>
                )}
              </div>
            </Panel>
          </div>

          <div className="mt-6">
            <Panel
              title="Driver performance table"
              description="Per-driver trip output, alert counts, and score across the last 7 days. Use search and filters to narrow the table, or click a row to focus the full page on one driver."
              actions={(
                <div className="flex flex-wrap items-center gap-2">
                  <SearchField value={search} onChange={setSearch} placeholder="Search drivers" />
                  <SelectField className="py-2" value={activityFilter} onValueChange={setActivityFilter}>
                    <option value="">All activity</option>
                    <option value="active_window">With trips</option>
                    <option value="no_activity">No trips</option>
                  </SelectField>
                  <SelectField className="py-2" value={driverStatusFilter} onValueChange={setDriverStatusFilter}>
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </SelectField>
                  <SelectField className="py-2" value={performanceFilter} onValueChange={setPerformanceFilter}>
                    <option value="">All performance</option>
                    <option value="clean">Clean record</option>
                    <option value="speeding">Has speeding alerts</option>
                    <option value="idling">Has idling alerts</option>
                    <option value="needs_coaching">Needs coaching</option>
                    <option value="high_score">Score 80+</option>
                    <option value="unscored">Unscored</option>
                  </SelectField>
                </div>
              )}
            >
              <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <div className="flex items-start gap-2">
                  <CircleHelp size={16} className="mt-0.5 shrink-0 text-slate-500" />
                  <div>
                    Driver score is an MVP coaching signal from 0 to 100.
                    It rewards more trips and longer average trip distance, and penalizes speeding and idling alerts per 100 km.
                  </div>
                </div>
              </div>
              {filteredDrivers.length > 0 ? (
                <DataTable>
                  <DataTableHead>
                    <tr>
                      <th className="px-4 py-3">Driver</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Trips</th>
                      <th className="px-4 py-3">Distance</th>
                      <th className="px-4 py-3">Avg trip</th>
                      <th className="px-4 py-3">Avg duration</th>
                      <th className="px-4 py-3">Drive time</th>
                      <th className="px-4 py-3">After-hours</th>
                      <th className="px-4 py-3">Speeding</th>
                      <th className="px-4 py-3">Idling</th>
                      <th className="px-4 py-3">Score</th>
                      <th className="px-4 py-3">Delta</th>
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {visibleDrivers.map((driver) => (
                      <tr
                        key={driver.driver_id}
                        className={`cursor-pointer transition hover:bg-slate-50 ${selectedDriverId === driver.driver_id ? 'bg-brand-50' : ''}`}
                        onClick={() => setSelectedDriverId(driver.driver_id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setSelectedDriverId(driver.driver_id);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Focus insights for ${driver.name}`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold">{driver.name}</div>
                          <div className="text-slate-500">{driver.has_activity ? 'Active in current window' : 'No trips in current window'}</div>
                          <div className="mt-1 text-xs font-medium text-brand-700">Click to focus driver insights</div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge value={driver.is_active ? 'active' : 'inactive'} />
                        </td>
                        <td className="px-4 py-3 text-slate-600">{driver.trip_count}</td>
                        <td className="px-4 py-3 text-slate-600">{driver.distance_km.toFixed(1)} km</td>
                        <td className="px-4 py-3 text-slate-600">{driver.avg_trip_distance_km.toFixed(1)} km</td>
                        <td className="px-4 py-3 text-slate-600">{driver.avg_trip_duration_minutes.toFixed(1)} min</td>
                        <td className="px-4 py-3 text-slate-600">{driver.total_drive_hours.toFixed(1)} h</td>
                        <td className="px-4 py-3 text-slate-600">{driver.after_hours_trip_count}</td>
                        <td className="px-4 py-3 text-slate-600">{driver.speeding_alerts}</td>
                        <td className="px-4 py-3 text-slate-600">{driver.idling_alerts}</td>
                        <td className="px-4 py-3 text-slate-600">{driver.score != null ? driver.score.toFixed(1) : 'N/A'}</td>
                        <td className={`px-4 py-3 ${driver.score_delta == null ? 'text-slate-500' : driver.score_delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {driver.score_delta != null ? `${driver.score_delta > 0 ? '+' : ''}${driver.score_delta.toFixed(1)}` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </DataTableBody>
                </DataTable>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">No drivers match the current filters.</div>
              )}
              {filteredDrivers.length > 0 && lastPage > 1 ? (
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
        </>
      ) : null}
    </div>
  );
}
