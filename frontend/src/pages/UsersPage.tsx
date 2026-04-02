import { PageHeader } from '@/components/ui/PageHeader';
import { useCallback, useMemo, useState } from 'react';
import { useAuthStore } from '@/app/store/authStore';
import { useCompanies } from '@/features/companies/useCompanies';
import { useCreateUser, useUpdateUser, useUsers } from '@/features/users/useUsers';
import { CheckboxField } from '@/components/ui/CheckboxField';
import { DismissibleAlert } from '@/components/ui/DismissibleAlert';
import { Panel } from '@/components/ui/Panel';
import { SelectField } from '@/components/ui/SelectField';
import { getApiErrorMessage } from '@/lib/api/errors';
import type { AuthUser, UserRole } from '@/types/domain';

export function UsersPage() {
  const actor = useAuthStore((state) => state.user);
  const { data: companies } = useCompanies(actor?.role === 'super_admin');
  const { data } = useUsers();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const [editing, setEditing] = useState<AuthUser | null>(null);
  const roleOptions = useMemo<UserRole[]>(
    () => (actor?.role === 'super_admin' ? ['super_admin', 'owner', 'admin', 'dispatcher', 'viewer'] : ['admin', 'dispatcher', 'viewer']),
    [actor?.role],
  );
  const [form, setForm] = useState({
    company_id: actor?.company_id ?? null,
    name: '',
    email: '',
    password: '',
    timezone: actor?.timezone ?? 'Europe/Riga',
    is_active: true,
    role: (actor?.role === 'super_admin' ? 'owner' : 'viewer') as UserRole,
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const dismissSuccessMessage = useCallback(() => setSuccessMessage(null), []);
  const dismissCreateError = useCallback(() => createMutation.reset(), [createMutation]);
  const dismissUpdateError = useCallback(() => updateMutation.reset(), [updateMutation]);

  const resetForm = () => {
    setEditing(null);
    setForm({
      company_id: actor?.company_id ?? null,
      name: '',
      email: '',
      password: '',
      timezone: actor?.timezone ?? 'Europe/Riga',
      is_active: true,
      role: (actor?.role === 'super_admin' ? 'owner' : 'viewer') as UserRole,
    });
  };

  const submit = () => {
    if (editing) {
      updateMutation.mutate({
        userId: editing.id,
        payload: {
          name: form.name,
          email: form.email,
          password: form.password || undefined,
          timezone: form.timezone,
          is_active: form.is_active,
          role: form.role,
        },
      }, {
        onSuccess: () => {
          setSuccessMessage('User updated successfully.');
          resetForm();
        },
      });
      return;
    }

      createMutation.mutate({
        name: form.name,
        email: form.email,
        timezone: form.timezone,
        is_active: form.is_active,
        role: form.role,
        company_id: form.role === 'super_admin' ? null : form.company_id,
      }, {
        onSuccess: () => {
          setSuccessMessage('User created successfully. The new user will receive an invitation email.');
          resetForm();
        },
      });
  };

  return (
    <div>
      <PageHeader title="Users" description="Company-scoped user management with owner/admin role boundaries." />
      {successMessage ? <DismissibleAlert className="mb-6" message={successMessage} onClose={dismissSuccessMessage} /> : null}
      {createMutation.isError ? (
        <DismissibleAlert
          className="mb-6"
          tone="error"
          message={getApiErrorMessage(createMutation.error)}
          onClose={dismissCreateError}
        />
      ) : null}
      {updateMutation.isError ? (
        <DismissibleAlert
          className="mb-6"
          tone="error"
          message={getApiErrorMessage(updateMutation.error)}
          onClose={dismissUpdateError}
        />
      ) : null}
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Panel title={editing ? 'Edit user' : 'Create user'}>
          <div className="mt-4 space-y-3">
            {actor?.role === 'super_admin' ? (
              <SelectField value={form.company_id ?? ''} onValueChange={(value) => setForm((state) => ({ ...state, company_id: value ? Number(value) : null }))}>
                <option value="">Platform-level user</option>
                {(companies?.data ?? []).map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </SelectField>
            ) : null}
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Full name" value={form.name} onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Email" value={form.email} onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))} />
            {editing ? (
              <input type="password" autoComplete="new-password" className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="New password (optional)" value={form.password} onChange={(event) => setForm((state) => ({ ...state, password: event.target.value }))} />
            ) : (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                The new user will receive a password setup email after creation.
              </div>
            )}
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Timezone" value={form.timezone} onChange={(event) => setForm((state) => ({ ...state, timezone: event.target.value }))} />
            <SelectField value={form.role} onValueChange={(value) => setForm((state) => ({ ...state, role: value as UserRole }))}>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </SelectField>
            <CheckboxField checked={form.is_active} onChange={(event) => setForm((state) => ({ ...state, is_active: event.target.checked }))} label="Active" />
            <div className="flex gap-3">
              <button className="flex-1 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white" onClick={submit}>
                {editing ? 'Save user' : 'Create user'}
              </button>
              {editing ? (
                <button className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700" onClick={resetForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </div>
        </Panel>
        <Panel title="User directory">
          <div className="mt-4 space-y-3">
            {(data?.data ?? []).map((user) => (
              <button
                key={user.id}
                className="flex flex-wrap gap-3 w-full items-center justify-between rounded-2xl border border-slate-200 p-4 text-left"
                onClick={() => {
                  setEditing(user);
                  setForm({
                    company_id: user.company_id,
                    name: user.name,
                    email: user.email,
                    password: '',
                    timezone: user.timezone,
                    is_active: user.is_active,
                    role: user.role,
                  });
                }}
              >
                <div>
                  <div className="font-semibold">{user.name}</div>
                  <div className="text-sm text-slate-500">
                    {user.email} · {user.role}
                  </div>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-semibold ${user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </div>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
