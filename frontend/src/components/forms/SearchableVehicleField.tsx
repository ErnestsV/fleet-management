import { useMemo } from 'react';
import { SelectField } from '@/components/ui/SelectField';
import type { Vehicle } from '@/types/domain';

type SearchableVehicleFieldProps = {
  searchId: string;
  searchName: string;
  selectId: string;
  selectName: string;
  searchValue: string;
  selectedVehicleId: string;
  vehicles: Vehicle[];
  placeholder?: string;
  onSearchChange: (value: string) => void;
  onVehicleSelect: (vehicleId: string) => void;
};

function vehicleLabel(vehicle: Vehicle) {
  return `${vehicle.plate_number} · ${vehicle.name}`;
}

export function SearchableVehicleField({
  searchId,
  searchName,
  selectId,
  selectName,
  searchValue,
  selectedVehicleId,
  vehicles,
  placeholder = 'Search vehicle by plate, name, make, or model',
  onSearchChange,
  onVehicleSelect,
}: SearchableVehicleFieldProps) {
  const filteredVehicles = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    if (!query) {
      return vehicles;
    }

    return vehicles.filter((vehicle) =>
      [vehicle.plate_number, vehicle.name, vehicle.make, vehicle.model]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [searchValue, vehicles]);

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === Number(selectedVehicleId));
  const showSuggestions = searchValue.trim().length > 0 && filteredVehicles.length > 0;

  return (
    <>
      <div className="relative">
        <input
          id={searchId}
          name={searchName}
          autoComplete="off"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
          placeholder={placeholder}
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        {showSuggestions ? (
          <div className="absolute z-10 mt-2 max-h-56 w-full overflow-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
            {filteredVehicles.map((vehicle) => (
              <button
                key={`${searchId}-suggestion-${vehicle.id}`}
                type="button"
                className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-50"
                onClick={() => onVehicleSelect(String(vehicle.id))}
              >
                <div className="font-semibold text-slate-900">{vehicle.plate_number}</div>
                <div className="text-slate-500">
                  {vehicle.name}
                  {vehicle.make || vehicle.model ? ` · ${vehicle.make ?? ''} ${vehicle.model ?? ''}` : ''}
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <SelectField
        id={selectId}
        name={selectName}
        value={selectedVehicleId}
        onValueChange={onVehicleSelect}
      >
        <option value="">Select vehicle</option>
        {filteredVehicles.map((vehicle) => (
          <option key={vehicle.id} value={vehicle.id}>
            {vehicleLabel(vehicle)}
          </option>
        ))}
      </SelectField>

      {selectedVehicle ? (
        <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Selected vehicle: <span className="font-semibold text-slate-900">{selectedVehicle.plate_number}</span> · {selectedVehicle.name}
        </div>
      ) : null}
    </>
  );
}
