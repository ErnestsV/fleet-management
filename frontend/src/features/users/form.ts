import type { AuthUser, UserRole } from '@/types/domain';

export type UserFormValues = {
  company_id: number | null;
  name: string;
  email: string;
  password: string;
  timezone: string;
  is_active: boolean;
  role: UserRole;
};

export function createEmptyUserFormValues(actor: Pick<AuthUser, 'company_id' | 'timezone' | 'role'> | null | undefined): UserFormValues {
  return {
    company_id: actor?.company_id ?? null,
    name: '',
    email: '',
    password: '',
    timezone: actor?.timezone ?? 'Europe/Riga',
    is_active: true,
    role: (actor?.role === 'super_admin' ? 'owner' : 'viewer') as UserRole,
  };
}

export function createUserFormValuesFromUser(user: AuthUser): UserFormValues {
  return {
    company_id: user.company_id,
    name: user.name,
    email: user.email,
    password: '',
    timezone: user.timezone,
    is_active: user.is_active,
    role: user.role,
  };
}

export function buildCreateUserPayload(form: UserFormValues) {
  return {
    name: form.name,
    email: form.email,
    timezone: form.timezone,
    is_active: form.is_active,
    role: form.role,
    company_id: form.role === 'super_admin' ? null : form.company_id,
  };
}

export function buildUpdateUserPayload(form: UserFormValues) {
  return {
    name: form.name,
    email: form.email,
    password: form.password || undefined,
    timezone: form.timezone,
    is_active: form.is_active,
    role: form.role,
  };
}
