import type { UserRole } from '@/types/domain';

export const COMPANY_MANAGEMENT_ROLES: UserRole[] = ['super_admin'];
export const USER_MANAGEMENT_ROLES: UserRole[] = ['super_admin', 'owner', 'admin'];
