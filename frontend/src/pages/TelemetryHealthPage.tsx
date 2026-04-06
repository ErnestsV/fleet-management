import { useEffect, useMemo, useState } from 'react';
import { DataTable, DataTableBody, DataTableHead } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { SearchField } from '@/components/ui/SearchField';
import { SelectField } from '@/components/ui/SelectField';
import { ShowMoreButton } from '@/components/ui/ShowMoreButton';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useTelemetryHealth } from '@/features/telemetry/useTelemetryHealth';
import { formatDateTime } from '@/lib/utils/format';
import type { TelemetryHealthRow } from '@/types/domain';

const TELEMETRY_HEALTH_PER_PAGE = 10;
const TELEMETRY_URGENT_PAGE_SIZE = 5;

function formatAge(minutesSinceLastEvent: number | null) {
  if (minutesSinceLastEvent == null) {
    return 'No data';
  }

  if (minutesSinceLastEvent < 60) {
    return `${minutesSinceLastEvent} min ago`;
  }

  const hours = minutesSinceLastEvent / 60;

  if (hours < 24) {
    return `${hours.toFixed(1)} h ago`;
  }

  return `${(hours / 24).toFixed(1)} d ago`;
}

export function TelemetryHealthPage() {
  const [search, setSearch] = useState('');
  const [healthStatus, setHealthStatus] = useState('');
  const [freshnessBucket, setFreshnessBucket] = useState('');
  const [page, setPage] = useState(1);
  const [visibleUrgentCount, setVisibleUrgentCount] = useState(TELEMETRY_URGENT_PAGE_SIZE);
  const { data, isLoading, isError } = useTelemetryHealth({
    search: search || undefined,
    health_status: healthStatus || undefined,
    freshness_bucket: freshnessBucket || undefined,
    page,
    per_page: TELEMETRY_HEALTH_PER_PAGE,
  }, { refetchInterval: 30000 });

  useEffect(() => {
    setPage(1);
  }, [search, healthStatus, freshnessBucket]);

  useEffect(() => {
    setVisibleUrgentCount(TELEMETRY_URGENT_PAGE_SIZE);
  }, [search, healthStatus, freshnessBucket, data?.data?.length]);

  const summary = useMemo(() => data?.summary && 'total_devices' in data.summary ? data.summary : null, [data]);
  const currentPage = data?.meta?.current_page ?? 1;
  const lastPage = data?.meta?.last_page ?? 1;
  const pageNumbers = Array.from({ length: lastPage }, (_, index) => index + 1);
  const urgentRows = [...(data?.data ?? [])]
    .sort((left, right) => {
      const severityOrder: Record<string, number> = {
        no_data: 0,
        offline: 1,
        stale: 2,
        missing_fields: 3,
        low_frequency: 4,
        healthy: 5,
      };

      const bySeverity = (severityOrder[left.health_status] ?? 99) - (severityOrder[right.health_status] ?? 99);

      if (bySeverity !== 0) {
        return bySeverity;
      }

      return (right.minutes_since_last_event ?? -1) - (left.minutes_since_last_event ?? -1);
    });
  const visibleUrgentRows = urgentRows.slice(0, visibleUrgentCount);

  const summaryCards = summary ? [
    { label: 'Freshness rate', value: `${summary.freshness_rate_pct.toFixed(0)}%`, hint: `Seen within ${summary.thresholds.fresh_minutes} minutes` },
    { label: 'Healthy devices', value: String(summary.healthy_count), hint: 'Fresh, frequent, and complete latest telemetry' },
    { label: 'Stale telemetry', value: String(summary.stale_count), hint: `Older than ${summary.thresholds.stale_minutes} minutes but inside the offline window` },
    { label: 'Offline > 24h', value: String(summary.offline_over_24h_count), hint: `No event for more than ${summary.thresholds.offline_hours} hours` },
    { label: 'Low frequency', value: String(summary.low_frequency_count), hint: `Fewer than ${summary.thresholds.low_frequency_events_24h} events in the last 24h` },
    { label: 'Missing fields', value: String(summary.missing_fields_count), hint: 'Latest state is missing location, odometer, or fuel data' },
    { label: 'No telemetry', value: String(summary.no_data_count), hint: 'No latest telemetry snapshot is available for the active vehicle' },
  ] : [];

  return (
    <div>
      <PageHeader
        title="Telemetry health"
        description="Device reliability and signal freshness across active vehicles, with focus on stale data, missing fields, and under-reporting devices."
      />

      {!isLoading && !isError && summary ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
          {summaryCards.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel
          title="Telemetry diagnostics"
          description="Search and filter active vehicles by telemetry health status, freshness, and reporting quality."
          actions={(
            <div className="flex flex-wrap items-center gap-2">
              <SearchField value={search} onChange={setSearch} placeholder="Search vehicles or device id" />
              <SelectField className="py-2 text-sm" value={healthStatus} onValueChange={setHealthStatus}>
                <option value="">All health states</option>
                <option value="healthy">Healthy</option>
                <option value="missing_fields">Missing fields</option>
                <option value="low_frequency">Low frequency</option>
                <option value="stale">Stale</option>
                <option value="offline">Offline</option>
                <option value="no_data">No data</option>
              </SelectField>
              <SelectField className="py-2 text-sm" value={freshnessBucket} onValueChange={setFreshnessBucket}>
                <option value="">All freshness buckets</option>
                <option value="fresh">Fresh</option>
                <option value="delayed">Delayed</option>
                <option value="stale">Stale</option>
                <option value="offline">Offline</option>
                <option value="no_data">No data</option>
              </SelectField>
            </div>
          )}
        >
          {isLoading ? <div className="text-sm text-slate-500">Loading telemetry health...</div> : null}
          {isError ? <div className="text-sm text-rose-600">Failed to load telemetry health.</div> : null}
          {!isLoading && !isError ? (
            (data?.data?.length ?? 0) > 0 ? (
              <>
                <DataTable>
                  <DataTableHead>
                    <tr>
                      <th className="px-4 py-3">Vehicle</th>
                      <th className="px-4 py-3">Health</th>
                      <th className="px-4 py-3">Freshness</th>
                      <th className="px-4 py-3">Last event</th>
                      <th className="px-4 py-3">Events 24h</th>
                      <th className="px-4 py-3">Missing fields</th>
                      <th className="px-4 py-3">Live status</th>
                    </tr>
                  </DataTableHead>
                  <DataTableBody>
                    {(data?.data ?? []).map((row: TelemetryHealthRow) => (
                      <tr key={row.vehicle_id}>
                        <td className="px-4 py-3">
                          <div className="font-semibold">{row.plate_number}</div>
                          <div className="text-slate-500">{row.name}</div>
                          {row.device_identifier ? <div className="text-xs text-slate-400">{row.device_identifier}</div> : null}
                        </td>
                        <td className="px-4 py-3"><StatusBadge value={row.health_status} /></td>
                        <td className="px-4 py-3"><StatusBadge value={row.freshness_bucket} /></td>
                        <td className="px-4 py-3 text-slate-600">
                          <div>{formatDateTime(row.last_event_at)}</div>
                          <div className="text-xs text-slate-400">{formatAge(row.minutes_since_last_event)}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{row.events_last_24h}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {row.missing_fields.length > 0 ? row.missing_fields.join(', ') : 'Complete'}
                        </td>
                        <td className="px-4 py-3"><StatusBadge value={row.status} /></td>
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
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-sm text-slate-500">No active vehicles match the current telemetry health filters.</div>
            )
          ) : null}
        </Panel>

        <Panel title="Most urgent vehicles" description="Fast follow-up list for the vehicles that currently need operator attention first.">
          <div className="space-y-3">
            {urgentRows.length > 0 ? visibleUrgentRows.map((row: TelemetryHealthRow) => (
              <div key={row.vehicle_id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{row.plate_number}</div>
                    <div className="text-sm text-slate-500">{row.name}</div>
                    {row.device_identifier ? <div className="mt-1 text-xs text-slate-400">{row.device_identifier}</div> : null}
                  </div>
                  <StatusBadge value={row.health_status} />
                </div>
                <div className="mt-3 text-sm text-slate-600">
                  {row.last_event_at ? formatAge(row.minutes_since_last_event) : 'No telemetry yet'}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {row.events_last_24h} events / 24h
                  </span>
                  {row.missing_fields.length > 0 ? (
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                      Missing: {row.missing_fields.join(', ')}
                    </span>
                  ) : null}
                </div>
              </div>
            )) : (
              <div className="text-sm text-slate-500">No urgent telemetry issues are visible in the current result set.</div>
            )}
            {urgentRows.length > visibleUrgentCount ? (
              <ShowMoreButton
                label={`Show ${TELEMETRY_URGENT_PAGE_SIZE} more vehicles`}
                onClick={() => setVisibleUrgentCount((current) => current + TELEMETRY_URGENT_PAGE_SIZE)}
              />
            ) : null}
          </div>
        </Panel>
      </div>
    </div>
  );
}
