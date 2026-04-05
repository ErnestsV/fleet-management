import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { DataTable, DataTableBody, DataTableHead } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ShowMoreButton } from '@/components/ui/ShowMoreButton';
import { useDashboardSummary } from '@/features/dashboard/useDashboardSummary';
import { formatDateTime } from '@/lib/utils/format';

const DASHBOARD_ATTENTION_PAGE_SIZE = 3;

function RankingPanel({
  title,
  items,
  tone,
}: {
  title: string;
  items: { vehicle_id?: number; label: string; score: number }[];
  tone: 'good' | 'bad';
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-4 space-y-3">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div key={`${title}-${item.vehicle_id ?? item.label}-${index}`} className="flex items-center justify-between gap-4">
              <div className="text-sm font-medium text-slate-700">{item.label}</div>
              <div className={`rounded-full px-3 py-1 text-xs font-semibold ${tone === 'good' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {item.score.toFixed(1)}
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-slate-500">No data yet.</div>
        )}
      </div>
    </div>
  );
}

function WorkingTimeCard({
  title,
  items,
}: {
  title: string;
  items: { label: string; time: string | null }[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-4 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={`${title}-${item.label}-${item.time}`} className="flex items-center justify-between gap-4 text-sm">
              <span className="font-medium text-slate-700">{item.label}</span>
              <span className="text-slate-500">{item.time ?? 'N/A'}</span>
            </div>
          ))
        ) : (
          <div className="text-sm text-slate-500">No completed trips for today.</div>
        )}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { data, isLoading, isError } = useDashboardSummary({ refetchInterval: 10000 });
  const [visibleAttentionCount, setVisibleAttentionCount] = useState(DASHBOARD_ATTENTION_PAGE_SIZE);
  const [fleetStatusPage, setFleetStatusPage] = useState(1);

  const stats = [
    { label: 'Total vehicles', value: String(data?.total_vehicles ?? 0), hint: 'Across selected scope' },
    { label: 'Moving now', value: String(data?.moving_vehicles ?? 0), hint: 'Live state materialized' },
    { label: 'Idling', value: String(data?.idling_vehicles ?? 0), hint: 'Threshold-aware' },
    { label: 'Active alerts', value: String(data?.active_alerts ?? 0), hint: 'Requires operator action' },
  ];

  const fuelTrendSamples = data?.fuel.trend.filter((entry) => (
    entry.estimated_consumption_l_per_100km != null || entry.estimated_fuel_used_l != null
  )) ?? [];
  const fuelTrendData = data?.fuel.trend ?? [];
  const fuelChartMode = fuelTrendSamples.length >= 2 ? 'chart' : fuelTrendSamples.length === 1 ? 'single-day' : 'empty';
  const vehiclesWithoutDriver = data?.fleet.filter((vehicle) => !vehicle.driver) ?? [];
  const vehiclesWithoutTelemetry = data?.fleet.filter((vehicle) => !vehicle.last_event_at) ?? [];
  const vehiclesWithUnknownStatus = data?.fleet.filter((vehicle) => !vehicle.status || vehicle.status === 'unknown') ?? [];
  const lowFuelVehicles = data?.fleet.filter((vehicle) => typeof vehicle.fuel_level === 'number' && vehicle.fuel_level <= 20) ?? [];
  const readinessItems = [
    { label: 'Without driver', count: vehiclesWithoutDriver.length, tone: 'amber' as const },
    { label: 'Without telemetry', count: vehiclesWithoutTelemetry.length, tone: 'slate' as const },
    { label: 'Unknown status', count: vehiclesWithUnknownStatus.length, tone: 'sky' as const },
    { label: 'Low fuel', count: lowFuelVehicles.length, tone: 'rose' as const },
  ];
  const attentionVehicles = Array.from(new Map(
    [
      ...lowFuelVehicles,
      ...vehiclesWithoutTelemetry,
      ...vehiclesWithoutDriver,
      ...vehiclesWithUnknownStatus,
    ].map((vehicle) => [vehicle.id, vehicle]),
  ).values());
  const totalFleetCount = Math.max(data?.fleet.length ?? 0, 1);
  const statusPriority: Record<string, number> = {
    moving: 0,
    idling: 1,
    stopped: 2,
    offline: 3,
    unknown: 4,
  };
  const sortedFleet = [...(data?.fleet ?? [])].sort((left, right) => {
    const leftStatus = left.status ?? 'unknown';
    const rightStatus = right.status ?? 'unknown';
    const byStatus = (statusPriority[leftStatus] ?? 99) - (statusPriority[rightStatus] ?? 99);

    if (byStatus !== 0) {
      return byStatus;
    }

    const leftLastEvent = left.last_event_at ? new Date(left.last_event_at).getTime() : 0;
    const rightLastEvent = right.last_event_at ? new Date(right.last_event_at).getTime() : 0;

    return rightLastEvent - leftLastEvent;
  });
  const fleetStatusPerPage = 10;
  const fleetStatusLastPage = Math.max(1, Math.ceil(sortedFleet.length / fleetStatusPerPage));
  const currentFleetStatusPage = Math.min(fleetStatusPage, fleetStatusLastPage);
  const fleetStatusRows = sortedFleet.slice((currentFleetStatusPage - 1) * fleetStatusPerPage, currentFleetStatusPage * fleetStatusPerPage);
  const fleetStatusPageNumbers = Array.from({ length: fleetStatusLastPage }, (_, index) => index + 1);

  useEffect(() => {
    setFleetStatusPage((current) => Math.min(Math.max(1, current), fleetStatusLastPage));
  }, [fleetStatusLastPage]);

  return (
    <div>
      <PageHeader
        title="Operations dashboard"
        description="A richer operational overview with efficiency, behaviour, mileage, working time, map context, and live fleet analytics."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {isLoading ? <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">Loading dashboard...</div> : null}
      {isError ? <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Failed to load dashboard data.</div> : null}
      {!isLoading && !isError && !data ? <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">No dashboard data is available yet.</div> : null}

      {!isLoading && !isError && data ? (
        <>
          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <Panel title="Fleet efficiency" description="Operational scorecards derived from utilization, telemetry freshness, driver coverage, and alert-free coverage.">
              <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_180px]">
                <div className="space-y-4">
                  {data.fleet_efficiency.breakdown.map((item) => (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{item.label}</span>
                        <span className="text-slate-500">{item.score.toFixed(0)}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-slate-100">
                        <div className="h-3 rounded-full bg-gradient-to-r from-amber-400 to-emerald-500" style={{ width: `${item.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col items-center justify-center rounded-[28px] bg-slate-50 p-6 text-center">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Selected average</div>
                  <div className="mt-3 text-5xl font-semibold text-slate-950">{data.fleet_efficiency.selected_average_score.toFixed(0)}%</div>
                  <div className="mt-2 text-sm text-slate-500">Provider-neutral benchmark for this MVP</div>
                </div>
              </div>
            </Panel>

            <Panel title="Driving behaviour" description="Vehicle behaviour scoring based on recent trip speeds and recent speeding/idling alerts.">
              <div className="grid gap-6">
                <div className="grid gap-6 md:grid-cols-[180px_minmax(0,1fr)]">
                  <div className="rounded-[28px] bg-slate-50 p-6 text-center">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Average score</div>
                    <div className="mt-3 text-5xl font-semibold text-slate-950">
                      {data.driving_behaviour.average_score != null ? data.driving_behaviour.average_score.toFixed(1) : 'N/A'}
                    </div>
                  </div>
                  <div className="h-48">
                    {data.driving_behaviour.vehicle_scores.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.driving_behaviour.vehicle_scores}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="label" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Bar dataKey="score" fill="#84cc16" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
                        Insufficient trip data yet. At least {data.driving_behaviour.minimum_trip_samples} completed trips per vehicle are needed for behaviour scoring.
                      </div>
                    )}
                  </div>
                </div>
                {data.driving_behaviour.insufficient_vehicle_count > 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {data.driving_behaviour.insufficient_vehicle_count} vehicle(s) currently have insufficient trip data for behaviour scoring.
                  </div>
                ) : null}
                <div className="grid gap-4 md:grid-cols-2">
                  <RankingPanel title="Most efficient" items={data.driving_behaviour.best_vehicles} tone="good" />
                  <RankingPanel title="Needs coaching" items={data.driving_behaviour.worst_vehicles} tone="bad" />
                </div>
              </div>
            </Panel>
          </div>

          <div className="mt-6">
            <Panel title="Fleet utilization" description="Asset-usage signals for how much of the fleet is actually being exercised today versus sitting idle or only doing minimal work.">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Active today</div>
                  <div className="mt-2 text-3xl font-semibold text-emerald-600">{data.fleet_utilization.active_today.percentage.toFixed(0)}%</div>
                  <div className="mt-2 text-sm text-slate-500">{data.fleet_utilization.active_today.count} vehicles with at least one trip today</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Unused over 3 days</div>
                  <div className="mt-2 text-3xl font-semibold text-amber-600">{data.fleet_utilization.unused_over_3_days.count}</div>
                  <div className="mt-2 text-sm text-slate-500">{data.fleet_utilization.unused_over_3_days.percentage.toFixed(0)}% of fleet has no trips in the last 3 days</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Idling over {data.fleet_utilization.idling_over_threshold.threshold_hours}h</div>
                  <div className="mt-2 text-3xl font-semibold text-rose-600">{data.fleet_utilization.idling_over_threshold.count}</div>
                  <div className="mt-2 text-sm text-slate-500">{data.fleet_utilization.idling_over_threshold.percentage.toFixed(0)}% of fleet is currently stuck idling past threshold</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">No trips today</div>
                  <div className="mt-2 text-3xl font-semibold text-slate-950">{data.fleet_utilization.no_trips_today.count}</div>
                  <div className="mt-2 text-sm text-slate-500">{data.fleet_utilization.no_trips_today.percentage.toFixed(0)}% of fleet has not moved today</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Short trips only</div>
                  <div className="mt-2 text-3xl font-semibold text-sky-700">{data.fleet_utilization.short_trips_only_today.count}</div>
                  <div className="mt-2 text-sm text-slate-500">{data.fleet_utilization.short_trips_only_today.percentage.toFixed(0)}% of fleet only made trips up to {data.fleet_utilization.short_trips_only_today.max_trip_km.toFixed(0)} km today</div>
                </div>
              </div>
            </Panel>
          </div>

          <div className="mt-6">
            <Panel
              title="Operational gaps"
              description="A compact readiness view for gaps that are not already covered by alert totals or the full fleet status table."
              actions={(
                <Link to="/live-map" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Open live map
                </Link>
              )}
            >
              <div className="grid gap-4 md:grid-cols-2">
                {readinessItems.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.label}</div>
                    <div className={`mt-2 text-3xl font-semibold ${
                      item.tone === 'rose'
                        ? 'text-rose-600'
                        : item.tone === 'amber'
                          ? 'text-amber-600'
                          : item.tone === 'sky'
                            ? 'text-sky-700'
                            : 'text-slate-950'
                    }`}
                    >
                      {item.count}
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                      {((item.count / totalFleetCount) * 100).toFixed(0)}% of visible fleet
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <div className="text-sm font-semibold text-slate-900">Vehicles needing follow-up</div>
                <div className="mt-3 space-y-3">
                  {attentionVehicles.length > 0 ? (
                    attentionVehicles.slice(0, visibleAttentionCount).map((vehicle) => {
                      const reasons = [
                        !vehicle.driver ? 'No driver' : null,
                        !vehicle.last_event_at ? 'No telemetry' : null,
                        !vehicle.status || vehicle.status === 'unknown' ? 'Unknown status' : null,
                        typeof vehicle.fuel_level === 'number' && vehicle.fuel_level <= 20 ? `Low fuel ${vehicle.fuel_level}%` : null,
                      ].filter(Boolean);

                      return (
                        <div key={vehicle.id} className="rounded-2xl border border-slate-200 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="font-semibold">{vehicle.plate_number}</div>
                              <div className="text-sm text-slate-500">{vehicle.make ?? 'Unknown make'} {vehicle.model ?? ''}</div>
                            </div>
                            <StatusBadge value={vehicle.status} />
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {reasons.map((reason) => (
                              <span key={`${vehicle.id}-${reason}`} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                {reason}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
                      No immediate operational gaps stand out in the current fleet snapshot.
                    </div>
                  )}
                  {attentionVehicles.length > visibleAttentionCount ? (
                    <ShowMoreButton
                      label="Show 3 more vehicles"
                      onClick={() => setVisibleAttentionCount((current) => current + DASHBOARD_ATTENTION_PAGE_SIZE)}
                    />
                  ) : null}
                </div>
              </div>
            </Panel>
          </div>

          <div className="mt-6">
            <Panel
              title="Telemetry health"
              description="A SaaS-style reliability view of whether active devices are reporting frequently enough and with complete latest fields."
              actions={(
                <Link to="/telemetry-health" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Open telemetry health
                </Link>
              )}
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Freshness rate</div>
                  <div className="mt-2 text-3xl font-semibold text-emerald-600">{data.telemetry_health.freshness_rate_pct.toFixed(0)}%</div>
                  <div className="mt-2 text-sm text-slate-500">Latest event seen within {data.telemetry_health.thresholds.fresh_minutes} minutes</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Healthy devices</div>
                  <div className="mt-2 text-3xl font-semibold text-emerald-600">{data.telemetry_health.healthy_count}</div>
                  <div className="mt-2 text-sm text-slate-500">Fresh, frequent, and complete latest telemetry</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Stale telemetry</div>
                  <div className="mt-2 text-3xl font-semibold text-amber-600">{data.telemetry_health.stale_count}</div>
                  <div className="mt-2 text-sm text-slate-500">Older than {data.telemetry_health.thresholds.stale_minutes} minutes but not yet offline</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Offline over {data.telemetry_health.thresholds.offline_hours}h</div>
                  <div className="mt-2 text-3xl font-semibold text-rose-600">{data.telemetry_health.offline_over_24h_count}</div>
                  <div className="mt-2 text-sm text-slate-500">No telemetry has arrived past the offline threshold</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Low frequency</div>
                  <div className="mt-2 text-3xl font-semibold text-amber-600">{data.telemetry_health.low_frequency_count}</div>
                  <div className="mt-2 text-sm text-slate-500">Below {data.telemetry_health.thresholds.low_frequency_events_24h} events in the last 24h</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Missing fields</div>
                  <div className="mt-2 text-3xl font-semibold text-sky-700">{data.telemetry_health.missing_fields_count}</div>
                  <div className="mt-2 text-sm text-slate-500">Latest telemetry snapshot is missing location, odometer, or fuel data</div>
                </div>
              </div>
            </Panel>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-2">
            <Panel title="Mileage" description="Yesterday versus the previous day based on available telemetry-derived distance.">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
                <div className="rounded-2xl border border-slate-200 p-6">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Distance travelled yesterday</div>
                  <div className="mt-3 text-5xl font-semibold text-slate-950">{data.mileage.yesterday_distance_km.toFixed(1)}</div>
                  <div className="mt-2 text-sm text-slate-500">The day before: {data.mileage.previous_distance_km.toFixed(1)} km</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-6">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Delta</div>
                  <div className={`mt-3 text-4xl font-semibold ${data.mileage.delta_pct != null && data.mileage.delta_pct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {data.mileage.delta_pct != null ? `${data.mileage.delta_pct > 0 ? '+' : ''}${data.mileage.delta_pct.toFixed(1)}%` : 'N/A'}
                  </div>
                </div>
              </div>
            </Panel>

            <Panel title="Working time" description="First and last completed trip activity seen today across the fleet.">
              <div className="grid gap-4 md:grid-cols-2">
                <WorkingTimeCard title="Earliest start-up" items={data.working_time.earliest_start} />
                <WorkingTimeCard title="Earliest end time" items={data.working_time.earliest_end} />
                <WorkingTimeCard title="Latest start-up" items={data.working_time.latest_start} />
                <WorkingTimeCard title="Latest end time" items={data.working_time.latest_end} />
              </div>
            </Panel>
          </div>

          <div className="mt-6">
            <Panel title="Fuel" description="Estimated fuel usage derived from fuel-level telemetry and odometer distance. These values are estimates, not calibrated fuel-card totals.">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_220px_220px]">
                <div className="h-80">
                  {fuelChartMode === 'chart' ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={fuelTrendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis yAxisId="consumption" label={{ value: 'l/100km', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="liters" orientation="right" label={{ value: 'L', angle: 90, position: 'insideRight' }} />
                        <Tooltip
                          formatter={(value, name: string) => {
                            const numericValue = typeof value === 'number'
                              ? value
                              : typeof value === 'string'
                                ? Number(value)
                                : null;

                            if (numericValue == null || Number.isNaN(numericValue)) {
                              return ['N/A', name];
                            }

                            if (name === 'Estimated consumption') {
                              return [`${numericValue.toFixed(1)} l/100km`, name];
                            }

                            return [`${numericValue.toFixed(1)} l`, name];
                          }}
                        />
                        <Legend />
                        <Line
                          yAxisId="consumption"
                          type="monotone"
                          dataKey="estimated_consumption_l_per_100km"
                          name="Estimated consumption"
                          stroke="#84cc16"
                          strokeWidth={3}
                          dot={{ r: 3, strokeWidth: 0, fill: '#84cc16' }}
                          activeDot={{ r: 5 }}
                        />
                        <Line
                          yAxisId="liters"
                          type="monotone"
                          dataKey="estimated_fuel_used_l"
                          name="Estimated fuel used"
                          stroke="#2563eb"
                          strokeWidth={3}
                          dot={{ r: 3, strokeWidth: 0, fill: '#2563eb' }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6">
                      {fuelChartMode === 'single-day' ? (
                        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Fuel trend warming up</div>
                          <div className="mt-2 text-lg font-semibold text-slate-950">{fuelTrendSamples[0]?.day}</div>
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl bg-slate-50 p-4">
                              <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Consumption</div>
                              <div className="mt-2 text-2xl font-semibold text-slate-950">
                                {fuelTrendSamples[0]?.estimated_consumption_l_per_100km != null ? fuelTrendSamples[0].estimated_consumption_l_per_100km.toFixed(1) : 'N/A'}
                              </div>
                              <div className="text-sm text-slate-500">l/100km</div>
                            </div>
                            <div className="rounded-2xl bg-slate-50 p-4">
                              <div className="text-xs uppercase tracking-[0.12em] text-slate-500">Fuel used</div>
                              <div className="mt-2 text-2xl font-semibold text-slate-950">
                                {fuelTrendSamples[0]?.estimated_fuel_used_l != null ? fuelTrendSamples[0].estimated_fuel_used_l.toFixed(1) : 'N/A'}
                              </div>
                              <div className="text-sm text-slate-500">liters</div>
                            </div>
                          </div>
                          <div className="mt-4 text-sm text-slate-500">
                            One usable telemetry day is available. The full line chart appears automatically once multiple days are available.
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-sm text-slate-500">
                          Fuel trend needs telemetry from multiple days. Current data is still too sparse for a meaningful chart, so use the KPI cards on the right for the latest estimates.
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="grid gap-4">
                  <div className="rounded-2xl border border-slate-200 p-6">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Average fuel consumption by distance</div>
                    <div className="mt-3 text-4xl font-semibold text-slate-950">
                      {data.fuel.estimated_avg_consumption_yesterday_l_per_100km != null ? data.fuel.estimated_avg_consumption_yesterday_l_per_100km.toFixed(1) : 'N/A'}
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                      The day before: {data.fuel.estimated_avg_consumption_previous_day_l_per_100km != null ? `${data.fuel.estimated_avg_consumption_previous_day_l_per_100km.toFixed(1)} l/100km` : 'N/A'}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-6">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Average fuel level yesterday</div>
                    <div className="mt-3 text-4xl font-semibold text-slate-950">
                      {data.fuel.average_fuel_level_yesterday_pct != null ? `${data.fuel.average_fuel_level_yesterday_pct.toFixed(1)}%` : 'N/A'}
                    </div>
                    <div className="mt-2 text-sm text-slate-500">Expected consumption baseline: {data.fuel.expected_consumption_l_per_100km.toFixed(1)} l/100km</div>
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-6">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Estimated fuel consumed yesterday</div>
                  <div className="mt-3 text-5xl font-semibold text-slate-950">
                    {data.fuel.estimated_fuel_used_yesterday_l != null ? `${data.fuel.estimated_fuel_used_yesterday_l.toFixed(1)} l` : 'N/A'}
                  </div>
                  <div className={`mt-3 text-sm font-medium ${
                    data.fuel.delta_used_pct == null
                      ? 'text-slate-500'
                      : data.fuel.delta_used_pct >= 0
                        ? 'text-rose-600'
                        : 'text-emerald-600'
                  }`}>
                    {data.fuel.delta_used_pct != null ? `${data.fuel.delta_used_pct > 0 ? '+' : ''}${data.fuel.delta_used_pct.toFixed(1)}% vs previous day` : 'No previous-day baseline'}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    The day before: {data.fuel.estimated_fuel_used_previous_day_l != null ? `${data.fuel.estimated_fuel_used_previous_day_l.toFixed(1)} l` : 'N/A'}
                  </div>
                </div>
              </div>
            </Panel>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            <Panel title="Alert counts by type" description="Active operational alerts grouped by alert type.">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.alerts_by_type}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1f8f63" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel title="Trips over time" description="Seven-day trip trend from derived trip records.">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.trips_over_time}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="trip_count" stroke="#2563eb" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Panel>
            <Panel title="Distance by vehicle" description="Approximate recent distance derived from available telemetry for the MVP.">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.distance_by_vehicle} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="label" width={80} />
                    <Tooltip />
                    <Bar dataKey="distance_km" fill="#f59e0b" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <div className="mt-6">
            <Panel title="Fleet status table" description="Current vehicle state prioritized for operations review: moving first, then idling, stopped, offline, and unknown states.">
              {sortedFleet.length > 0 ? (
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
                      {fleetStatusRows.map((vehicle) => (
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
                {fleetStatusLastPage > 1 ? (
                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => setFleetStatusPage(Math.max(1, currentFleetStatusPage - 1))}
                      disabled={currentFleetStatusPage === 1}
                    >
                      Previous
                    </button>
                    {fleetStatusPageNumbers.map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                          currentFleetStatusPage === pageNumber
                            ? 'bg-brand-600 text-white'
                            : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                        onClick={() => setFleetStatusPage(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => setFleetStatusPage(Math.min(fleetStatusLastPage, currentFleetStatusPage + 1))}
                      disabled={currentFleetStatusPage === fleetStatusLastPage}
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
          </div>
        </>
      ) : null}
    </div>
  );
}
