import { useCallback, useMemo, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DismissibleAlert } from '@/components/ui/DismissibleAlert';
import { getApiErrorMessage } from '@/lib/api/errors';
import { MaintenanceRecordFormPanel } from '@/features/maintenance/components/MaintenanceRecordFormPanel';
import { MaintenanceRecordsPanel } from '@/features/maintenance/components/MaintenanceRecordsPanel';
import { MaintenanceScheduleFormPanel } from '@/features/maintenance/components/MaintenanceScheduleFormPanel';
import { MaintenanceSchedulesPanel } from '@/features/maintenance/components/MaintenanceSchedulesPanel';
import { UpcomingMaintenancePanel } from '@/features/maintenance/components/UpcomingMaintenancePanel';
import {
  buildCreateMaintenanceRecordPayload,
  buildCreateMaintenanceSchedulePayload,
  createEmptyMaintenanceRecordFormValues,
  createEmptyMaintenanceScheduleFormValues,
} from '@/features/maintenance/form';
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
  const [scheduleForm, setScheduleForm] = useState(createEmptyMaintenanceScheduleFormValues);
  const [recordForm, setRecordForm] = useState(createEmptyMaintenanceRecordFormValues);

  const { data: vehicles } = useVehicles({ is_active: true });
  const { data: schedules, isLoading: schedulesLoading, isError: schedulesError } = useMaintenanceSchedules();
  const { data: records, isLoading: recordsLoading, isError: recordsError } = useMaintenanceRecords();
  const { data: upcoming, isLoading: upcomingLoading, isError: upcomingError } = useUpcomingMaintenance();
  const createSchedule = useCreateMaintenanceSchedule();
  const createRecord = useCreateMaintenanceRecord();
  const deleteSchedule = useDeleteMaintenanceSchedule();
  const deleteRecord = useDeleteMaintenanceRecord();
  const [scheduleSuccessMessage, setScheduleSuccessMessage] = useState<string | null>(null);
  const [recordSuccessMessage, setRecordSuccessMessage] = useState<string | null>(null);
  const dismissScheduleSuccessMessage = useCallback(() => setScheduleSuccessMessage(null), []);
  const dismissRecordSuccessMessage = useCallback(() => setRecordSuccessMessage(null), []);
  const dismissScheduleCreateError = useCallback(() => createSchedule.reset(), [createSchedule]);
  const dismissRecordCreateError = useCallback(() => createRecord.reset(), [createRecord]);
  const dismissScheduleDeleteError = useCallback(() => deleteSchedule.reset(), [deleteSchedule]);
  const dismissRecordDeleteError = useCallback(() => deleteRecord.reset(), [deleteRecord]);

  const vehicleOptions = vehicles?.data ?? [];
  const scheduleItems = schedules?.data ?? [];
  const recordItems = records?.data ?? [];
  const upcomingItems = upcoming?.data ?? [];

  const availableSchedulesForRecord = useMemo(
    () => scheduleItems.filter((schedule) => Number(schedule.vehicle_id) === Number(recordForm.vehicle_id)),
    [recordForm.vehicle_id, scheduleItems],
  );

  return (
    <div>
      <PageHeader title="Maintenance" description="Schedules, service records, and upcoming maintenance reminders." />
      {deleteSchedule.isError ? (
        <DismissibleAlert
          className="mb-6"
          tone="error"
          message={getApiErrorMessage(deleteSchedule.error)}
          onClose={dismissScheduleDeleteError}
        />
      ) : null}
      {deleteRecord.isError ? (
        <DismissibleAlert
          className="mb-6"
          tone="error"
          message={getApiErrorMessage(deleteRecord.error)}
          onClose={dismissRecordDeleteError}
        />
      ) : null}
      <div className="grid gap-6 xl:grid-cols-2">
        <MaintenanceScheduleFormPanel
          vehicles={vehicleOptions}
          vehicleSearch={scheduleVehicleSearch}
          form={scheduleForm}
          isSubmitting={createSchedule.isPending}
          errorMessage={createSchedule.isError ? getApiErrorMessage(createSchedule.error) : null}
          successMessage={scheduleSuccessMessage}
          onVehicleSearchChange={setScheduleVehicleSearch}
          onChange={setScheduleForm}
          onDismissError={dismissScheduleCreateError}
          onDismissSuccess={dismissScheduleSuccessMessage}
          onSubmit={() =>
            createSchedule.mutate(buildCreateMaintenanceSchedulePayload(scheduleForm), {
              onSuccess: () => {
                setScheduleForm(createEmptyMaintenanceScheduleFormValues());
                setScheduleVehicleSearch('');
                setScheduleSuccessMessage('Schedule created successfully.');
              },
            })
          }
        />
        <MaintenanceRecordFormPanel
          vehicles={vehicleOptions}
          schedules={availableSchedulesForRecord}
          vehicleSearch={recordVehicleSearch}
          form={recordForm}
          isSubmitting={createRecord.isPending}
          errorMessage={createRecord.isError ? getApiErrorMessage(createRecord.error) : null}
          successMessage={recordSuccessMessage}
          onVehicleSearchChange={setRecordVehicleSearch}
          onChange={setRecordForm}
          onDismissError={dismissRecordCreateError}
          onDismissSuccess={dismissRecordSuccessMessage}
          onSubmit={() =>
            createRecord.mutate(buildCreateMaintenanceRecordPayload(recordForm), {
              onSuccess: () => {
                setRecordForm(createEmptyMaintenanceRecordFormValues());
                setRecordVehicleSearch('');
                setRecordSuccessMessage('Service record created successfully.');
              },
            })
          }
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <UpcomingMaintenancePanel items={upcomingItems} isLoading={upcomingLoading} isError={upcomingError} />
        <MaintenanceSchedulesPanel items={scheduleItems} isLoading={schedulesLoading} isError={schedulesError} onDelete={(scheduleId) => deleteSchedule.mutate(scheduleId)} />
        <MaintenanceRecordsPanel items={recordItems} isLoading={recordsLoading} isError={recordsError} onDelete={(recordId) => deleteRecord.mutate(recordId)} />
      </div>
    </div>
  );
}
