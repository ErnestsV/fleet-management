import { useMemo, useState } from 'react';
import { MapPlaceholder } from '@/components/maps/MapPlaceholder';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useVehicles } from '@/features/vehicles/useVehicles';

export function LiveMapPage() {
  const [search, setSearch] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const { data, isLoading, isError } = useVehicles({ is_active: true });

  const vehicles = useMemo(() => {
    const query = search.trim().toLowerCase();
    const source = data?.data ?? [];

    if (!query) {
      return source;
    }

    return source.filter((vehicle) =>
      [vehicle.name, vehicle.plate_number, vehicle.make, vehicle.model, vehicle.assigned_driver?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [data?.data, search]);

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? vehicles[0] ?? null;

  const markers = useMemo(
    () =>
      vehicles.map((vehicle) => ({
        id: vehicle.id,
        label: vehicle.plate_number,
        status: vehicle.state?.status,
        latitude: vehicle.state?.latitude,
        longitude: vehicle.state?.longitude,
      })),
    [vehicles],
  );

  return (
    <div>
      <PageHeader title="Live map" description="Search the active fleet, inspect the current vehicle state, and view marker positions on a provider-agnostic operations map." />
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Panel
          title="Fleet search"
          description="Search by plate, name, make, or model and drill into a specific vehicle."
          actions={<input className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" placeholder="Search fleet" value={search} onChange={(event) => setSearch(event.target.value)} />}
        >
          {isLoading ? <div className="text-sm text-slate-500">Loading vehicles...</div> : null}
          {isError ? <div className="text-sm text-rose-600">Failed to load fleet data.</div> : null}
          {!isLoading && !isError ? (
            vehicles.length > 0 ? (
              <div className="space-y-3">
                {vehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    className={`w-full rounded-2xl border p-4 text-left transition ${selectedVehicle?.id === vehicle.id ? 'border-brand-500 bg-emerald-50/50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                    onClick={() => setSelectedVehicleId(vehicle.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-semibold">{vehicle.plate_number}</div>
                        <div className="text-sm text-slate-500">{vehicle.make ?? 'Unknown make'} {vehicle.model ?? ''}</div>
                      </div>
                      <StatusBadge value={vehicle.state?.status ?? 'offline'} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                      <span>{vehicle.state?.speed_kmh ?? 0} km/h</span>
                      <span>{vehicle.assigned_driver?.name ?? 'No driver'}</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      {vehicle.state?.last_event_at ? `Last event: ${new Date(vehicle.state.last_event_at).toLocaleString()}` : 'No telemetry yet'}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">No vehicles match the current search.</div>
            )
          ) : null}
        </Panel>

        <div className="space-y-6">
          <MapPlaceholder
            markers={markers}
            selectedMarkerId={selectedVehicle?.id ?? null}
            caption="Live fleet map workspace. Swap in Mapbox or Leaflet later without changing the vehicle-state contract."
          />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <Panel title="Selected vehicle" description="Current operational context for the chosen marker or list item.">
              {selectedVehicle ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Identity</div>
                    <div className="mt-2 text-xl font-semibold">{selectedVehicle.plate_number}</div>
                    <div className="text-sm text-slate-500">{selectedVehicle.name}</div>
                    <div className="mt-3 text-sm text-slate-700">{selectedVehicle.make ?? 'Unknown make'} {selectedVehicle.model ?? ''}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Telemetry</div>
                    <div className="mt-2"><StatusBadge value={selectedVehicle.state?.status} /></div>
                    <div className="mt-3 text-sm text-slate-700">Speed: {selectedVehicle.state?.speed_kmh ?? 0} km/h</div>
                    <div className="mt-1 text-sm text-slate-700">Fuel: {selectedVehicle.state?.fuel_level ?? 'N/A'}{typeof selectedVehicle.state?.fuel_level === 'number' ? '%' : ''}</div>
                    <div className="mt-1 text-sm text-slate-700">Heading: {selectedVehicle.state?.heading ?? 'N/A'}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Driver</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{selectedVehicle.assigned_driver?.name ?? 'No driver assigned'}</div>
                    <div className="mt-2 text-sm text-slate-500">
                      {selectedVehicle.assigned_driver?.assigned_from ? `Assigned from ${new Date(selectedVehicle.assigned_driver.assigned_from).toLocaleString()}` : 'Assignment history available in vehicle management.'}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Position</div>
                    <div className="mt-2 text-sm text-slate-700">Lat: {selectedVehicle.state?.latitude ?? 'N/A'}</div>
                    <div className="mt-1 text-sm text-slate-700">Lng: {selectedVehicle.state?.longitude ?? 'N/A'}</div>
                    <div className="mt-2 text-sm text-slate-500">
                      {selectedVehicle.state?.last_event_at ? `Updated ${new Date(selectedVehicle.state.last_event_at).toLocaleString()}` : 'Waiting for telemetry'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">Select a vehicle from the fleet list to inspect it here.</div>
              )}
            </Panel>

            <Panel title="Fleet overview" description="Quick status tallies for the filtered fleet on the map.">
              <div className="space-y-3">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Filtered vehicles</div>
                  <div className="mt-2 text-3xl font-semibold">{vehicles.length}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Moving</div>
                  <div className="mt-2 text-3xl font-semibold">{vehicles.filter((vehicle) => vehicle.state?.status === 'moving').length}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Idling</div>
                  <div className="mt-2 text-3xl font-semibold">{vehicles.filter((vehicle) => vehicle.state?.status === 'idling').length}</div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Without telemetry</div>
                  <div className="mt-2 text-3xl font-semibold">{vehicles.filter((vehicle) => !vehicle.state?.last_event_at).length}</div>
                </div>
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
