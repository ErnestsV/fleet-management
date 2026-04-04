export type MaintenanceScheduleFormValues = {
  vehicle_id: string;
  name: string;
  interval_days: string;
  interval_km: string;
  next_due_date: string;
  next_due_odometer_km: string;
  is_active: boolean;
};

export type MaintenanceRecordFormValues = {
  vehicle_id: string;
  maintenance_schedule_id: string;
  title: string;
  service_date: string;
  odometer_km: string;
  cost_amount: string;
  currency: string;
  notes: string;
};

export function createEmptyMaintenanceScheduleFormValues(): MaintenanceScheduleFormValues {
  return {
    vehicle_id: '',
    name: '',
    interval_days: '',
    interval_km: '',
    next_due_date: '',
    next_due_odometer_km: '',
    is_active: true,
  };
}

export function createEmptyMaintenanceRecordFormValues(): MaintenanceRecordFormValues {
  return {
    vehicle_id: '',
    maintenance_schedule_id: '',
    title: '',
    service_date: '',
    odometer_km: '',
    cost_amount: '',
    currency: 'EUR',
    notes: '',
  };
}

export function buildCreateMaintenanceSchedulePayload(form: MaintenanceScheduleFormValues) {
  return {
    vehicle_id: Number(form.vehicle_id),
    name: form.name,
    interval_days: form.interval_days ? Number(form.interval_days) : null,
    interval_km: form.interval_km ? Number(form.interval_km) : null,
    next_due_date: form.next_due_date || null,
    next_due_odometer_km: form.next_due_odometer_km ? Number(form.next_due_odometer_km) : null,
    is_active: form.is_active,
  };
}

export function buildCreateMaintenanceRecordPayload(form: MaintenanceRecordFormValues) {
  return {
    vehicle_id: Number(form.vehicle_id),
    maintenance_schedule_id: form.maintenance_schedule_id ? Number(form.maintenance_schedule_id) : null,
    title: form.title,
    service_date: form.service_date,
    odometer_km: form.odometer_km ? Number(form.odometer_km) : null,
    cost_amount: form.cost_amount ? Number(form.cost_amount) : null,
    currency: form.currency,
    notes: form.notes || null,
  };
}
