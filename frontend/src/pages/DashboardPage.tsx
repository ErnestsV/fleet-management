import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { MapPlaceholder } from '@/components/maps/MapPlaceholder';
import { DataTable, DataTableBody, DataTableHead } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { StatCard } from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useDashboardSummary } from '@/features/dashboard/useDashboardSummary';
import { formatDateTime } from '@/lib/utils/format';

function RankingPanel({
  title,
  items,
  tone,
}: {
  title: string;
  items: { label: string; score: number }[];
  tone: 'good' | 'bad';
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-4 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={`${title}-${item.label}`} className="flex items-center justify-between gap-4">
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
  const { data, isLoading, isError } = useDashboardSummary();

  const stats = [
    { label: 'Total vehicles', value: String(data?.total_vehicles ?? 0), hint: 'Across selected scope' },
    { label: 'Moving now', value: String(data?.moving_vehicles ?? 0), hint: 'Live state materialized' },
    { label: 'Idling', value: String(data?.idling_vehicles ?? 0), hint: 'Threshold-aware' },
    { label: 'Active alerts', value: String(data?.active_alerts ?? 0), hint: 'Requires operator action' },
  ];

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
                    <div className="mt-3 text-5xl font-semibold text-slate-950">{data.driving_behaviour.average_score.toFixed(1)}</div>
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.driving_behaviour.vehicle_scores.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="label" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Bar dataKey="score" fill="#84cc16" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <RankingPanel title="Most efficient" items={data.driving_behaviour.best_vehicles} tone="good" />
                  <RankingPanel title="Needs coaching" items={data.driving_behaviour.worst_vehicles} tone="bad" />
                </div>
              </div>
            </Panel>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
            <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-panel">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Live fleet</h2>
                <span className="text-xs uppercase tracking-[0.16em] text-slate-500">Realtime-ready</span>
              </div>
              <div className="space-y-3">
                {data.fleet.slice(0, 6).map((vehicle) => (
                  <div key={vehicle.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-semibold">{vehicle.plate_number}</div>
                        <div className="text-sm text-slate-500">{vehicle.make ?? 'Unknown make'} {vehicle.model ?? ''}</div>
                      </div>
                      <StatusBadge value={vehicle.status} />
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                      {vehicle.speed_kmh ? `${vehicle.speed_kmh} km/h` : 'No recent movement'} · {vehicle.driver ?? 'No driver'}
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <MapPlaceholder
              markers={data.fleet.map((vehicle) => ({
                id: vehicle.id,
                label: vehicle.plate_number,
                status: vehicle.status,
                latitude: vehicle.latitude,
                longitude: vehicle.longitude,
              }))}
              caption="Live fleet state rendered on a provider-agnostic operations canvas."
            />
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
            <Panel title="Fleet status table" description="Current vehicle materialized state with assigned driver and location context.">
              {data.fleet.length > 0 ? (
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
                      {data.fleet.map((vehicle) => (
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
