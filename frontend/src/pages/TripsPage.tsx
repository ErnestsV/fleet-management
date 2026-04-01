import { useState } from 'react';
import { DataTable, DataTableBody, DataTableHead } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { useTrips, useTrip } from '@/features/trips/useTrips';
import { formatDateTime } from '@/lib/utils/format';

export function TripsPage() {
  const [vehicleId, setVehicleId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data, isLoading, isError } = useTrips({
    vehicle_id: vehicleId || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  });
  const { data: detail } = useTrip(selectedId);

  return (
    <div>
      <PageHeader title="Trips" description="Derived trip history based on telemetry events and vehicle state transitions." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel
          title="Trip history"
          description="MVP assumptions: trip starts on first moving event and closes on first non-moving event after movement."
          actions={
            <div className="flex flex-wrap gap-2">
              <input className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" placeholder="Vehicle ID" value={vehicleId} onChange={(event) => setVehicleId(event.target.value)} />
              <input className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
              <input className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            </div>
          }
        >
          {isLoading ? <div className="text-sm text-slate-500">Loading trips...</div> : null}
          {isError ? <div className="text-sm text-rose-600">Failed to load trips.</div> : null}
        {!isLoading && !isError ? (
          (data?.data?.length ?? 0) > 0 ? (
              <DataTable>
                <DataTableHead>
                    <tr>
                      <th className="px-4 py-3">Vehicle</th>
                      <th className="px-4 py-3">Start</th>
                      <th className="px-4 py-3">End</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Distance</th>
                      <th className="px-4 py-3">Avg speed</th>
                    </tr>
                </DataTableHead>
                <DataTableBody>
                    {(data?.data ?? []).map((trip) => (
                      <tr key={trip.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedId(trip.id)}>
                        <td className="px-4 py-3">{trip.vehicle?.plate_number ?? trip.vehicle_id}</td>
                        <td className="px-4 py-3">{formatDateTime(trip.start_time)}</td>
                        <td className="px-4 py-3">{trip.end_time ? formatDateTime(trip.end_time) : 'Open'}</td>
                        <td className="px-4 py-3">{Math.round(trip.duration_seconds / 60)} min</td>
                        <td className="px-4 py-3">{trip.distance_km} km</td>
                        <td className="px-4 py-3">{trip.average_speed_kmh} km/h</td>
                      </tr>
                    ))}
                </DataTableBody>
              </DataTable>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-sm text-slate-500">No trips match the current filters.</div>
            )
          ) : null}
        </Panel>
        <Panel title="Trip detail" description="Selected trip summary and location snapshots.">
          {detail?.data ? (
            <div className="space-y-4 text-sm text-slate-700">
              <div><span className="font-semibold">Vehicle:</span> {detail.data.vehicle?.plate_number ?? detail.data.vehicle_id}</div>
              <div><span className="font-semibold">Start:</span> {formatDateTime(detail.data.start_time)}</div>
              <div><span className="font-semibold">End:</span> {detail.data.end_time ? formatDateTime(detail.data.end_time) : 'Open'}</div>
              <div><span className="font-semibold">Distance:</span> {detail.data.distance_km} km</div>
              <div><span className="font-semibold">Average speed:</span> {detail.data.average_speed_kmh} km/h</div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">Select a trip row to inspect details.</div>
          )}
        </Panel>
      </div>
    </div>
  );
}
