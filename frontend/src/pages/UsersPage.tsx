import { PageHeader } from '@/components/ui/PageHeader';
import { useMemo, useState } from 'react';
import { useAuthStore } from '@/app/store/authStore';
import { useCompanies } from '@/features/companies/useCompanies';
import { useCreateUser, useUpdateUser, useUsers } from '@/features/users/useUsers';
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
      });
      return;
    }

      createMutation.mutate({
        name: form.name,
        email: form.email,
        password: form.password || undefined,
        timezone: form.timezone,
        is_active: form.is_active,
        role: form.role,
        company_id: form.role === 'super_admin' ? null : form.company_id,
      });
  };

  return (
    <div>
      <PageHeader title="Users" description="Company-scoped user management with owner/admin role boundaries." />
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-panel">
          <h2 className="text-lg font-semibold">{editing ? 'Edit user' : 'Create user'}</h2>
          <div className="mt-4 space-y-3">
            {actor?.role === 'super_admin' ? (
              <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.company_id ?? ''} onChange={(event) => setForm((state) => ({ ...state, company_id: event.target.value ? Number(event.target.value) : null }))}>
                <option value="">Platform-level user</option>
                {(companies?.data ?? []).map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            ) : null}
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Full name" value={form.name} onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Email" value={form.email} onChange={(event) => setForm((state) => ({ ...state, email: event.target.value }))} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder={editing ? 'New password (optional)' : 'Temporary password'} value={form.password} onChange={(event) => setForm((state) => ({ ...state, password: event.target.value }))} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Timezone" value={form.timezone} onChange={(event) => setForm((state) => ({ ...state, timezone: event.target.value }))} />
            <select className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={form.role} onChange={(event) => setForm((state) => ({ ...state, role: event.target.value as UserRole }))}>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((state) => ({ ...state, is_active: event.target.checked }))} />
              Active
            </label>
            <button className="w-full rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white" onClick={submit}>
              {editing ? 'Save user' : 'Create user'}
            </button>
          </div>
        </section>
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-panel">
          <h2 className="text-lg font-semibold">User directory</h2>
          <div className="mt-4 space-y-3">
            {(data?.data ?? []).map((user) => (
              <button
                key={user.id}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 p-4 text-left"
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
        </section>
      </div>
    </div>
  );
}
