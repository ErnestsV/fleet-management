import { CircleHelp } from 'lucide-react';
import { CheckboxField } from '@/components/ui/CheckboxField';
import { Panel } from '@/components/ui/Panel';
import { SelectField } from '@/components/ui/SelectField';
import type { UserFormValues } from '@/features/users/form';
import type { Company, UserRole } from '@/types/domain';

type UserFormPanelProps = {
  isSuperAdmin: boolean;
  editingId: number | null;
  form: UserFormValues;
  companies: Company[];
  roleOptions: UserRole[];
  onChange: (updater: (current: UserFormValues) => UserFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

const roleDescriptions: Record<UserRole, string> = {
  super_admin: 'Platform-level account for managing tenant companies. This role is not intended for normal company fleet operations.',
  owner: 'Company owner with full fleet access and company user management, including assigning admin, dispatcher, and viewer roles.',
  admin: 'Full fleet access plus company user management. Suitable for fleet managers or office administrators.',
  dispatcher: 'Can work with fleet operations data and updates, but cannot manage company users.',
  viewer: 'Read-only fleet access for users who only need visibility into company operations.',
};

export function UserFormPanel({
  isSuperAdmin,
  editingId,
  form,
  companies,
  roleOptions,
  onChange,
  onSubmit,
  onCancel,
}: UserFormPanelProps) {
  return (
    <Panel title={editingId ? 'Edit user' : 'Create user'}>
      <div className="mt-4 space-y-3">
        {isSuperAdmin ? (
          <SelectField value={form.company_id ?? ''} onValueChange={(value) => onChange((state) => ({ ...state, company_id: value ? Number(value) : null }))}>
            <option value="">Platform-level user</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </SelectField>
        ) : null}
        <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Full name" value={form.name} onChange={(event) => onChange((state) => ({ ...state, name: event.target.value }))} />
        <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Email" value={form.email} onChange={(event) => onChange((state) => ({ ...state, email: event.target.value }))} />
        {editingId ? (
          <input type="password" autoComplete="new-password" className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="New password (optional)" value={form.password} onChange={(event) => onChange((state) => ({ ...state, password: event.target.value }))} />
        ) : (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            The new user will receive a password setup email after creation.
          </div>
        )}
        <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Timezone" value={form.timezone} onChange={(event) => onChange((state) => ({ ...state, timezone: event.target.value }))} />
        <SelectField value={form.role} onValueChange={(value) => onChange((state) => ({ ...state, role: value as UserRole }))}>
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </SelectField>
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <div className="flex items-start gap-2">
            <CircleHelp size={16} className="mt-0.5 shrink-0 text-sky-700" />
            <div>
              <div className="font-semibold">Role purpose</div>
              <div className="mt-1 text-sky-800">{roleDescriptions[form.role]}</div>
            </div>
          </div>
        </div>
        <CheckboxField checked={form.is_active} onChange={(event) => onChange((state) => ({ ...state, is_active: event.target.checked }))} label="Active" />
        <div className="flex gap-3">
          <button className="flex-1 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white" onClick={onSubmit}>
            {editingId ? 'Save user' : 'Create user'}
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
