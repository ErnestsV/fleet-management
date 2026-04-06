import { useEffect, useState } from 'react';
import { DataTable, DataTableBody, DataTableHead } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { SearchField } from '@/components/ui/SearchField';
import { SelectField } from '@/components/ui/SelectField';
import { StatCard } from '@/components/ui/StatCard';
import { useTrips, useTrip } from '@/features/trips/useTrips';
import { useVehicles } from '@/features/vehicles/useVehicles';
import { formatDateTime } from '@/lib/utils/format';
import type { Trip } from '@/types/domain';

export function TripsPage() {
  const [search, setSearch] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data: vehicles } = useVehicles({ is_active: true });
  const { data, isLoading, isError } = useTrips({
    search: search || undefined,
    vehicle_id: vehicleId || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    page,
    per_page: 10,
  });
  const { data: detail } = useTrip(selectedId);
  const currentPage = data?.meta?.current_page ?? 1;
  const lastPage = data?.meta?.last_page ?? 1;
  const pageNumbers = Array.from({ length: lastPage }, (_, index) => index + 1);
  const afterHoursHint = 'Trips starting outside the configured after-hours working window';
  const summaryCards = data?.summary ? [
    { label: 'Trips', value: String(data.summary.trip_count), hint: 'Across the current filtered result set' },
    { label: 'Avg trip distance', value: data.summary.average_trip_distance_km != null ? `${data.summary.average_trip_distance_km.toFixed(1)} km` : 'N/A', hint: 'Across the current filtered result set' },
    { label: 'Avg trip duration', value: data.summary.average_trip_duration_minutes != null ? `${data.summary.average_trip_duration_minutes.toFixed(1)} min` : 'N/A', hint: 'Across the current filtered result set' },
    { label: 'Drive time', value: `${data.summary.total_drive_hours.toFixed(1)} h`, hint: 'Total completed trip time' },
    { label: 'After-hours trips', value: String(data.summary.after_hours_trip_count), hint: afterHoursHint },
  ] : [];

  useEffect(() => {
    setPage(1);
  }, [search, vehicleId, dateFrom, dateTo]);

  useEffect(() => {
    if (selectedId == null) {
      return;
    }

    if (!(data?.data ?? []).some((trip: Trip) => trip.id === selectedId)) {
      setSelectedId(null);
    }
  }, [data, selectedId]);

  return (
    <div>
      <PageHeader title="Trips" description="Derived trip history based on telemetry events and vehicle state transitions." />
      {!isLoading && !isError && data?.summary ? (
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {summaryCards.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel
          title="Trip history"
          description="MVP assumptions: trip starts on first moving event and closes on first non-moving event after movement. Summary cards above cover the full filtered result set."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <SearchField value={search} onChange={setSearch} placeholder="Search vehicles" />
              <SelectField className="py-2 text-sm" value={vehicleId} onValueChange={setVehicleId}>
                <option value="">All vehicles</option>
                {(vehicles?.data ?? []).map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plate_number} · {vehicle.name}
                  </option>
                ))}
              </SelectField>
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
                    {(data?.data ?? []).map((trip: Trip) => (
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
          {!isLoading && !isError && lastPage > 1 ? (
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
