import { AssignmentHistoryList } from '@/components/ui/AssignmentHistoryList';
import { DetailInfoCard } from '@/components/ui/DetailInfoCard';
import { Panel } from '@/components/ui/Panel';
import { SelectField } from '@/components/ui/SelectField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateTime } from '@/lib/utils/format';
import type { Assignment, Driver, Vehicle } from '@/types/domain';

type VehicleDetailsPanelProps = {
  detail?: { data: Vehicle };
  detailLoading: boolean;
  detailError: boolean;
  drivers?: { data: Driver[] };
  assignments?: { data: Assignment[] };
  driverId: string;
  onDriverIdChange: (value: string) => void;
  onStartEdit: (vehicle: Vehicle) => void;
  onDeactivate: (vehicle: Vehicle) => void;
  onRotateToken: (vehicle: Vehicle) => void;
  rotatePending: boolean;
  onAssign: (vehicle: Vehicle, driverId: number) => void;
  onEndAssignment: (assignmentId: number) => void;
};

export function VehicleDetailsPanel({
  detail,
  detailLoading,
  detailError,
  drivers,
  assignments,
  driverId,
  onDriverIdChange,
  onStartEdit,
  onDeactivate,
  onRotateToken,
  rotatePending,
  onAssign,
  onEndAssignment,
}: VehicleDetailsPanelProps) {
  return (
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
            <DetailInfoCard label="Device ID">{detail.data.device_identifier ?? 'Not assigned'}</DetailInfoCard>
            <DetailInfoCard label="Assigned driver">{detail.data.assigned_driver?.name ?? 'None'}</DetailInfoCard>
            <DetailInfoCard label="Device token">
              <div className="space-y-2">
                <div>{detail.data.device_token?.is_active ? 'Active token configured' : 'No active token'}</div>
                {detail.data.device_token?.is_active ? <div className="text-xs text-slate-500">Token label: {detail.data.device_token.name}</div> : null}
                <div className="text-xs text-slate-500">
                  {detail.data.device_token?.last_used_at
                    ? `Last used ${formatDateTime(detail.data.device_token.last_used_at)}`
                    : 'The plain token cannot be re-shown. Rotate it to provision a device again.'}
                </div>
              </div>
            </DetailInfoCard>
          </div>
          <div className="flex gap-3">
            <button className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 font-semibold" onClick={() => onStartEdit(detail.data)}>
              Edit
            </button>
            <button className="flex-1 rounded-2xl bg-rose-600 px-4 py-3 font-semibold text-white" onClick={() => onDeactivate(detail.data)}>
              Deactivate
            </button>
          </div>
          <button
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={rotatePending}
            onClick={() => onRotateToken(detail.data)}
          >
            {rotatePending ? 'Rotating device token...' : 'Rotate device token'}
          </button>
          <div className="rounded-2xl border border-slate-200 p-4">
            <div className="mb-3 text-sm font-semibold text-slate-900">Driver assignment</div>
            <div className="flex gap-2">
              <SelectField className="flex-1" value={driverId} onValueChange={onDriverIdChange}>
                <option value="">Select driver</option>
                {(drivers?.data ?? []).map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </SelectField>
              <button
                className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white"
                onClick={() => driverId && onAssign(detail.data, Number(driverId))}
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
                  onEnd: !assignment.assigned_until ? () => onEndAssignment(assignment.id) : undefined,
                }))}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate-500">Select a vehicle to view details.</div>
      )}
    </Panel>
  );
}
