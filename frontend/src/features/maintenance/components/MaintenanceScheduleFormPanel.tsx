import { SearchableVehicleField } from '@/components/forms/SearchableVehicleField';
import { CheckboxField } from '@/components/ui/CheckboxField';
import { DismissibleAlert } from '@/components/ui/DismissibleAlert';
import { Panel } from '@/components/ui/Panel';
import type { Vehicle } from '@/types/domain';
import type { MaintenanceScheduleFormValues } from '@/features/maintenance/form';

type MaintenanceScheduleFormPanelProps = {
  vehicles: Vehicle[];
  vehicleSearch: string;
  form: MaintenanceScheduleFormValues;
  isSubmitting: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onVehicleSearchChange: (value: string) => void;
  onChange: (updater: (current: MaintenanceScheduleFormValues) => MaintenanceScheduleFormValues) => void;
  onDismissError: () => void;
  onDismissSuccess: () => void;
  onSubmit: () => void;
};

export function MaintenanceScheduleFormPanel({
  vehicles,
  vehicleSearch,
  form,
  isSubmitting,
  errorMessage,
  successMessage,
  onVehicleSearchChange,
  onChange,
  onDismissError,
  onDismissSuccess,
  onSubmit,
}: MaintenanceScheduleFormPanelProps) {
  return (
    <Panel title="Create schedule" description="Define recurring preventive maintenance intervals for a selected fleet vehicle.">
      <div className="space-y-3">
        <SearchableVehicleField
          searchId="schedule-vehicle-search"
          searchName="schedule_vehicle_search"
          selectId="schedule-vehicle-id"
          selectName="schedule_vehicle_id"
          searchValue={vehicleSearch}
          selectedVehicleId={form.vehicle_id}
          vehicles={vehicles}
          onSearchChange={onVehicleSearchChange}
          onVehicleSelect={(vehicleId) => {
            const nextVehicle = vehicles.find((vehicle) => vehicle.id === Number(vehicleId));

            onChange((state) => ({ ...state, vehicle_id: vehicleId }));
            onVehicleSearchChange(nextVehicle ? `${nextVehicle.plate_number} · ${nextVehicle.name}` : '');
          }}
        />
        <div>
          <label htmlFor="schedule-name" className="mb-2 block text-sm font-medium text-slate-700">Schedule name</label>
          <input
            id="schedule-name"
            name="schedule_name"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            placeholder="Schedule name"
            value={form.name}
            onChange={(event) => onChange((state) => ({ ...state, name: event.target.value }))}
          />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="schedule-interval-days" className="mb-2 block text-sm font-medium text-slate-700">Interval days</label>
            <input
              id="schedule-interval-days"
              name="schedule_interval_days"
              type="number"
              min="1"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              placeholder="Interval days"
              value={form.interval_days}
              onChange={(event) => onChange((state) => ({ ...state, interval_days: event.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="schedule-interval-km" className="mb-2 block text-sm font-medium text-slate-700">Interval km</label>
            <input
              id="schedule-interval-km"
              name="schedule_interval_km"
              type="number"
              min="1"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              placeholder="Interval km"
              value={form.interval_km}
              onChange={(event) => onChange((state) => ({ ...state, interval_km: event.target.value }))}
            />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="schedule-next-due-date" className="mb-2 block text-sm font-medium text-slate-700">Next due date</label>
            <input
              id="schedule-next-due-date"
              name="schedule_next_due_date"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              type="date"
              value={form.next_due_date}
              onChange={(event) => onChange((state) => ({ ...state, next_due_date: event.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="schedule-next-due-odometer" className="mb-2 block text-sm font-medium text-slate-700">Next due odometer km</label>
            <input
              id="schedule-next-due-odometer"
              name="schedule_next_due_odometer_km"
              type="number"
              min="0"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              placeholder="Next due odometer km"
              value={form.next_due_odometer_km}
              onChange={(event) => onChange((state) => ({ ...state, next_due_odometer_km: event.target.value }))}
            />
          </div>
        </div>
        <CheckboxField
          id="schedule-is-active"
          name="schedule_is_active"
          checked={form.is_active}
          onChange={(event) => onChange((state) => ({ ...state, is_active: event.target.checked }))}
          label="Active schedule"
        />
        <button className="w-full rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60" onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create schedule'}
        </button>
        {errorMessage ? <DismissibleAlert tone="error" message={errorMessage} onClose={onDismissError} /> : null}
        {successMessage ? <DismissibleAlert message={successMessage} onClose={onDismissSuccess} /> : null}
      </div>
    </Panel>
  );
}
