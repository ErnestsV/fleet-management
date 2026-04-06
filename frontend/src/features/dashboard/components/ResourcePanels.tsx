import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Panel } from '@/components/ui/Panel';
import { TrendDelta } from '@/components/ui/TrendDelta';
import type { DashboardSummary } from '@/types/domain';

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

function consumptionDeltaPct(fuel: DashboardSummary['fuel']): number | null {
  const current = fuel.estimated_avg_consumption_yesterday_l_per_100km;
  const previous = fuel.estimated_avg_consumption_previous_day_l_per_100km;

  if (current == null || previous == null || previous === 0) {
    return null;
  }

  return ((current - previous) / previous) * 100;
}

function trendToneClass(deltaPct: number | null, higherIsBetter = true): string {
  if (deltaPct == null || deltaPct === 0) {
    return 'text-slate-950';
  }

  const improving = higherIsBetter ? deltaPct > 0 : deltaPct < 0;

  return improving ? 'text-emerald-600' : 'text-rose-600';
}

export function MileagePanel({
  data,
}: {
  data: DashboardSummary['mileage'];
}) {
  return (
    <Panel title="Mileage" description="Yesterday versus the previous day based on available telemetry-derived distance.">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
        <div className="rounded-2xl border border-slate-200 p-6">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Distance travelled yesterday</div>
          <div className="mt-3 text-5xl font-semibold text-slate-950">{data.yesterday_distance_km.toFixed(1)}</div>
          <div className="mt-2 text-sm text-slate-500">The day before: {data.previous_distance_km.toFixed(1)} km</div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-6">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Delta</div>
          <div className={`mt-3 text-4xl font-semibold ${trendToneClass(data.delta_pct)}`}>
            {data.delta_pct != null ? `${data.delta_pct > 0 ? '+' : ''}${data.delta_pct.toFixed(1)}%` : 'N/A'}
          </div>
          <div className="mt-3">
            <TrendDelta deltaPct={data.delta_pct} />
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function WorkingTimePanel({
  data,
}: {
  data: DashboardSummary['working_time'];
}) {
  return (
    <Panel title="Working time" description="First and last completed trip activity seen today across the fleet.">
      <div className="grid gap-4 md:grid-cols-2">
        <WorkingTimeCard title="Earliest start-up" items={data.earliest_start} />
        <WorkingTimeCard title="Earliest end time" items={data.earliest_end} />
        <WorkingTimeCard title="Latest start-up" items={data.latest_start} />
        <WorkingTimeCard title="Latest end time" items={data.latest_end} />
      </div>
    </Panel>
  );
}

export function FuelPanel({
  fuel,
  fuelTrendData,
  fuelTrendSamples,
  fuelChartMode,
}: {
  fuel: DashboardSummary['fuel'];
  fuelTrendData: DashboardSummary['fuel']['trend'];
  fuelTrendSamples: DashboardSummary['fuel']['trend'];
  fuelChartMode: 'chart' | 'single-day' | 'empty';
}) {
  const consumptionDelta = consumptionDeltaPct(fuel);

  return (
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
              {fuel.estimated_avg_consumption_yesterday_l_per_100km != null ? fuel.estimated_avg_consumption_yesterday_l_per_100km.toFixed(1) : 'N/A'}
            </div>
            <div className="mt-3">
              <TrendDelta deltaPct={consumptionDelta} higherIsBetter={false} />
            </div>
            <div className="mt-2 text-sm text-slate-500">
              The day before: {fuel.estimated_avg_consumption_previous_day_l_per_100km != null ? `${fuel.estimated_avg_consumption_previous_day_l_per_100km.toFixed(1)} l/100km` : 'N/A'}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 p-6">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Average fuel level yesterday</div>
            <div className="mt-3 text-4xl font-semibold text-slate-950">
              {fuel.average_fuel_level_yesterday_pct != null ? `${fuel.average_fuel_level_yesterday_pct.toFixed(1)}%` : 'N/A'}
            </div>
            <div className="mt-2 text-sm text-slate-500">Expected consumption baseline: {fuel.expected_consumption_l_per_100km.toFixed(1)} l/100km</div>
          </div>
        </div>
        <div className="rounded-2xl bg-slate-50 p-6">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Estimated fuel consumed yesterday</div>
          <div className="mt-3 text-5xl font-semibold text-slate-950">
            {fuel.estimated_fuel_used_yesterday_l != null ? `${fuel.estimated_fuel_used_yesterday_l.toFixed(1)} l` : 'N/A'}
          </div>
          <div className="mt-3">
            <TrendDelta deltaPct={fuel.delta_used_pct} higherIsBetter={false} />
          </div>
          <div className="mt-2 text-sm text-slate-500">
            The day before: {fuel.estimated_fuel_used_previous_day_l != null ? `${fuel.estimated_fuel_used_previous_day_l.toFixed(1)} l` : 'N/A'}
          </div>
        </div>
      </div>
    </Panel>
  );
}
