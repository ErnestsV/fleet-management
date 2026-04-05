import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Link } from 'react-router-dom';
import { Panel } from '@/components/ui/Panel';
import type { DashboardSummary } from '@/types/domain';

export function ActivityChartsPanels({
  alertsByType,
  tripsOverTime,
  distanceByVehicle,
}: {
  alertsByType: DashboardSummary['alerts_by_type'];
  tripsOverTime: DashboardSummary['trips_over_time'];
  distanceByVehicle: DashboardSummary['distance_by_vehicle'];
}) {
  return (
    <div className="mt-6 grid gap-6 xl:grid-cols-3">
      <Panel title="Alert counts by type" description="Active operational alerts grouped by alert type.">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={alertsByType}>
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
            <LineChart data={tripsOverTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="trip_count" stroke="#2563eb" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel title="Top distance vehicles" description="Top 5 vehicles by approximate recent distance derived from available telemetry. Use Vehicles for the broader fleet view.">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distanceByVehicle.slice(0, 5)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="label" width={80} />
              <Tooltip />
              <Bar dataKey="distance_km" fill="#f59e0b" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex justify-end">
          <Link to="/vehicles" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Open vehicles
          </Link>
        </div>
      </Panel>
    </div>
  );
}
