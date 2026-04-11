import { CircleHelp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Panel } from '@/components/ui/Panel';
import type { DashboardSummary } from '@/types/domain';

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

export function FleetEfficiencyPanel({
  data,
}: {
  data: DashboardSummary['fleet_efficiency'];
}) {
  return (
    <Panel title="Fleet efficiency" description="Operational scorecards derived from utilization, telemetry freshness, driver coverage, and alert-free coverage.">
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_180px]">
        <div className="space-y-4">
          {data.breakdown.map((item) => (
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
          <div className="mt-3 text-5xl font-semibold text-slate-950">{data.selected_average_score.toFixed(0)}%</div>
          <div className="mt-2 text-sm text-slate-500">Provider-neutral benchmark for this fleet</div>
        </div>
      </div>
    </Panel>
  );
}

export function DrivingBehaviourPanel({
  data,
}: {
  data: DashboardSummary['driving_behaviour'];
}) {
  return (
    <Panel title="Driving behaviour" description="Vehicle behaviour scoring based on recent trip speeds and recent speeding/idling alerts.">
      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-[180px_minmax(0,1fr)]">
          <div className="relative rounded-[28px] bg-slate-50 p-6 text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs uppercase tracking-[0.16em] text-slate-500">
              <span>Average score</span>
              <span className="group inline-flex">
                <button
                  type="button"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 focus:bg-slate-200 focus:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300"
                  aria-label="How behaviour score is calculated"
                  aria-describedby="driving-behaviour-score-help"
                >
                  <CircleHelp size={18} />
                </button>
                <span
                  id="driving-behaviour-score-help"
                  role="tooltip"
                  className="pointer-events-none absolute left-3 right-3 top-14 z-20 hidden rounded-lg border border-slate-200 bg-white p-3 text-left text-xs normal-case leading-5 tracking-normal text-slate-600 shadow-lg group-hover:block group-focus-within:block sm:left-1/2 sm:right-auto sm:w-72 sm:-translate-x-1/2"
                >
                  Behaviour score is a 0 to 100 vehicle coaching signal for the current dashboard window. It starts from an average-speed baseline that peaks around 55 km/h, then subtracts 8 points for each speeding alert and 4 points for each prolonged idling alert. Vehicles need at least {data.minimum_trip_samples} completed trips before they are included.
                </span>
              </span>
            </div>
            <div className="mt-3 text-5xl font-semibold text-slate-950">
              {data.average_score != null ? data.average_score.toFixed(1) : 'N/A'}
            </div>
          </div>
          <div className="h-48">
            {data.vehicle_scores.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.vehicle_scores}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#84cc16" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
                Insufficient trip data yet. At least {data.minimum_trip_samples} completed trips per vehicle are needed for behaviour scoring.
              </div>
            )}
          </div>
        </div>
        {data.insufficient_vehicle_count > 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {data.insufficient_vehicle_count} vehicle(s) currently have insufficient trip data for behaviour scoring.
          </div>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <RankingPanel title="Most efficient" items={data.best_vehicles} tone="good" />
          <RankingPanel title="Needs coaching" items={data.worst_vehicles} tone="bad" />
        </div>
      </div>
    </Panel>
  );
}

export function FleetUtilizationPanel({
  data,
}: {
  data: DashboardSummary['fleet_utilization'];
}) {
  return (
    <Panel title="Fleet utilization" description="Asset-usage signals for how much of the fleet is actually being exercised today versus sitting idle or only doing minimal work.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Active today</div>
          <div className="mt-2 text-3xl font-semibold text-emerald-600">{data.active_today.percentage.toFixed(0)}%</div>
          <div className="mt-2 text-sm text-slate-500">{data.active_today.count} vehicles with at least one trip today</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Unused over 3 days</div>
          <div className="mt-2 text-3xl font-semibold text-amber-600">{data.unused_over_3_days.count}</div>
          <div className="mt-2 text-sm text-slate-500">{data.unused_over_3_days.percentage.toFixed(0)}% of fleet has no trips in the last 3 days</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Idling over {data.idling_over_threshold.threshold_hours}h</div>
          <div className="mt-2 text-3xl font-semibold text-rose-600">{data.idling_over_threshold.count}</div>
          <div className="mt-2 text-sm text-slate-500">{data.idling_over_threshold.percentage.toFixed(0)}% of fleet is currently stuck idling past threshold</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">No trips today</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">{data.no_trips_today.count}</div>
          <div className="mt-2 text-sm text-slate-500">{data.no_trips_today.percentage.toFixed(0)}% of fleet has not moved today</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Short trips only</div>
          <div className="mt-2 text-3xl font-semibold text-sky-700">{data.short_trips_only_today.count}</div>
          <div className="mt-2 text-sm text-slate-500">{data.short_trips_only_today.percentage.toFixed(0)}% of fleet only made trips up to {data.short_trips_only_today.max_trip_km.toFixed(0)} km today</div>
        </div>
      </div>
    </Panel>
  );
}
