import { CheckboxField } from '@/components/ui/CheckboxField';
import { Panel } from '@/components/ui/Panel';
import type { VehicleFormValues } from '@/features/vehicles/form';

type VehicleFormPanelProps = {
  editingId: number | null;
  form: VehicleFormValues;
  onChange: (updater: (current: VehicleFormValues) => VehicleFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function VehicleFormPanel({ editingId, form, onChange, onSubmit, onCancel }: VehicleFormPanelProps) {
  return (
    <Panel title={editingId ? 'Edit vehicle' : 'Create vehicle'} description="Manage the company fleet inventory and telematics metadata.">
      <div className="space-y-3">
        <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Vehicle name" value={form.name} onChange={(event) => onChange((state) => ({ ...state, name: event.target.value }))} />
        <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Plate number" value={form.plate_number} onChange={(event) => onChange((state) => ({ ...state, plate_number: event.target.value }))} />
        <div className="grid gap-3 md:grid-cols-2">
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Make" value={form.make} onChange={(event) => onChange((state) => ({ ...state, make: event.target.value }))} />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Model" value={form.model} onChange={(event) => onChange((state) => ({ ...state, model: event.target.value }))} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Year" value={form.year} onChange={(event) => onChange((state) => ({ ...state, year: event.target.value }))} />
          <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Device ID" value={form.device_identifier} onChange={(event) => onChange((state) => ({ ...state, device_identifier: event.target.value }))} />
        </div>
        <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="VIN" value={form.vin} onChange={(event) => onChange((state) => ({ ...state, vin: event.target.value }))} />
        <CheckboxField checked={form.is_active} onChange={(event) => onChange((state) => ({ ...state, is_active: event.target.checked }))} label="Active vehicle" />
        <div className="flex gap-3">
          <button className="flex-1 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white" onClick={onSubmit}>
            {editingId ? 'Save vehicle' : 'Create vehicle'}
          </button>
          {editingId ? (
            <button className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700" onClick={onCancel}>
              Cancel
            </button>
          ) : null}
        </div>
      </div>
    </Panel>
  );
}
