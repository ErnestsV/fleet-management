import { PageHeader } from '@/components/ui/PageHeader';
import { useCallback, useState } from 'react';
import { useCreateCompany, useCompanies, useUpdateCompany } from '@/features/companies/useCompanies';
import { CheckboxField } from '@/components/ui/CheckboxField';
import { DismissibleAlert } from '@/components/ui/DismissibleAlert';
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
    owner_role: 'owner' as 'owner' | 'admin',
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const dismissSuccessMessage = useCallback(() => setSuccessMessage(null), []);

  const resetForm = () => {
    setEditing(null);
    setForm({
      name: '',
      timezone: 'Europe/Riga',
      is_active: true,
      owner_name: '',
      owner_email: '',
      owner_role: 'owner',
    });
  };

  const submit = () => {
    const createsOwner = Boolean(form.owner_email.trim());

    if (editing) {
      updateMutation.mutate({
        companyId: editing.id,
        payload: {
          name: form.name,
          timezone: form.timezone,
          is_active: form.is_active,
        },
      }, {
        onSuccess: () => {
          setSuccessMessage('Company updated successfully.');
          resetForm();
        },
      });
    } else {
      createMutation.mutate({
        name: form.name,
        timezone: form.timezone,
        is_active: form.is_active,
        owner: createsOwner
          ? {
              name: form.owner_name,
              email: form.owner_email,
              role: form.owner_role,
            }
          : undefined,
      }, {
        onSuccess: () => {
          setSuccessMessage(
            createsOwner
              ? 'Company created successfully. The owner will receive an invitation email.'
              : 'Company created successfully.'
          );
          resetForm();
        },
      });
    }
  };

  return (
    <div>
      <PageHeader title="Companies" description="Super admin company management with tenant bootstrap users." />
      {successMessage ? <DismissibleAlert className="mb-6" message={successMessage} onClose={dismissSuccessMessage} /> : null}
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Panel title={editing ? 'Edit company' : 'Create company'}>
          <div className="mt-4 space-y-3">
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Company name" value={form.name} onChange={(event) => setForm((state) => ({ ...state, name: event.target.value }))} />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Timezone" value={form.timezone} onChange={(event) => setForm((state) => ({ ...state, timezone: event.target.value }))} />
            {!editing ? (
              <>
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Owner name" value={form.owner_name} onChange={(event) => setForm((state) => ({ ...state, owner_name: event.target.value }))} />
                <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" placeholder="Owner email" value={form.owner_email} onChange={(event) => setForm((state) => ({ ...state, owner_email: event.target.value }))} />
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {form.owner_email.trim()
                    ? 'The owner will receive a password setup email in the configured mailbox after creation.'
                    : 'Owner details are optional. Leave them blank to create the company without sending an invitation.'}
                </div>
              </>
            ) : null}
            <CheckboxField checked={form.is_active} onChange={(event) => setForm((state) => ({ ...state, is_active: event.target.checked }))} label="Active" />
            <div className="flex gap-3">
              <button className="flex-1 rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white" onClick={submit}>
                {editing ? 'Save company' : 'Create company'}
              </button>
              {editing ? (
                <button className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700" onClick={resetForm}>
                  Cancel
                </button>
              ) : null}
            </div>
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
