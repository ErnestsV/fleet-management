import { CheckboxField } from '@/components/ui/CheckboxField';
import { Panel } from '@/components/ui/Panel';
import type { DriverFormValues } from '@/features/drivers/form';

type DriverFormPanelProps = {
  editingId: number | null;
  form: DriverFormValues;
  onChange: (updater: (current: DriverFormValues) => DriverFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function DriverFormPanel({ editingId, form, onChange, onSubmit, onCancel }: DriverFormPanelProps) {
  return (
    <Panel title={editingId ? 'Edit driver' : 'Create driver'} description="Driver records with assignment visibility.">
      <div className="space-y-3">
        <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Full name" value={form.name} onChange={(event) => onChange((state) => ({ ...state, name: event.target.value }))} />
        <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Email" value={form.email} onChange={(event) => onChange((state) => ({ ...state, email: event.target.value }))} />
        <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Phone" value={form.phone} onChange={(event) => onChange((state) => ({ ...state, phone: event.target.value }))} />
        <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="License number" value={form.license_number} onChange={(event) => onChange((state) => ({ ...state, license_number: event.target.value }))} />
        <div>
          <label htmlFor="driver-license-expires-at" className="mb-2 block text-sm font-medium text-slate-700">License expiry date</label>
          <input id="driver-license-expires-at" className="w-full rounded-2xl border border-slate-200 px-4 py-3" type="date" value={form.license_expires_at} onChange={(event) => onChange((state) => ({ ...state, license_expires_at: event.target.value }))} />
        </div>
        <CheckboxField checked={form.is_active} onChange={(event) => onChange((state) => ({ ...state, is_active: event.target.checked }))} label="Active driver" />
        <div className="flex gap-3">
          <button className="flex-1 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white" onClick={onSubmit}>
            {editingId ? 'Save driver' : 'Create driver'}
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
