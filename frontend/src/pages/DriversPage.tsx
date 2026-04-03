import { useCallback, useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { CheckboxField } from '@/components/ui/CheckboxField';
import { DataTable, DataTableBody, DataTableHead } from '@/components/ui/DataTable';
import { DetailInfoCard } from '@/components/ui/DetailInfoCard';
import { DismissibleAlert } from '@/components/ui/DismissibleAlert';
import { Panel } from '@/components/ui/Panel';
import { SelectField } from '@/components/ui/SelectField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AssignmentHistoryList } from '@/components/ui/AssignmentHistoryList';
import { useAssignments, useCreateAssignment, useEndAssignment } from '@/features/assignments/useAssignments';
import { useCreateDriver, useDeleteDriver, useDriver, useDrivers, useUpdateDriver } from '@/features/drivers/useDrivers';
import { useVehicles } from '@/features/vehicles/useVehicles';
import { getApiErrorMessage } from '@/lib/api/errors';

export function DriversPage() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    license_number: '',
    license_expires_at: '',
    is_active: true,
  });
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
    setForm({
      name: '',
      email: '',
      phone: '',
      license_number: '',
      license_expires_at: '',
      is_active: true,
    });
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
        <Panel title={editingId ? 'Edit driver' : 'Create driver'} description="Driver records with assignment visibility.">
          <div className="space-y-3">
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Full name" value={form.name} onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Email" value={form.email} onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Phone" value={form.phone} onChange={(event) => setForm((state) => ({ ...state, phone: event.target.value }))} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="License number" value={form.license_number} onChange={(event) => setForm((state) => ({ ...state, license_number: event.target.value }))} />
            <div>
              <label htmlFor="driver-license-expires-at" className="mb-2 block text-sm font-medium text-slate-700">License expiry date</label>
              <input id="driver-license-expires-at" className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="date" value={form.license_expires_at} onChange={(event) => setForm((state) => ({ ...state, license_expires_at: event.target.value }))} />
            </div>
            <CheckboxField checked={form.is_active} onChange={(event) => setForm((state) => ({ ...state, is_active: event.target.checked }))} label="Active driver" />
            <div className="flex gap-3">
              <button className="flex-1 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white" onClick={submit}>
                {editingId ? 'Save driver' : 'Create driver'}
              </button>
              {editingId ? (
                <button className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700" onClick={resetForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
        </Panel>
        <Panel title="Driver table" description="Review and manage driver records." actions={<input className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" placeholder="Search drivers" value={search} onChange={(event) => setSearch(event.target.value)} />}>
          {isLoading ? <div className="text-sm text-slate-500">Loading drivers...</div> : null}
          {isError ? <div className="text-sm text-rose-600">Failed to load drivers.</div> : null}
          {!isLoading && !isError ? (
            (data?.data?.length ?? 0) > 0 ? (
              <DataTable>
                <DataTableHead>
                    <tr>
                      <th className="px-4 py-3">Driver</th>
                      <th className="px-4 py-3">Assigned vehicle</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                </DataTableHead>
                <DataTableBody>
                    {(data?.data ?? []).map((driver) => (
                      <tr key={driver.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedId(driver.id)}>
                        <td className="px-4 py-3">
                          <div className="font-semibold">{driver.name}</div>
                          <div className="text-slate-500">{driver.email ?? driver.phone ?? 'No contact info'}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{driver.assigned_vehicle?.plate_number ?? 'Unassigned'}</td>
                        <td className="px-4 py-3"><StatusBadge value={driver.is_active ? 'active' : 'offline'} /></td>
                      </tr>
                    ))}
                </DataTableBody>
              </DataTable>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-sm text-slate-500">No drivers match the current search.</div>
            )
          ) : null}
        </Panel>
        <Panel title="Driver details" description="Selected driver profile and assignment summary.">
          {detailLoading ? <div className="text-sm text-slate-500">Loading driver details...</div> : null}
          {detailError ? <div className="text-sm text-rose-600">Failed to load driver details.</div> : null}
          {!detailLoading && !detailError && detail?.data ? (
            <div className="space-y-4">
              <div>
                <div className="text-xl font-semibold">{detail.data.name}</div>
                <div className="text-sm text-slate-500">{detail.data.email ?? 'No email set'}</div>
              </div>
              <div className="grid gap-3">
                <DetailInfoCard label="Assigned vehicle">{detail.data.assigned_vehicle?.plate_number ?? 'No current assignment'}</DetailInfoCard>
                <DetailInfoCard label="License">{detail.data.license_number ?? 'Not set'}</DetailInfoCard>
                <DetailInfoCard label="Status"><StatusBadge value={detail.data.is_active ? 'active' : 'offline'} /></DetailInfoCard>
              </div>
              <div className="flex gap-3">
                <button
                  className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 font-semibold"
                  onClick={() => {
                    setEditingId(detail.data.id);
                    setForm({
                      name: detail.data.name,
                      email: detail.data.email ?? '',
                      phone: detail.data.phone ?? '',
                      license_number: detail.data.license_number ?? '',
                      license_expires_at: detail.data.license_expires_at?.slice(0, 10) ?? '',
                      is_active: detail.data.is_active,
                    });
                  }}
                >
                  Edit
                </button>
                <button
                  className="flex-1 rounded-2xl bg-rose-600 px-4 py-3 font-semibold text-white"
                  onClick={() => {
                    if (!window.confirm(`Deactivate driver ${detail.data.name}? This will archive the record and remove it from the active driver list.`)) {
                      return;
                    }

                    deleteMutation.mutate(detail.data.id, {
                      onSuccess: () => {
                        setSelectedId((current) => (current === detail.data.id ? null : current));
                        setEditingId((current) => {
                          if (current === detail.data.id) {
                            setForm({
                              name: '',
                              email: '',
                              phone: '',
                              license_number: '',
                              license_expires_at: '',
                              is_active: true,
                            });

                            return null;
                          }

                          return current;
                        });

                        setSuccessMessage('Driver deactivated successfully.');
                      },
                    });
                  }}
                >
                  Deactivate
                </button>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-3 text-sm font-semibold text-slate-900">Vehicle assignment</div>
                <div className="flex gap-2">
                  <SelectField className="flex-1" value={vehicleId} onValueChange={setVehicleId}>
                    <option value="">Select vehicle</option>
                    {(vehicles?.data ?? []).map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.plate_number}
                      </option>
                    ))}
                  </SelectField>
                  <button
                    className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                    onClick={() =>
                      vehicleId &&
                      createAssignment.mutate({
                        vehicle_id: Number(vehicleId),
                        driver_id: detail.data.id,
                        assigned_from: new Date().toISOString(),
                      })
                    }
                  >
                    Assign
                  </button>
                </div>
                <div className="mt-3">
                  <AssignmentHistoryList
                    items={(assignments?.data ?? []).slice(0, 3).map((assignment) => ({
                      id: assignment.id,
                      title: assignment.vehicle?.plate_number ?? String(assignment.vehicle_id),
                      subtitle: assignment.vehicle?.name ?? null,
                      assignedFrom: assignment.assigned_from,
                      assignedUntil: assignment.assigned_until,
                      onEnd: !assignment.assigned_until
                        ? () => endAssignment.mutate({ assignmentId: assignment.id, assigned_until: new Date().toISOString() })
                        : undefined,
                    }))}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">Select a driver to view details.</div>
          )}
        </Panel>
      </div>
    </div>
  );
}
