import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAssignments, useCreateAssignment, useEndAssignment } from '@/features/assignments/useAssignments';
import { useCreateDriver, useDeleteDriver, useDriver, useDrivers, useUpdateDriver } from '@/features/drivers/useDrivers';
import { useVehicles } from '@/features/vehicles/useVehicles';

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

  const submit = () => {
    const payload = { ...form, license_expires_at: form.license_expires_at || null };
    if (editingId) {
      updateMutation.mutate({ driverId: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div>
      <PageHeader title="Drivers" description="Driver records and vehicle assignment management." />
      <div className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)_340px]">
        <Panel title={editingId ? 'Edit driver' : 'Create driver'} description="Driver records with assignment visibility.">
          <div className="space-y-3">
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Full name" value={form.name} onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Email" value={form.email} onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Phone" value={form.phone} onChange={(event) => setForm((state) => ({ ...state, phone: event.target.value }))} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="License number" value={form.license_number} onChange={(event) => setForm((state) => ({ ...state, license_number: event.target.value }))} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="License expires at" type="date" value={form.license_expires_at} onChange={(event) => setForm((state) => ({ ...state, license_expires_at: event.target.value }))} />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((state) => ({ ...state, is_active: event.target.checked }))} />
              Active driver
            </label>
            <button className="w-full rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white" onClick={submit}>
              {editingId ? 'Save driver' : 'Create driver'}
            </button>
          </div>
        </Panel>
        <Panel title="Driver table" description="Review and manage driver records." actions={<input className="rounded-2xl border border-slate-200 px-4 py-2 text-sm" placeholder="Search drivers" value={search} onChange={(event) => setSearch(event.target.value)} />}>
          {isLoading ? <div className="text-sm text-slate-500">Loading drivers...</div> : null}
          {isError ? <div className="text-sm text-rose-600">Failed to load drivers.</div> : null}
          {!isLoading && !isError ? (
            (data?.data?.length ?? 0) > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Driver</th>
                      <th className="px-4 py-3">Assigned vehicle</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
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
                  </tbody>
                </table>
              </div>
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
                <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs uppercase tracking-[0.16em] text-slate-500">Assigned vehicle</div><div className="mt-2 text-sm text-slate-700">{detail.data.assigned_vehicle?.plate_number ?? 'No current assignment'}</div></div>
                <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs uppercase tracking-[0.16em] text-slate-500">License</div><div className="mt-2 text-sm text-slate-700">{detail.data.license_number ?? 'Not set'}</div></div>
                <div className="rounded-2xl bg-slate-50 p-4"><div className="text-xs uppercase tracking-[0.16em] text-slate-500">Status</div><div className="mt-2"><StatusBadge value={detail.data.is_active ? 'active' : 'offline'} /></div></div>
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
                <button className="flex-1 rounded-2xl bg-rose-600 px-4 py-3 font-semibold text-white" onClick={() => deleteMutation.mutate(detail.data.id)}>
                  Deactivate
                </button>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-3 text-sm font-semibold text-slate-900">Vehicle assignment</div>
                <div className="flex gap-2">
                  <select className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm" value={vehicleId} onChange={(event) => setVehicleId(event.target.value)}>
                    <option value="">Select vehicle</option>
                    {(vehicles?.data ?? []).map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.plate_number}
                      </option>
                    ))}
                  </select>
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
                <div className="mt-3 space-y-2">
                  {(assignments?.data ?? []).slice(0, 3).map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-sm">
                      <div>
                        <div className="font-semibold">{assignment.vehicle?.plate_number ?? assignment.vehicle_id}</div>
                        <div className="text-slate-500">
                          {new Date(assignment.assigned_from).toLocaleString()}
                          {assignment.assigned_until ? ` to ${new Date(assignment.assigned_until).toLocaleString()}` : ' · Active'}
                        </div>
                      </div>
                      {!assignment.assigned_until ? (
                        <button className="rounded-2xl border border-slate-200 px-3 py-2 font-semibold" onClick={() => endAssignment.mutate({ assignmentId: assignment.id, assigned_until: new Date().toISOString() })}>
                          End
                        </button>
                      ) : null}
                    </div>
                  ))}
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
