import { useMemo, useState } from 'react';
import { SearchableVehicleField } from '@/components/forms/SearchableVehicleField';
import { PageHeader } from '@/components/ui/PageHeader';
import { CheckboxField } from '@/components/ui/CheckboxField';
import { Panel } from '@/components/ui/Panel';
import { SelectField } from '@/components/ui/SelectField';
import { getApiErrorMessage } from '@/lib/api/errors';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils/format';
import { useVehicles } from '@/features/vehicles/useVehicles';
import {
  useCreateMaintenanceRecord,
  useCreateMaintenanceSchedule,
  useDeleteMaintenanceRecord,
  useDeleteMaintenanceSchedule,
  useMaintenanceRecords,
  useMaintenanceSchedules,
  useUpcomingMaintenance,
} from '@/features/maintenance/useMaintenance';

export function MaintenancePage() {
  const [scheduleVehicleSearch, setScheduleVehicleSearch] = useState('');
  const [recordVehicleSearch, setRecordVehicleSearch] = useState('');
  const [scheduleForm, setScheduleForm] = useState({
    vehicle_id: '',
    name: '',
    interval_days: '',
    interval_km: '',
    next_due_date: '',
    next_due_odometer_km: '',
    is_active: true,
  });
  const [recordForm, setRecordForm] = useState({
    vehicle_id: '',
    maintenance_schedule_id: '',
    title: '',
    service_date: '',
    odometer_km: '',
    cost_amount: '',
    currency: 'EUR',
    notes: '',
  });

  const { data: vehicles } = useVehicles({ is_active: true });
  const { data: schedules, isLoading: schedulesLoading, isError: schedulesError } = useMaintenanceSchedules();
  const { data: records, isLoading: recordsLoading, isError: recordsError } = useMaintenanceRecords();
  const { data: upcoming, isLoading: upcomingLoading, isError: upcomingError } = useUpcomingMaintenance();
  const createSchedule = useCreateMaintenanceSchedule();
  const createRecord = useCreateMaintenanceRecord();
  const deleteSchedule = useDeleteMaintenanceSchedule();
  const deleteRecord = useDeleteMaintenanceRecord();

  const vehicleOptions = vehicles?.data ?? [];

  const availableSchedulesForRecord = useMemo(
    () => (schedules?.data ?? []).filter((schedule) => Number(schedule.vehicle_id) === Number(recordForm.vehicle_id)),
    [recordForm.vehicle_id, schedules?.data],
  );

  return (
    <div>
      <PageHeader title="Maintenance" description="Schedules, service records, and upcoming maintenance reminders." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Create schedule" description="Define recurring preventive maintenance intervals for a selected fleet vehicle.">
          <div className="space-y-3">
            <SearchableVehicleField
              searchId="schedule-vehicle-search"
              searchName="schedule_vehicle_search"
              selectId="schedule-vehicle-id"
              selectName="schedule_vehicle_id"
              searchValue={scheduleVehicleSearch}
              selectedVehicleId={scheduleForm.vehicle_id}
              vehicles={vehicleOptions}
              onSearchChange={setScheduleVehicleSearch}
              onVehicleSelect={(vehicleId) => {
                const nextVehicle = vehicleOptions.find((vehicle) => vehicle.id === Number(vehicleId));
                setScheduleForm((state) => ({ ...state, vehicle_id: vehicleId }));
                if (nextVehicle) {
                  setScheduleVehicleSearch(`${nextVehicle.plate_number} · ${nextVehicle.name}`);
                } else {
                  setScheduleVehicleSearch('');
                }
              }}
            />
            <input id="schedule-name" name="schedule_name" className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Schedule name" value={scheduleForm.name} onChange={(event) => setScheduleForm((state) => ({ ...state, name: event.target.value }))} />
            <div className="grid gap-3 md:grid-cols-2">
              <input id="schedule-interval-days" name="schedule_interval_days" type="number" min="1" className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Interval days" value={scheduleForm.interval_days} onChange={(event) => setScheduleForm((state) => ({ ...state, interval_days: event.target.value }))} />
              <input id="schedule-interval-km" name="schedule_interval_km" type="number" min="1" className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Interval km" value={scheduleForm.interval_km} onChange={(event) => setScheduleForm((state) => ({ ...state, interval_km: event.target.value }))} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input id="schedule-next-due-date" name="schedule_next_due_date" className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="date" value={scheduleForm.next_due_date} onChange={(event) => setScheduleForm((state) => ({ ...state, next_due_date: event.target.value }))} />
              <input id="schedule-next-due-odometer" name="schedule_next_due_odometer_km" type="number" min="0" className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Next due odometer km" value={scheduleForm.next_due_odometer_km} onChange={(event) => setScheduleForm((state) => ({ ...state, next_due_odometer_km: event.target.value }))} />
            </div>
            <CheckboxField id="schedule-is-active" name="schedule_is_active" checked={scheduleForm.is_active} onChange={(event) => setScheduleForm((state) => ({ ...state, is_active: event.target.checked }))} label="Active schedule" />
            <button
              className="w-full rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
              onClick={() =>
                createSchedule.mutate(
                  {
                    vehicle_id: Number(scheduleForm.vehicle_id),
                    name: scheduleForm.name,
                    interval_days: scheduleForm.interval_days ? Number(scheduleForm.interval_days) : null,
                    interval_km: scheduleForm.interval_km ? Number(scheduleForm.interval_km) : null,
                    next_due_date: scheduleForm.next_due_date || null,
                    next_due_odometer_km: scheduleForm.next_due_odometer_km ? Number(scheduleForm.next_due_odometer_km) : null,
                    is_active: scheduleForm.is_active,
                  },
                  {
                    onSuccess: () =>
                      setScheduleForm({
                        vehicle_id: '',
                        name: '',
                        interval_days: '',
                        interval_km: '',
                        next_due_date: '',
                        next_due_odometer_km: '',
                        is_active: true,
                      }),
                  },
                )
              }
            >
              {createSchedule.isPending ? 'Creating...' : 'Create schedule'}
            </button>
            {createSchedule.isError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{getApiErrorMessage(createSchedule.error)}</div> : null}
            {createSchedule.isSuccess ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Schedule created successfully.</div> : null}
          </div>
        </Panel>

        <Panel title="Create record" description="Log completed service work against a selected vehicle and optional maintenance schedule.">
          <div className="space-y-3">
            <SearchableVehicleField
              searchId="record-vehicle-search"
              searchName="record_vehicle_search"
              selectId="record-vehicle-id"
              selectName="record_vehicle_id"
              searchValue={recordVehicleSearch}
              selectedVehicleId={recordForm.vehicle_id}
              vehicles={vehicleOptions}
              onSearchChange={setRecordVehicleSearch}
              onVehicleSelect={(vehicleId) => {
                const nextVehicle = vehicleOptions.find((vehicle) => vehicle.id === Number(vehicleId));
                setRecordForm((state) => ({
                  ...state,
                  vehicle_id: vehicleId,
                  maintenance_schedule_id: '',
                }));
                if (nextVehicle) {
                  setRecordVehicleSearch(`${nextVehicle.plate_number} · ${nextVehicle.name}`);
                } else {
                  setRecordVehicleSearch('');
                }
              }}
            />
            <SelectField
              id="record-maintenance-schedule-id"
              name="record_maintenance_schedule_id"
              value={recordForm.maintenance_schedule_id}
              onValueChange={(value) => setRecordForm((state) => ({ ...state, maintenance_schedule_id: value }))}
              disabled={!recordForm.vehicle_id}
            >
              <option value="">Schedule (optional)</option>
              {availableSchedulesForRecord.map((schedule) => (
                <option key={schedule.id} value={schedule.id}>
                  {schedule.name}
                </option>
              ))}
            </SelectField>
            <input id="record-title" name="record_title" className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Record title" value={recordForm.title} onChange={(event) => setRecordForm((state) => ({ ...state, title: event.target.value }))} />
            <div className="grid gap-3 md:grid-cols-2">
              <input id="record-service-date" name="record_service_date" className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="date" value={recordForm.service_date} onChange={(event) => setRecordForm((state) => ({ ...state, service_date: event.target.value }))} />
              <input id="record-odometer-km" name="record_odometer_km" type="number" min="0" className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Odometer km" value={recordForm.odometer_km} onChange={(event) => setRecordForm((state) => ({ ...state, odometer_km: event.target.value }))} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input id="record-cost-amount" name="record_cost_amount" type="number" min="0" step="0.01" className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Cost amount" value={recordForm.cost_amount} onChange={(event) => setRecordForm((state) => ({ ...state, cost_amount: event.target.value }))} />
              <input id="record-currency" name="record_currency" className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Currency" value={recordForm.currency} onChange={(event) => setRecordForm((state) => ({ ...state, currency: event.target.value }))} />
            </div>
            <textarea id="record-notes" name="record_notes" className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Notes" value={recordForm.notes} onChange={(event) => setRecordForm((state) => ({ ...state, notes: event.target.value }))} rows={4} />
            <button
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white"
              onClick={() =>
                createRecord.mutate(
                  {
                    vehicle_id: Number(recordForm.vehicle_id),
                    maintenance_schedule_id: recordForm.maintenance_schedule_id ? Number(recordForm.maintenance_schedule_id) : null,
                    title: recordForm.title,
                    service_date: recordForm.service_date,
                    odometer_km: recordForm.odometer_km ? Number(recordForm.odometer_km) : null,
                    cost_amount: recordForm.cost_amount ? Number(recordForm.cost_amount) : null,
                    currency: recordForm.currency,
                    notes: recordForm.notes || null,
                  },
                  {
                    onSuccess: () =>
                      setRecordForm({
                        vehicle_id: '',
                        maintenance_schedule_id: '',
                        title: '',
                        service_date: '',
                        odometer_km: '',
                        cost_amount: '',
                        currency: 'EUR',
                        notes: '',
                      }),
                  },
                )
              }
            >
              {createRecord.isPending ? 'Creating...' : 'Create record'}
            </button>
            {createRecord.isError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{getApiErrorMessage(createRecord.error)}</div> : null}
            {createRecord.isSuccess ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Service record created successfully.</div> : null}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title="Upcoming" description="Schedules due soon by date or mileage.">
          {upcomingLoading ? <div className="text-sm text-slate-500">Loading upcoming maintenance...</div> : null}
          {upcomingError ? <div className="text-sm text-rose-600">Failed to load upcoming maintenance.</div> : null}
          {!upcomingLoading && !upcomingError ? (
            (upcoming?.data?.length ?? 0) > 0 ? (
              <div className="space-y-3">
                {(upcoming?.data ?? []).map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-950">{item.name}</div>
                        <div className="text-sm text-slate-500">
                          {item.vehicle?.plate_number ?? item.vehicle_id}
                          {item.vehicle?.name ? ` · ${item.vehicle.name}` : ''}
                        </div>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-slate-700">
                      <div>Due date: <span className="font-medium">{formatDate(item.next_due_date)}</span></div>
                      <div>Due odometer: <span className="font-medium">{formatNumber(item.next_due_odometer_km, 'km')}</span></div>
                      <div>Interval: <span className="font-medium">{item.interval_days ? `${item.interval_days} days` : 'No day interval'}</span>{item.interval_km ? ` · ${formatNumber(item.interval_km, 'km')}` : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">No upcoming maintenance items.</div>
            )
          ) : null}
        </Panel>
        <Panel title="Schedules" description="Current maintenance schedule definitions.">
          {schedulesLoading ? <div className="text-sm text-slate-500">Loading schedules...</div> : null}
          {schedulesError ? <div className="text-sm text-rose-600">Failed to load schedules.</div> : null}
          {!schedulesLoading && !schedulesError ? (
            (schedules?.data?.length ?? 0) > 0 ? (
              <div className="space-y-3">
                {(schedules?.data ?? []).map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 p-4">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-950">{item.name}</div>
                      <div className="text-sm text-slate-500">
                        {item.vehicle?.plate_number ?? item.vehicle_id}
                        {item.vehicle?.name ? ` · ${item.vehicle.name}` : ''}
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-slate-700">
                        <div>Next due date: <span className="font-medium">{formatDate(item.next_due_date)}</span></div>
                        <div>Next due odometer: <span className="font-medium">{formatNumber(item.next_due_odometer_km, 'km')}</span></div>
                        <div>Interval days: <span className="font-medium">{item.interval_days ?? 'Not set'}</span></div>
                        <div>Interval km: <span className="font-medium">{formatNumber(item.interval_km, 'km')}</span></div>
                        <div>Status: <span className="font-medium">{item.is_active ? 'Active' : 'Inactive'}</span></div>
                      </div>
                    </div>
                    <button className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => deleteSchedule.mutate(item.id)}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">No schedules created yet.</div>
            )
          ) : null}
        </Panel>
        <Panel title="Service records" description="Completed maintenance work history.">
          {recordsLoading ? <div className="text-sm text-slate-500">Loading records...</div> : null}
          {recordsError ? <div className="text-sm text-rose-600">Failed to load records.</div> : null}
          {!recordsLoading && !recordsError ? (
            (records?.data?.length ?? 0) > 0 ? (
              <div className="space-y-3">
                {(records?.data ?? []).map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 p-4">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-950">{item.title}</div>
                      <div className="text-sm text-slate-500">
                        {item.vehicle?.plate_number ?? item.vehicle_id}
                        {item.vehicle?.name ? ` · ${item.vehicle.name}` : ''}
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-slate-700">
                        <div>Service date: <span className="font-medium">{formatDate(item.service_date)}</span></div>
                        <div>Odometer: <span className="font-medium">{formatNumber(item.odometer_km, 'km')}</span></div>
                        <div>Cost: <span className="font-medium">{formatCurrency(item.cost_amount, item.currency)}</span></div>
                        {item.notes ? <div>Notes: <span className="font-medium">{item.notes}</span></div> : null}
                      </div>
                    </div>
                    <button className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => deleteRecord.mutate(item.id)}>
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">No service records logged yet.</div>
            )
          ) : null}
        </Panel>
      </div>
    </div>
  );
}
