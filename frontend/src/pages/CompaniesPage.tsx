import { PageHeader } from '@/components/ui/PageHeader';
import { useState } from 'react';
import { useCreateCompany, useCompanies, useUpdateCompany } from '@/features/companies/useCompanies';
import { CheckboxField } from '@/components/ui/CheckboxField';
import { Panel } from '@/components/ui/Panel';
import type { Company } from '@/types/domain';

export function CompaniesPage() {
  const { data } = useCompanies();
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState({
    name: '',
    timezone: 'Europe/Riga',
    is_active: true,
    owner_name: '',
    owner_email: '',
    owner_password: '',
    owner_role: 'owner' as 'owner' | 'admin',
  });

  const submit = () => {
    if (editing) {
      updateMutation.mutate({
        companyId: editing.id,
        payload: {
          name: form.name,
          timezone: form.timezone,
          is_active: form.is_active,
        },
      });
    } else {
      createMutation.mutate({
        name: form.name,
        timezone: form.timezone,
        is_active: form.is_active,
        owner: form.owner_email
          ? {
              name: form.owner_name,
              email: form.owner_email,
              password: form.owner_password || undefined,
              role: form.owner_role,
            }
          : undefined,
      });
    }
  };

  return (
    <div>
      <PageHeader title="Companies" description="Super admin company management with tenant bootstrap users." />
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Panel title={editing ? 'Edit company' : 'Create company'}>
          <div className="mt-4 space-y-3">
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Company name" value={form.name} onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Timezone" value={form.timezone} onChange={(event) => setForm((state) => ({ ...state, timezone: event.target.value }))} />
            {!editing ? (
              <>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Owner name" value={form.owner_name} onChange={(event) => setForm((state) => ({ ...state, owner_name: event.target.value }))} />
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Owner email" value={form.owner_email} onChange={(event) => setForm((state) => ({ ...state, owner_email: event.target.value }))} />
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Temporary password" value={form.owner_password} onChange={(event) => setForm((state) => ({ ...state, owner_password: event.target.value }))} />
              </>
            ) : null}
            <CheckboxField checked={form.is_active} onChange={(event) => setForm((state) => ({ ...state, is_active: event.target.checked }))} label="Active" />
            <button className="w-full rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white" onClick={submit}>
              {editing ? 'Save company' : 'Create company'}
            </button>
          </div>
        </Panel>
        <Panel title="Company directory">
          <div className="mt-4 space-y-3">
            {(data?.data ?? []).map((company) => (
              <button
                key={company.id}
                className="flex flex-wrap gap-3 w-full items-center justify-between rounded-2xl border border-slate-200 p-4 text-left"
                onClick={() => {
                  setEditing(company);
                  setForm({
                    name: company.name,
                    timezone: company.timezone,
                    is_active: company.is_active,
                    owner_name: '',
                    owner_email: '',
                    owner_password: '',
                    owner_role: 'owner',
                  });
                }}
              >
                <div>
                  <div className="font-semibold">{company.name}</div>
                  <div className="text-sm text-slate-500">{company.slug}</div>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs font-semibold ${company.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                  {company.is_active ? 'Active' : 'Inactive'}
                </div>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
