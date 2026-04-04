import { AssignmentHistoryList } from '@/components/ui/AssignmentHistoryList';
import { DetailInfoCard } from '@/components/ui/DetailInfoCard';
import { Panel } from '@/components/ui/Panel';
import { SelectField } from '@/components/ui/SelectField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Assignment, Driver, Vehicle } from '@/types/domain';

type DriverDetailsPanelProps = {
  detail?: { data: Driver };
  detailLoading: boolean;
  detailError: boolean;
  vehicles?: { data: Vehicle[] };
  assignments?: { data: Assignment[] };
  vehicleId: string;
  onVehicleIdChange: (value: string) => void;
  onStartEdit: (driver: Driver) => void;
  onDeactivate: (driver: Driver) => void;
  onAssign: (driver: Driver, vehicleId: number) => void;
  onEndAssignment: (assignmentId: number) => void;
};

export function DriverDetailsPanel({
  detail,
  detailLoading,
  detailError,
  vehicles,
  assignments,
  vehicleId,
  onVehicleIdChange,
  onStartEdit,
  onDeactivate,
  onAssign,
  onEndAssignment,
}: DriverDetailsPanelProps) {
  return (
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
            <button className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 font-semibold" onClick={() => onStartEdit(detail.data)}>
              Edit
            </button>
            <button className="flex-1 rounded-2xl bg-rose-600 px-4 py-3 font-semibold text-white" onClick={() => onDeactivate(detail.data)}>
              Deactivate
            </button>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="mb-3 text-sm font-semibold text-slate-900">Vehicle assignment</div>
            <div className="flex gap-2">
              <SelectField className="flex-1" value={vehicleId} onValueChange={onVehicleIdChange}>
                <option value="">Select vehicle</option>
                {(vehicles?.data ?? []).map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plate_number}
                  </option>
                ))}
              </SelectField>
              <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white" onClick={() => vehicleId && onAssign(detail.data, Number(vehicleId))}>
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
                  onEnd: !assignment.assigned_until ? () => onEndAssignment(assignment.id) : undefined,
                }))}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate-500">Select a driver to view details.</div>
      )}
    </Panel>
  );
}
