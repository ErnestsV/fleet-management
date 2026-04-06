import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/app/store/authStore';
import { DataTable, DataTableBody, DataTableHead } from '@/components/ui/DataTable';
import { DismissibleAlert } from '@/components/ui/DismissibleAlert';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { SearchField } from '@/components/ui/SearchField';
import { SelectField } from '@/components/ui/SelectField';
import { ShowMoreButton } from '@/components/ui/ShowMoreButton';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useFuelInsights, useResolveFuelAlert } from '@/features/fuel/useFuelInsights';
import { getApiErrorMessage } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/utils/format';
import type { FuelAnomalyRow } from '@/types/domain';

const FUEL_INSIGHTS_PER_PAGE = 10;
const FUEL_URGENT_PAGE_SIZE = 5;
const PAGE_WINDOW_SIZE = 5;

function formatDelta(value: number | null, suffix = '%') {
  if (value == null) {
    return 'N/A';
  }

  return `${value > 0 ? '+' : ''}${value.toFixed(1)}${suffix}`;
}

export function FuelInsightsPage() {
  const actor = useAuthStore((state) => state.user);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [visibleUrgentCount, setVisibleUrgentCount] = useState(FUEL_URGENT_PAGE_SIZE);
  const resolveMutation = useResolveFuelAlert();

  const { data, isLoading, isError } = useFuelInsights({
    search: search || undefined,
    type: type || undefined,
    status: status || undefined,
    page,
    per_page: FUEL_INSIGHTS_PER_PAGE,
  }, { refetchInterval: 30000 });

  useEffect(() => {
    setPage(1);
  }, [search, type, status]);

  useEffect(() => {
    setVisibleUrgentCount(FUEL_URGENT_PAGE_SIZE);
  }, [search, type, status, data?.summary?.suspicious_vehicles.length]);

  const currentPage = data?.meta?.current_page ?? 1;
  const lastPage = data?.meta?.last_page ?? 1;
  const visibleUrgentVehicles = (data?.summary?.suspicious_vehicles ?? []).slice(0, visibleUrgentCount);
  const canResolveFuelAlerts = useMemo(
    () => actor?.role === 'super_admin' || actor?.role === 'owner' || actor?.role === 'admin',
    [actor?.role],
  );
  const pageNumbers = useMemo(() => {
    const windowStart = Math.max(1, currentPage - Math.floor(PAGE_WINDOW_SIZE / 2));
    const windowEnd = Math.min(lastPage, windowStart + PAGE_WINDOW_SIZE - 1);
    const adjustedStart = Math.max(1, windowEnd - PAGE_WINDOW_SIZE + 1);

    return Array.from({ length: windowEnd - adjustedStart + 1 }, (_, index) => adjustedStart + index);
  }, [currentPage, lastPage]);

  const stats = data?.summary ? [
    { label: 'Active anomalies', value: String(data.summary.active_anomalies), hint: 'Current unresolved fuel signals' },
    { label: 'Affected vehicles', value: String(data.summary.affected_vehicles), hint: 'Vehicles touched by the current result set' },
    { label: 'Unexpected drops', value: String(data.summary.unexpected_drop_count), hint: `Drops over ${data.summary.thresholds.unexpected_drop_pct.toFixed(0)}%` },
    { label: 'Possible theft', value: String(data.summary.possible_theft_count), hint: `Stationary drops over ${data.summary.thresholds.possible_theft_drop_pct.toFixed(0)}%` },
    { label: 'Refuel without trip', value: String(data.summary.refuel_without_trip_count), hint: `Stationary increases over ${data.summary.thresholds.refuel_increase_pct.toFixed(0)}%` },
    { label: 'Abnormal consumption', value: String(data.summary.abnormal_consumption_count), hint: `Above ${data.summary.thresholds.abnormal_consumption_multiplier.toFixed(1)}x expected baseline` },
  ] : [];

  return (
    <div>
      <PageHeader
        title="Fuel insights"
        description="Suspicious fuel drops, stationary refuels, and abnormal consumption events derived from telemetry deltas. These are operational heuristics for follow-up, not conclusive theft verdicts."
      />

      {resolveMutation.isError ? (
        <DismissibleAlert
          className="mb-6"
          tone="error"
          message={getApiErrorMessage(resolveMutation.error)}
          onClose={() => resolveMutation.reset()}
        />
      ) : null}

      {!isLoading && !isError && data?.summary ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel
          title="Fuel anomaly history"
          description="Filter suspicious fuel events by vehicle and anomaly type, then inspect the supporting telemetry delta values."
          actions={(
            <div className="flex flex-wrap items-center gap-2">
              <SearchField value={search} onChange={setSearch} placeholder="Search vehicles" />
              <SelectField className="py-2 text-sm" value={type} onValueChange={setType}>
                <option value="">All anomaly types</option>
                <option value="unexpected_fuel_drop">Unexpected fuel drop</option>
                <option value="possible_fuel_theft">Possible fuel theft</option>
                <option value="refuel_without_trip">Refuel without trip</option>
                <option value="abnormal_fuel_consumption">Abnormal consumption</option>
              </SelectField>
              <SelectField className="py-2 text-sm" value={status} onValueChange={setStatus}>
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="resolved">Resolved</option>
              </SelectField>
            </div>
          )}
        >
          {isLoading ? <div className="text-sm text-slate-500">Loading fuel insights...</div> : null}
          {isError ? <div className="text-sm text-rose-600">Failed to load fuel insights.</div> : null}
          {!isLoading && !isError ? (
            (data?.data?.length ?? 0) > 0 ? (
              <>
                <DataTable>
                  <DataTableHead>
                    <tr>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Vehicle</th>
                      <th className="px-4 py-3">Fuel delta</th>
                      <th className="px-4 py-3">Distance delta</th>
                      <th className="px-4 py-3">Consumption</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Triggered</th>
                      {canResolveFuelAlerts ? <th className="px-4 py-3 text-right">Action</th> : null}
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {(data?.data ?? []).map((row: FuelAnomalyRow) => (
                      <tr key={row.id}>
                        <td className="px-4 py-3">
                          <div className="font-semibold capitalize">{row.type.replace(/_/g, ' ')}</div>
                          <div className="text-slate-500">{row.message}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{row.vehicle?.plate_number ?? 'N/A'}</div>
                          <div className="text-slate-500">{row.vehicle?.name ?? 'No vehicle linked'}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div>{formatDelta(row.fuel_delta_pct)}</div>
                          <div className="text-xs text-slate-400">{row.previous_fuel_level != null && row.current_fuel_level != null ? `${row.previous_fuel_level.toFixed(1)}% → ${row.current_fuel_level.toFixed(1)}%` : 'No baseline snapshot'}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div>{row.distance_delta_km != null ? `${row.distance_delta_km.toFixed(2)} km` : 'N/A'}</div>
                          <div className="text-xs text-slate-400">{row.time_delta_minutes != null ? `${row.time_delta_minutes} min window` : 'Unknown window'}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {row.estimated_consumption_l_per_100km != null ? `${row.estimated_consumption_l_per_100km.toFixed(1)} l/100km` : 'N/A'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-2">
                            <StatusBadge value={row.severity} />
                            <StatusBadge value={row.status} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{formatDateTime(row.triggered_at)}</td>
                        {canResolveFuelAlerts ? (
                          <td className="px-4 py-3 text-right">
                            {row.status === 'active' ? (
                              <button
                                type="button"
                                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={() => resolveMutation.mutate(row.id)}
                                disabled={resolveMutation.isPending}
                              >
                                {resolveMutation.isPending ? 'Resolving...' : 'Resolve'}
                              </button>
                            ) : (
                              <div className="text-sm">
                                <div className="text-slate-400">Resolved</div>
                                {row.resolved_by?.name ? (
                                  <div className="text-xs text-slate-500">by {row.resolved_by.name}</div>
                                ) : null}
                              </div>
                            )}
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </DataTableBody>
                </DataTable>
                {lastPage > 1 ? (
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
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-sm text-slate-500">No fuel anomalies match the current filters.</div>
            )
          ) : null}
        </Panel>

        <Panel
          title="Most suspicious vehicles"
          description="Vehicles with the highest concentration of current fuel-related follow-up signals."
          className="xl:max-h-[720px] xl:overflow-hidden"
        >
          <div className="flex flex-col gap-3 xl:h-[calc(720px-128px)]">
            <div className="space-y-3 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-1">
              {visibleUrgentVehicles.length > 0 ? visibleUrgentVehicles.map((vehicle) => (
                <div key={vehicle.vehicle_id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{vehicle.plate_number}</div>
                      <div className="text-sm text-slate-500">{vehicle.name}</div>
                      <div className="mt-1 text-xs text-slate-400">Latest anomaly: {formatDateTime(vehicle.latest_triggered_at)}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                      <span>{vehicle.anomaly_count}</span>
                      <span>{vehicle.anomaly_count === 1 ? 'issue' : 'issues'}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-slate-500">No suspicious vehicles are visible in the current result set.</div>
              )}
            </div>
            {(data?.summary?.suspicious_vehicles.length ?? 0) > visibleUrgentCount ? (
              <ShowMoreButton
                label={`Show ${FUEL_URGENT_PAGE_SIZE} more vehicles`}
                onClick={() => setVisibleUrgentCount((current) => current + FUEL_URGENT_PAGE_SIZE)}
              />
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}
