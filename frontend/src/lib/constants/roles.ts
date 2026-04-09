import type { UserRole } from '@/types/domain';

export const COMPANY_MANAGEMENT_ROLES: UserRole[] = ['super_admin'];
export const USER_MANAGEMENT_ROLES: UserRole[] = ['owner', 'admin'];
export const FLEET_ACCESS_ROLES: UserRole[] = ['owner', 'admin', 'dispatcher', 'viewer'];
