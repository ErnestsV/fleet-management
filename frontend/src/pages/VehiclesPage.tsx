import { useState } from 'react';
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
import { useDrivers } from '@/features/drivers/useDrivers';
import { useCreateVehicle, useDeleteVehicle, useUpdateVehicle, useVehicle, useVehicles } from '@/features/vehicles/useVehicles';
import { formatDateTime } from '@/lib/utils/format';

export function VehiclesPage() {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: '',
    plate_number: '',
    vin: '',
    make: '',
    model: '',
    year: '',
    device_identifier: '',
    is_active: true,
  });
  const { data, isLoading, isError } = useVehicles({ search });
  const { data: detail, isLoading: detailLoading, isError: detailError } = useVehicle(selectedId);
  const { data: drivers } = useDrivers();
  const { data: assignments } = useAssignments({ vehicle_id: selectedId ?? undefined });
  const createAssignment = useCreateAssignment();
  const endAssignment = useEndAssignment();
  const [driverId, setDriverId] = useState('');
  const createMutation = useCreateVehicle();
  const updateMutation = useUpdateVehicle();
  const deleteMutation = useDeleteVehicle();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setForm({
      name: '',
      plate_number: '',
      vin: '',
      make: '',
      model: '',
      year: '',
      device_identifier: '',
      is_active: true,
    });
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
        onSuccess: () => {
          setSuccessMessage('Vehicle created successfully.');
          resetForm();
        },
      });
    }
  };

  return (
    <div>
      <PageHeader title="Vehicles" description="Fleet catalog, live status, assignment, and current state access." />
      {successMessage ? <DismissibleAlert className="mb-6" message={successMessage} onClose={() => setSuccessMessage(null)} /> : null}
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)_340px]">
        <Panel title={editingId ? 'Edit vehicle' : 'Create vehicle'} description="Manage the company fleet inventory and telematics metadata.">
          <div className="space-y-3">
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Vehicle name" value={form.name} onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Plate number" value={form.plate_number} onChange={(event) => setForm((state) => ({ ...state, plate_number: event.target.value }))} />
            <div className="grid gap-3 md:grid-cols-2">
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Make" value={form.make} onChange={(event) => setForm((state) => ({ ...state, make: event.target.value }))} />
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Model" value={form.model} onChange={(event) => setForm((state) => ({ ...state, model: event.target.value }))} />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Year" value={form.year} onChange={(event) => setForm((state) => ({ ...state, year: event.target.value }))} />
              <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Device ID" value={form.device_identifier} onChange={(event) => setForm((state) => ({ ...state, device_identifier: event.target.value }))} />
            </div>
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="VIN" value={form.vin} onChange={(event) => setForm((state) => ({ ...state, vin: event.target.value }))} />
            <CheckboxField checked={form.is_active} onChange={(event) => setForm((state) => ({ ...state, is_active: event.target.checked }))} label="Active vehicle" />
            <div className="flex gap-3">
              <button className="flex-1 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white" onClick={submit}>
                {editingId ? 'Save vehicle' : 'Create vehicle'}
              </button>
              {editingId ? (
                <button className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700" onClick={resetForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
        </Panel>
        <Panel title="Fleet table" description="Search, inspect, edit, and deactivate vehicles." actions={<input className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" placeholder="Search vehicles" value={search} onChange={(event) => setSearch(event.target.value)} />}>
          {isLoading ? <div className="text-sm text-slate-500">Loading vehicles...</div> : null}
          {isError ? <div className="text-sm text-rose-600">Failed to load vehicles.</div> : null}
          {!isLoading && !isError ? (
            (data?.data?.length ?? 0) > 0 ? (
              <DataTable>
                <DataTableHead>
                    <tr>
                      <th className="px-4 py-3">Vehicle</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Driver</th>
                      <th className="px-4 py-3">Last event</th>
                    </tr>
                </DataTableHead>
                <DataTableBody>
                    {(data?.data ?? []).map((vehicle) => (
                      <tr key={vehicle.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedId(vehicle.id)}>
                        <td className="px-4 py-3">
                          <div className="font-semibold">{vehicle.plate_number}</div>
                          <div className="text-slate-500">{vehicle.name}</div>
                        </td>
                        <td className="px-4 py-3"><StatusBadge value={vehicle.state?.status ?? (vehicle.is_active ? undefined : 'offline')} /></td>
                        <td className="px-4 py-3 text-slate-600">{vehicle.assigned_driver?.name ?? 'Unassigned'}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDateTime(vehicle.state?.last_event_at)}</td>
                      </tr>
                    ))}
                </DataTableBody>
              </DataTable>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-sm text-slate-500">No vehicles match the current search.</div>
            )
          ) : null}
        </Panel>
        <Panel title="Vehicle details" description="Selected vehicle summary and quick actions.">
          {detailLoading ? <div className="text-sm text-slate-500">Loading vehicle details...</div> : null}
          {detailError ? <div className="text-sm text-rose-600">Failed to load vehicle details.</div> : null}
          {!detailLoading && !detailError && detail?.data ? (
            <div className="space-y-4">
              <div>
                <div className="text-xl font-semibold">{detail.data.plate_number}</div>
                <div className="text-sm text-slate-500">{detail.data.name}</div>
              </div>
              <div className="grid gap-3">
                <DetailInfoCard label="Status"><StatusBadge value={detail.data.state?.status ?? (detail.data.is_active ? undefined : 'offline')} /></DetailInfoCard>
                <DetailInfoCard label="Telemetry">Speed: {detail.data.state?.speed_kmh ?? 0} km/h</DetailInfoCard>
                <DetailInfoCard label="Assigned driver">{detail.data.assigned_driver?.name ?? 'None'}</DetailInfoCard>
              </div>
              <div className="flex gap-3">
                <button
                  className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 font-semibold"
                  onClick={() => {
                    setEditingId(detail.data.id);
                    setForm({
                      name: detail.data.name,
                      plate_number: detail.data.plate_number,
                      vin: detail.data.vin ?? '',
                      make: detail.data.make ?? '',
                      model: detail.data.model ?? '',
                      year: detail.data.year ? String(detail.data.year) : '',
                      device_identifier: detail.data.device_identifier ?? '',
                      is_active: detail.data.is_active,
                    });
                  }}
                >
                  Edit
                </button>
                <button className="flex-1 rounded-2xl bg-rose-600 px-4 py-3 font-semibold text-white" onClick={() => deleteMutation.mutate(detail.data.id)}>
                  Deactivate
                </button>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-3 text-sm font-semibold text-slate-900">Driver assignment</div>
                <div className="flex gap-2">
                  <SelectField className="flex-1" value={driverId} onValueChange={setDriverId}>
                    <option value="">Select driver</option>
                    {(drivers?.data ?? []).map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name}
                      </option>
                    ))}
                  </SelectField>
                  <button
                    className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                    onClick={() =>
                      driverId &&
                      createAssignment.mutate({
                        vehicle_id: detail.data.id,
                        driver_id: Number(driverId),
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
                      title: assignment.driver?.name ?? String(assignment.driver_id),
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
            <div className="text-sm text-slate-500">Select a vehicle to view details.</div>
          )}
        </Panel>
      </div>
    </div>
  );
}
