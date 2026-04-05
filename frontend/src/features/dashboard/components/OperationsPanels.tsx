import { Link } from 'react-router-dom';
import { Panel } from '@/components/ui/Panel';
import { ShowMoreButton } from '@/components/ui/ShowMoreButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { DashboardSummary } from '@/types/domain';
import type { DashboardReadinessItem } from '@/features/dashboard/useDashboardViewModel';
import { formatDateTime } from '@/lib/utils/format';

type FleetVehicle = DashboardSummary['fleet'][number];

function riskToneClasses(level: 'low' | 'medium' | 'high') {
  if (level === 'high') {
    return {
      chip: 'bg-rose-100 text-rose-700',
      text: 'text-rose-600',
    };
  }

  if (level === 'medium') {
    return {
      chip: 'bg-amber-100 text-amber-700',
      text: 'text-amber-600',
    };
  }

  return {
    chip: 'bg-emerald-100 text-emerald-700',
    text: 'text-emerald-600',
  };
}

export function FleetRiskOverviewPanel({
  data,
}: {
  data: DashboardSummary['fleet_risk'];
}) {
  const overallTone = riskToneClasses(data.overall.level);

  return (
    <Panel
      title="Fleet risk overview"
      description="A transparent executive rollup of the main issues currently driving fleet risk."
      actions={(
        <Link to="/alerts" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
          Open alerts
        </Link>
      )}
    >
      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
        <div className="rounded-[28px] bg-slate-50 p-6 text-center">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Overall fleet risk</div>
          <div className={`mt-3 text-4xl font-semibold ${overallTone.text}`}>{data.overall.label}</div>
          <div className="mt-3 text-sm text-slate-500">
            {data.overall.high_driver_count} high and {data.overall.medium_driver_count} medium risk driver{data.overall.medium_driver_count === 1 ? '' : 's'} currently contributing.
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {data.drivers.map((item) => {
            const tone = riskToneClasses(item.severity);

            return (
              <div key={item.key} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.label}</div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${tone.chip}`}>
                    {item.severity}
                  </span>
                </div>
                <div className={`mt-3 text-3xl font-semibold ${tone.text}`}>{item.count}</div>
                <div className="mt-2 text-sm text-slate-500">
                  Medium at {item.thresholds.medium}, high at {item.thresholds.high}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

export function OperationalGapsPanel({
  readinessItems,
  totalFleetCount,
  attentionVehicles,
  visibleAttentionCount,
  onShowMore,
  attentionPageSize,
}: {
  readinessItems: DashboardReadinessItem[];
  totalFleetCount: number;
  attentionVehicles: FleetVehicle[];
  visibleAttentionCount: number;
  onShowMore: () => void;
  attentionPageSize: number;
}) {
  return (
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
              label={`Show ${attentionPageSize} more vehicles`}
              onClick={onShowMore}
            />
          ) : null}
        </div>
      </div>
    </Panel>
  );
}

export function TelemetryHealthPanel({
  data,
}: {
  data?: DashboardSummary['telemetry_health'];
}) {
  if (!data) {
    return (
      <Panel
        title="Telemetry health"
        description="A SaaS-style reliability view of whether active devices are reporting frequently enough and with complete latest fields."
        actions={(
          <Link to="/telemetry-health" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Open telemetry health
          </Link>
        )}
      >
        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
          Telemetry health summary is not available yet.
        </div>
      </Panel>
    );
  }

  return (
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
          <div className="mt-2 text-3xl font-semibold text-emerald-600">{data.freshness_rate_pct.toFixed(0)}%</div>
          <div className="mt-2 text-sm text-slate-500">Latest event seen within {data.thresholds.fresh_minutes} minutes</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Healthy devices</div>
          <div className="mt-2 text-3xl font-semibold text-emerald-600">{data.healthy_count}</div>
          <div className="mt-2 text-sm text-slate-500">Fresh, frequent, and complete latest telemetry</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Stale telemetry</div>
          <div className="mt-2 text-3xl font-semibold text-amber-600">{data.stale_count}</div>
          <div className="mt-2 text-sm text-slate-500">Older than {data.thresholds.stale_minutes} minutes but not yet offline</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Offline over {data.thresholds.offline_hours}h</div>
          <div className="mt-2 text-3xl font-semibold text-rose-600">{data.offline_over_24h_count}</div>
          <div className="mt-2 text-sm text-slate-500">No telemetry has arrived past the offline threshold</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Low frequency</div>
          <div className="mt-2 text-3xl font-semibold text-amber-600">{data.low_frequency_count}</div>
          <div className="mt-2 text-sm text-slate-500">Below {data.thresholds.low_frequency_events_24h} events in the last 24h</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Missing fields</div>
          <div className="mt-2 text-3xl font-semibold text-sky-700">{data.missing_fields_count}</div>
          <div className="mt-2 text-sm text-slate-500">Latest telemetry snapshot is missing location, odometer, or fuel data</div>
        </div>
      </div>
    </Panel>
  );
}

export function GeofenceAnalyticsPanel({
  data,
}: {
  data?: DashboardSummary['geofence_analytics'];
}) {
  if (!data) {
    return (
      <Panel
        title="Location intelligence"
        description="Visit and dwell analytics derived from geofence entry and exit activity."
        actions={(
          <Link to="/geofences?tab=analytics" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Open geofence analytics
          </Link>
        )}
      >
        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
          Geofence analytics are not available yet.
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      title="Location intelligence"
      description={`Visit and dwell analytics for the last ${data.window.days} days.`}
      actions={(
        <Link to="/geofences?tab=analytics" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
          Open geofence analytics
        </Link>
      )}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Entries</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">{data.summary.total_entries}</div>
          <div className="mt-2 text-sm text-slate-500">Detected geofence arrivals</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Exits</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">{data.summary.total_exits}</div>
          <div className="mt-2 text-sm text-slate-500">Detected geofence departures</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Active visits</div>
          <div className="mt-2 text-3xl font-semibold text-brand-700">{data.summary.active_visits}</div>
          <div className="mt-2 text-sm text-slate-500">Vehicles currently inside monitored locations</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Avg dwell</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">
            {data.summary.average_dwell_minutes != null ? `${data.summary.average_dwell_minutes.toFixed(0)} min` : 'N/A'}
          </div>
          <div className="mt-2 text-sm text-slate-500">{data.summary.total_dwell_hours.toFixed(1)} h total dwell</div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="text-sm font-semibold text-slate-900">Top visited locations</div>
          <div className="mt-3 space-y-3">
            {data.top_visited_locations.length > 0 ? data.top_visited_locations.map((location) => (
              <div key={location.geofence_id} className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 p-4">
                <div>
                  <div className="font-semibold text-slate-900">{location.name}</div>
                  <div className="text-sm text-slate-500">{location.unique_vehicle_count} vehicle{location.unique_vehicle_count === 1 ? '' : 's'}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-semibold text-slate-950">{location.entry_count}</div>
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Entries</div>
                </div>
              </div>
            )) : (
              <div className="text-sm text-slate-500">No geofence arrivals are visible in the current window.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="text-sm font-semibold text-slate-900">Longest dwell locations</div>
          <div className="mt-3 space-y-3">
            {data.longest_dwell_locations.length > 0 ? data.longest_dwell_locations.map((location) => (
              <div key={location.geofence_id} className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 p-4">
                <div>
                  <div className="font-semibold text-slate-900">{location.name}</div>
                  <div className="text-sm text-slate-500">{(location.total_dwell_minutes / 60).toFixed(1)} h total dwell</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-semibold text-slate-950">{location.average_dwell_minutes.toFixed(0)} min</div>
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Avg dwell</div>
                </div>
              </div>
            )) : (
              <div className="text-sm text-slate-500">No resolved dwell samples are available yet.</div>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}

export function FuelAnomaliesPanel({
  data,
}: {
  data?: DashboardSummary['fuel_anomalies'];
}) {
  if (!data) {
    return (
      <Panel
        title="Fuel anomalies"
        description="Operational signals for suspicious drops, stationary refuels, and consumption outliers. These are heuristics intended for follow-up, not guaranteed theft verdicts."
        actions={(
          <Link to="/fuel-insights" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            Open fuel insights
          </Link>
        )}
      >
        <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
          Fuel anomaly summary is not available yet.
        </div>
      </Panel>
    );
  }

  return (
    <Panel
      title="Fuel anomalies"
      description="Operational signals for suspicious drops, stationary refuels, and consumption outliers. These are heuristics intended for follow-up, not guaranteed theft verdicts."
      actions={(
        <Link to="/fuel-insights" className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
          Open fuel insights
        </Link>
      )}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Active anomalies</div>
            <div className="mt-2 text-3xl font-semibold text-rose-600">{data.active_anomalies}</div>
            <div className="mt-2 text-sm text-slate-500">{data.affected_vehicles} vehicles currently need follow-up</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Unexpected drops</div>
            <div className="mt-2 text-3xl font-semibold text-amber-600">{data.unexpected_drop_count}</div>
            <div className="mt-2 text-sm text-slate-500">Drops over {data.thresholds.unexpected_drop_pct.toFixed(0)}% in a short stationary window</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Possible theft</div>
            <div className="mt-2 text-3xl font-semibold text-rose-600">{data.possible_theft_count}</div>
            <div className="mt-2 text-sm text-slate-500">Stationary drops over {data.thresholds.possible_theft_drop_pct.toFixed(0)}%</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Refuels without trip</div>
            <div className="mt-2 text-3xl font-semibold text-sky-700">{data.refuel_without_trip_count}</div>
            <div className="mt-2 text-sm text-slate-500">Stationary increases over {data.thresholds.refuel_increase_pct.toFixed(0)}%</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Abnormal consumption</div>
            <div className="mt-2 text-3xl font-semibold text-slate-950">{data.abnormal_consumption_count}</div>
            <div className="mt-2 text-sm text-slate-500">Estimated consumption above {data.thresholds.abnormal_consumption_multiplier.toFixed(1)}x baseline</div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="text-sm font-semibold text-slate-900">Most suspicious vehicles</div>
          <div className="mt-4 space-y-3">
            {data.suspicious_vehicles.length > 0 ? data.suspicious_vehicles.slice(0, 5).map((vehicle) => (
              <div key={vehicle.vehicle_id} className="flex items-start justify-between gap-4 rounded-2xl bg-slate-50 p-4">
                <div>
                  <div className="font-semibold text-slate-900">{vehicle.plate_number}</div>
                  <div className="text-sm text-slate-500">{vehicle.name}</div>
                  <div className="mt-1 text-xs text-slate-400">Latest anomaly: {formatDateTime(vehicle.latest_triggered_at)}</div>
                </div>
                <div className="flex shrink-0 items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                  <span>{vehicle.anomaly_count}</span>
                  <span>{vehicle.anomaly_count === 1 ? 'issue' : 'issues'}</span>
                </div>
              </div>
            )) : (
              <div className="text-sm text-slate-500">No fuel anomalies are currently active.</div>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
}
