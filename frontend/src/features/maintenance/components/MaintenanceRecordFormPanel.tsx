import { SearchableVehicleField } from '@/components/forms/SearchableVehicleField';
import { DismissibleAlert } from '@/components/ui/DismissibleAlert';
import { Panel } from '@/components/ui/Panel';
import { SelectField } from '@/components/ui/SelectField';
import type { MaintenanceRecordFormValues } from '@/features/maintenance/form';
import type { MaintenanceSchedule, Vehicle } from '@/types/domain';

type MaintenanceRecordFormPanelProps = {
  vehicles: Vehicle[];
  schedules: MaintenanceSchedule[];
  vehicleSearch: string;
  form: MaintenanceRecordFormValues;
  isSubmitting: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onVehicleSearchChange: (value: string) => void;
  onChange: (updater: (current: MaintenanceRecordFormValues) => MaintenanceRecordFormValues) => void;
  onDismissError: () => void;
  onDismissSuccess: () => void;
  onSubmit: () => void;
};

export function MaintenanceRecordFormPanel({
  vehicles,
  schedules,
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
}: MaintenanceRecordFormPanelProps) {
  return (
    <Panel title="Create record" description="Log completed service work against a selected vehicle and optional maintenance schedule.">
      <div className="space-y-3">
        <SearchableVehicleField
          searchId="record-vehicle-search"
          searchName="record_vehicle_search"
          selectId="record-vehicle-id"
          selectName="record_vehicle_id"
          searchValue={vehicleSearch}
          selectedVehicleId={form.vehicle_id}
          vehicles={vehicles}
          onSearchChange={onVehicleSearchChange}
          onVehicleSelect={(vehicleId) => {
            const nextVehicle = vehicles.find((vehicle) => vehicle.id === Number(vehicleId));

            onChange((state) => ({
              ...state,
              vehicle_id: vehicleId,
              maintenance_schedule_id: '',
            }));
            onVehicleSearchChange(nextVehicle ? `${nextVehicle.plate_number} · ${nextVehicle.name}` : '');
          }}
        />
        <SelectField
          id="record-maintenance-schedule-id"
          name="record_maintenance_schedule_id"
          value={form.maintenance_schedule_id}
          onValueChange={(value) => onChange((state) => ({ ...state, maintenance_schedule_id: value }))}
          disabled={!form.vehicle_id}
        >
          <option value="">Schedule (optional)</option>
          {schedules.map((schedule) => (
            <option key={schedule.id} value={schedule.id}>
              {schedule.name}
            </option>
          ))}
        </SelectField>
        <input
          id="record-title"
          name="record_title"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
          placeholder="Record title"
          value={form.title}
          onChange={(event) => onChange((state) => ({ ...state, title: event.target.value }))}
        />
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label htmlFor="record-service-date" className="mb-2 block text-sm font-medium text-slate-700">Service date</label>
            <input
              id="record-service-date"
              name="record_service_date"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              type="date"
              value={form.service_date}
              onChange={(event) => onChange((state) => ({ ...state, service_date: event.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="record-odometer-km" className="mb-2 block text-sm font-medium text-slate-700">Odometer km</label>
            <input
              id="record-odometer-km"
              name="record_odometer_km"
              type="number"
              min="0"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              placeholder="Odometer km"
              value={form.odometer_km}
              onChange={(event) => onChange((state) => ({ ...state, odometer_km: event.target.value }))}
            />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            id="record-cost-amount"
            name="record_cost_amount"
            type="number"
            min="0"
            step="0.01"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            placeholder="Cost amount"
            value={form.cost_amount}
            onChange={(event) => onChange((state) => ({ ...state, cost_amount: event.target.value }))}
          />
          <input
            id="record-currency"
            name="record_currency"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            placeholder="Currency"
            value={form.currency}
            onChange={(event) => onChange((state) => ({ ...state, currency: event.target.value }))}
          />
        </div>
        <textarea
          id="record-notes"
          name="record_notes"
          className="w-full rounded-2xl border border-slate-200 px-4 py-3"
          placeholder="Notes"
          value={form.notes}
          onChange={(event) => onChange((state) => ({ ...state, notes: event.target.value }))}
          rows={4}
        />
        <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white" onClick={onSubmit}>
          {isSubmitting ? 'Creating...' : 'Create record'}
        </button>
        {errorMessage ? <DismissibleAlert tone="error" message={errorMessage} onClose={onDismissError} /> : null}
        {successMessage ? <DismissibleAlert message={successMessage} onClose={onDismissSuccess} /> : null}
      </div>
    </Panel>
  );
}
