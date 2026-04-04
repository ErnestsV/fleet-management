import { useCallback, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DismissibleAlert } from '@/components/ui/DismissibleAlert';
import { useAssignments, useCreateAssignment, useEndAssignment } from '@/features/assignments/useAssignments';
import { DriverDetailsPanel } from '@/features/drivers/components/DriverDetailsPanel';
import { DriverFormPanel } from '@/features/drivers/components/DriverFormPanel';
import { DriversTablePanel } from '@/features/drivers/components/DriversTablePanel';
import { createEmptyDriverFormValues } from '@/features/drivers/form';
import { useCreateDriver, useDeleteDriver, useDriver, useDrivers, useUpdateDriver } from '@/features/drivers/useDrivers';
import { useVehicles } from '@/features/vehicles/useVehicles';
import { getApiErrorMessage } from '@/lib/api/errors';

export function DriversPage() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(createEmptyDriverFormValues);
  const { data, isLoading, isError } = useDrivers({ search });
  const { data: detail, isLoading: detailLoading, isError: detailError } = useDriver(selectedId);
  const { data: vehicles } = useVehicles();
  const { data: assignments } = useAssignments({ driver_id: selectedId ?? undefined });
  const createAssignment = useCreateAssignment();
  const endAssignment = useEndAssignment();
  const [vehicleId, setVehicleId] = useState('');
  const createMutation = useCreateDriver();
  const updateMutation = useUpdateDriver();
  const deleteMutation = useDeleteDriver();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const dismissSuccessMessage = useCallback(() => setSuccessMessage(null), []);
  const dismissCreateError = useCallback(() => createMutation.reset(), [createMutation]);
  const dismissUpdateError = useCallback(() => updateMutation.reset(), [updateMutation]);
  const dismissDeleteError = useCallback(() => deleteMutation.reset(), [deleteMutation]);

  const resetForm = () => {
    setEditingId(null);
    setForm(createEmptyDriverFormValues());
  };

  const submit = () => {
    const payload = { ...form, license_expires_at: form.license_expires_at || null };
    if (editingId) {
      updateMutation.mutate({ driverId: editingId, payload }, {
        onSuccess: () => {
          setSuccessMessage('Driver updated successfully.');
          resetForm();
        },
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setSuccessMessage('Driver created successfully.');
          resetForm();
        },
      });
    }
  };

  return (
    <div>
      <PageHeader title="Drivers" description="Driver records and vehicle assignment management." />
      {successMessage ? <DismissibleAlert className="mb-6" message={successMessage} onClose={dismissSuccessMessage} /> : null}
      {createMutation.isError ? <DismissibleAlert className="mb-6" tone="error" message={getApiErrorMessage(createMutation.error)} onClose={dismissCreateError} /> : null}
      {updateMutation.isError ? <DismissibleAlert className="mb-6" tone="error" message={getApiErrorMessage(updateMutation.error)} onClose={dismissUpdateError} /> : null}
      {deleteMutation.isError ? <DismissibleAlert className="mb-6" tone="error" message={getApiErrorMessage(deleteMutation.error)} onClose={dismissDeleteError} /> : null}
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)_340px]">
        <DriverFormPanel editingId={editingId} form={form} onChange={setForm} onSubmit={submit} onCancel={resetForm} />
        <DriversTablePanel search={search} onSearchChange={setSearch} data={data} isLoading={isLoading} isError={isError} onSelect={setSelectedId} />
        <DriverDetailsPanel
          detail={detail}
          detailLoading={detailLoading}
          detailError={detailError}
          vehicles={vehicles}
          assignments={assignments}
          vehicleId={vehicleId}
          onVehicleIdChange={setVehicleId}
          onStartEdit={(driver) => {
            setEditingId(driver.id);
            setForm({
              name: driver.name,
              email: driver.email ?? '',
              phone: driver.phone ?? '',
              license_number: driver.license_number ?? '',
              license_expires_at: driver.license_expires_at?.slice(0, 10) ?? '',
              is_active: driver.is_active,
            });
          }}
          onDeactivate={(driver) => {
            if (!window.confirm(`Deactivate driver ${driver.name}? This will archive the record and remove it from the active driver list.`)) {
              return;
            }

            deleteMutation.mutate(driver.id, {
              onSuccess: () => {
                setSelectedId((current) => (current === driver.id ? null : current));
                setEditingId((current) => {
                  if (current === driver.id) {
                    setForm(createEmptyDriverFormValues());

                    return null;
                  }

                  return current;
                });

                setSuccessMessage('Driver deactivated successfully.');
              },
            });
          }}
          onAssign={(driver, nextVehicleId) => createAssignment.mutate({
            vehicle_id: nextVehicleId,
            driver_id: driver.id,
            assigned_from: new Date().toISOString(),
          })}
          onEndAssignment={(assignmentId) => endAssignment.mutate({ assignmentId, assigned_until: new Date().toISOString() })}
        />
      </div>
    </div>
  );
}
