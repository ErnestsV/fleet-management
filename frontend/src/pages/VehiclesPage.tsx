import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DismissibleAlert } from '@/components/ui/DismissibleAlert';
import { useAssignments, useCreateAssignment, useEndAssignment } from '@/features/assignments/useAssignments';
import { useDrivers } from '@/features/drivers/useDrivers';
import { VehicleDetailsPanel } from '@/features/vehicles/components/VehicleDetailsPanel';
import { VehicleFormPanel } from '@/features/vehicles/components/VehicleFormPanel';
import { VehiclesTablePanel } from '@/features/vehicles/components/VehiclesTablePanel';
import { createEmptyVehicleFormValues } from '@/features/vehicles/form';
import { useCreateVehicle, useDeleteVehicle, useRotateVehicleDeviceToken, useUpdateVehicle, useVehicle, useVehicles } from '@/features/vehicles/useVehicles';
import { getApiErrorMessage } from '@/lib/api/errors';

export function VehiclesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(createEmptyVehicleFormValues);
  const { data, isLoading, isError } = useVehicles({
    search: search || undefined,
    status: status || undefined,
    page,
    per_page: 10,
  });
  const { data: detail, isLoading: detailLoading, isError: detailError } = useVehicle(selectedId);
  const { data: drivers } = useDrivers();
  const { data: assignments } = useAssignments({ vehicle_id: selectedId ?? undefined });
  const createAssignment = useCreateAssignment();
  const endAssignment = useEndAssignment();
  const [driverId, setDriverId] = useState('');
  const createMutation = useCreateVehicle();
  const updateMutation = useUpdateVehicle();
  const deleteMutation = useDeleteVehicle();
  const rotateDeviceTokenMutation = useRotateVehicleDeviceToken();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [provisioningToken, setProvisioningToken] = useState<string | null>(null);
  const dismissSuccessMessage = useCallback(() => setSuccessMessage(null), []);
  const dismissProvisioningToken = useCallback(() => setProvisioningToken(null), []);
  const dismissCreateError = useCallback(() => createMutation.reset(), [createMutation]);
  const dismissUpdateError = useCallback(() => updateMutation.reset(), [updateMutation]);
  const dismissDeleteError = useCallback(() => deleteMutation.reset(), [deleteMutation]);
  const dismissRotateTokenError = useCallback(() => rotateDeviceTokenMutation.reset(), [rotateDeviceTokenMutation]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const resetForm = () => {
    setEditingId(null);
    setForm(createEmptyVehicleFormValues());
  };

  const submit = () => {
    const payload = {
      ...form,
      year: form.year ? Number(form.year) : null,
    };

    if (editingId) {
      updateMutation.mutate({ vehicleId: editingId, payload }, {
        onSuccess: () => {
          setSuccessMessage('Vehicle updated successfully.');
          resetForm();
        },
      });
    } else {
      createMutation.mutate(payload, {
        onSuccess: ({ provisioning_token }) => {
          setSuccessMessage('Vehicle created successfully.');
          setProvisioningToken(provisioning_token);
          resetForm();
        },
      });
    }
  };

  return (
    <div>
      <PageHeader title="Vehicles" description="Fleet catalog, live status, assignment, and current state access." />
      {successMessage ? <DismissibleAlert className="mb-6" message={successMessage} onClose={dismissSuccessMessage} /> : null}
      {provisioningToken ? (
        <DismissibleAlert
          className="mb-6"
          message={`Device token (shown once): ${provisioningToken}`}
          onClose={dismissProvisioningToken}
          autoDismissMs={null}
        />
      ) : null}
      {createMutation.isError ? <DismissibleAlert className="mb-6" tone="error" message={getApiErrorMessage(createMutation.error)} onClose={dismissCreateError} /> : null}
      {updateMutation.isError ? <DismissibleAlert className="mb-6" tone="error" message={getApiErrorMessage(updateMutation.error)} onClose={dismissUpdateError} /> : null}
      {deleteMutation.isError ? <DismissibleAlert className="mb-6" tone="error" message={getApiErrorMessage(deleteMutation.error)} onClose={dismissDeleteError} /> : null}
      {rotateDeviceTokenMutation.isError ? <DismissibleAlert className="mb-6" tone="error" message={getApiErrorMessage(rotateDeviceTokenMutation.error)} onClose={dismissRotateTokenError} /> : null}
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)_340px]">
        <VehicleFormPanel editingId={editingId} form={form} onChange={setForm} onSubmit={submit} onCancel={resetForm} />
        <VehiclesTablePanel
          search={search}
          status={status}
          onSearchChange={setSearch}
          onStatusChange={setStatus}
          data={data}
          isLoading={isLoading}
          isError={isError}
          onSelect={setSelectedId}
          currentPage={data?.meta?.current_page ?? page}
          onPageChange={setPage}
        />
        <VehicleDetailsPanel
          detail={detail}
          detailLoading={detailLoading}
          detailError={detailError}
          drivers={drivers}
          assignments={assignments}
          driverId={driverId}
          onDriverIdChange={setDriverId}
          onStartEdit={(vehicle) => {
            setEditingId(vehicle.id);
            setForm({
              name: vehicle.name,
              plate_number: vehicle.plate_number,
              vin: vehicle.vin ?? '',
              make: vehicle.make ?? '',
              model: vehicle.model ?? '',
              year: vehicle.year ? String(vehicle.year) : '',
              device_identifier: vehicle.device_identifier ?? '',
              is_active: vehicle.is_active,
            });
          }}
          onDeactivate={(vehicle) => {
            if (!window.confirm(`Deactivate vehicle ${vehicle.plate_number}? This will archive it and remove it from the active fleet list.`)) {
              return;
            }

            deleteMutation.mutate(vehicle.id, {
              onSuccess: () => {
                setSelectedId((current) => (current === vehicle.id ? null : current));
                setEditingId((current) => {
                  if (current === vehicle.id) {
                    setForm(createEmptyVehicleFormValues());

                    return null;
                  }

                  return current;
                });

                setSuccessMessage('Vehicle deactivated successfully.');
              },
            });
          }}
          onRotateToken={(vehicle) => {
            if (rotateDeviceTokenMutation.isPending) {
              return;
            }

            rotateDeviceTokenMutation.mutate(vehicle.id, {
              onSuccess: ({ provisioning_token }) => {
                setProvisioningToken(provisioning_token);
                setSuccessMessage('Device token rotated successfully.');
              },
            });
          }}
          rotatePending={rotateDeviceTokenMutation.isPending}
          onAssign={(vehicle, nextDriverId) => createAssignment.mutate({
            vehicle_id: vehicle.id,
            driver_id: nextDriverId,
            assigned_from: new Date().toISOString(),
          })}
          onEndAssignment={(assignmentId) => endAssignment.mutate({ assignmentId, assigned_until: new Date().toISOString() })}
        />
      </div>
    </div>
  );
}
