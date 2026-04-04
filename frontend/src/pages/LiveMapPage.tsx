import { useCallback, useMemo, useState } from 'react';
import { OperationsMap } from '@/components/maps/OperationsMap';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { SearchablePagedList } from '@/components/ui/SearchablePagedList';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useVehicles } from '@/features/vehicles/useVehicles';
import type { Vehicle } from '@/types/domain';

const VEHICLE_PAGE_SIZE = 5;

type FleetListProps = {
  vehicles: Vehicle[];
  selectedVehicleId: number | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (vehicleId: number) => void;
  limitResults?: boolean;
  stickySearch?: boolean;
  scrollable?: boolean;
};

function FleetVehicleList({
  vehicles,
  selectedVehicleId,
  search,
  onSearchChange,
  onSelect,
  limitResults = false,
  stickySearch = false,
  scrollable = false,
}: FleetListProps) {
  return (
    <SearchablePagedList
      items={vehicles}
      query={search}
      onQueryChange={onSearchChange}
      filterItem={(vehicle, query) =>
        [vehicle.name, vehicle.plate_number, vehicle.make, vehicle.model, vehicle.assigned_driver?.name]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      }
      renderItem={(vehicle) => (
        <button
          className={`w-full rounded-2xl border p-4 text-left transition ${selectedVehicleId === vehicle.id ? 'border-brand-500 bg-emerald-50/50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
          onClick={() => onSelect(vehicle.id)}
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
      )}
      getKey={(vehicle) => vehicle.id}
      searchPlaceholder="Search fleet"
      emptyMessage="No vehicles match the current search."
      pageSize={limitResults ? VEHICLE_PAGE_SIZE : Math.max(vehicles.length, 1)}
      showMoreLabel="Show 5 more vehicles"
      stickySearch={stickySearch}
      scrollable={scrollable}
    />
  );
}

export function LiveMapPage() {
  const [search, setSearch] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [vehicleFocusVersion, setVehicleFocusVersion] = useState(0);
  const { data, isLoading, isError } = useVehicles({ is_active: true });

  const vehicles = useMemo(() => data?.data ?? [], [data?.data]);

  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return vehicles;
    }

    return vehicles.filter((vehicle) =>
      [vehicle.name, vehicle.plate_number, vehicle.make, vehicle.model, vehicle.assigned_driver?.name]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [vehicles, search]);

  const selectedVehicle = filteredVehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? filteredVehicles[0] ?? null;

  const markers = useMemo(
    () =>
      filteredVehicles.map((vehicle) => ({
        id: vehicle.id,
        label: vehicle.plate_number,
        status: vehicle.state?.status,
        latitude: vehicle.state?.latitude,
        longitude: vehicle.state?.longitude,
        details: `${vehicle.name} · ${vehicle.assigned_driver?.name ?? 'No driver'}`,
      })),
    [filteredVehicles],
  );

  const selectVehicle = useCallback((vehicleId: number) => {
    setSelectedVehicleId(vehicleId);
    setVehicleFocusVersion((current) => current + 1);
  }, []);
  const handleMapVehicleSelect = useCallback((vehicleId: number | string) => {
    selectVehicle(Number(vehicleId));
  }, [selectVehicle]);

  return (
    <div>
      <PageHeader title="Live map" description="Search the active fleet, inspect the current vehicle state, and view marker positions on a provider-agnostic operations map." />
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)] xl:items-start">
        <Panel
          title="Fleet search"
          description="Search by plate, name, make, or model and drill into a specific vehicle."
          className="xl:sticky xl:top-6 xl:flex xl:h-[calc(100vh-8.5rem)] xl:flex-col"
        >
          {isLoading ? <div className="text-sm text-slate-500">Loading vehicles...</div> : null}
          {isError ? <div className="text-sm text-rose-600">Failed to load fleet data.</div> : null}
          {!isLoading && !isError ? (
            <FleetVehicleList
              vehicles={vehicles}
              selectedVehicleId={selectedVehicle?.id ?? null}
              search={search}
              onSearchChange={setSearch}
              onSelect={selectVehicle}
              stickySearch
              scrollable
              limitResults
            />
          ) : null}
        </Panel>

        <div className="space-y-6 xl:sticky xl:top-6">
          <OperationsMap
            vehicleMarkers={markers}
            selectedVehicleId={selectedVehicle?.id ?? null}
            vehicleFocusKey={selectedVehicle ? `${selectedVehicle.id}:${vehicleFocusVersion}` : null}
            caption="Live fleet positions on an OpenStreetMap operations canvas."
            emptyMessage="No active vehicles have a live location yet."
            allowFullscreen
            fullscreenSidebarTitle="Fleet search"
            fullscreenSidebar={
              <FleetVehicleList
                vehicles={vehicles}
                selectedVehicleId={selectedVehicle?.id ?? null}
                search={search}
                onSearchChange={setSearch}
                onSelect={selectVehicle}
                stickySearch
                scrollable
                limitResults
              />
            }
            heightClassName="min-h-[420px]"
            onVehicleSelect={handleMapVehicleSelect}
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
