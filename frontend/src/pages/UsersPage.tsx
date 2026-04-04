import { PageHeader } from '@/components/ui/PageHeader';
import { useCallback, useMemo, useState } from 'react';
import { useAuthStore } from '@/app/store/authStore';
import { useCompanies } from '@/features/companies/useCompanies';
import { UserDirectoryPanel } from '@/features/users/components/UserDirectoryPanel';
import { UserFormPanel } from '@/features/users/components/UserFormPanel';
import {
  buildCreateUserPayload,
  buildUpdateUserPayload,
  createEmptyUserFormValues,
  createUserFormValuesFromUser,
} from '@/features/users/form';
import { useCreateUser, useUpdateUser, useUsers } from '@/features/users/useUsers';
import { DismissibleAlert } from '@/components/ui/DismissibleAlert';
import { getApiErrorMessage } from '@/lib/api/errors';
import type { UserRole } from '@/types/domain';

export function UsersPage() {
  const actor = useAuthStore((state) => state.user);
  const { data: companies } = useCompanies(actor?.role === 'super_admin');
  const { data } = useUsers();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const [editingId, setEditingId] = useState<number | null>(null);
  const roleOptions = useMemo<UserRole[]>(
    () => (actor?.role === 'super_admin' ? ['super_admin', 'owner', 'admin', 'dispatcher', 'viewer'] : ['admin', 'dispatcher', 'viewer']),
    [actor?.role],
  );
  const [form, setForm] = useState(() => createEmptyUserFormValues(actor));
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const dismissSuccessMessage = useCallback(() => setSuccessMessage(null), []);
  const dismissCreateError = useCallback(() => createMutation.reset(), [createMutation]);
  const dismissUpdateError = useCallback(() => updateMutation.reset(), [updateMutation]);
  const companyOptions = companies?.data ?? [];
  const users = data?.data ?? [];

  const resetForm = () => {
    setEditingId(null);
    setForm(createEmptyUserFormValues(actor));
  };

  const submit = () => {
    if (editingId) {
      updateMutation.mutate({
        userId: editingId,
        payload: buildUpdateUserPayload(form),
      }, {
        onSuccess: () => {
          setSuccessMessage('User updated successfully.');
          resetForm();
        },
      });
      return;
    }

    createMutation.mutate(buildCreateUserPayload(form), {
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
        <UserFormPanel
          isSuperAdmin={actor?.role === 'super_admin'}
          editingId={editingId}
          form={form}
          companies={companyOptions}
          roleOptions={roleOptions}
          onChange={setForm}
          onSubmit={submit}
          onCancel={resetForm}
        />
        <UserDirectoryPanel
          users={users}
          onSelect={(user) => {
            setEditingId(user.id);
            setForm(createUserFormValuesFromUser(user));
          }}
        />
      </div>
    </div>
  );
}
