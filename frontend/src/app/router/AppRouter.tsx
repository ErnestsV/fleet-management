import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '@/app/store/authStore';
import { AppShell } from '@/components/layout/AppShell';
import { AccessDenied } from '@/components/ui/AccessDenied';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { CompaniesPage } from '@/pages/CompaniesPage';
import { UsersPage } from '@/pages/UsersPage';
import { VehiclesPage } from '@/pages/VehiclesPage';
import { DriversPage } from '@/pages/DriversPage';
import { AlertsPage } from '@/pages/AlertsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { TripsPage } from '@/pages/TripsPage';
import { GeofencesPage } from '@/pages/GeofencesPage';
import { MaintenancePage } from '@/pages/MaintenancePage';
import { LiveMapPage } from '@/pages/LiveMapPage';
import type { UserRole } from '@/types/domain';
import { COMPANY_MANAGEMENT_ROLES, USER_MANAGEMENT_ROLES } from '@/lib/constants/roles';

function ProtectedLayout() {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function RoleRoute({ roles }: { roles: UserRole[] }) {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Outlet />;
  }

  return roles.includes(user.role) ? <Outlet /> : <AccessDenied />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route element={<ProtectedLayout />}>
        <Route index element={<DashboardPage />} />
        <Route element={<RoleRoute roles={COMPANY_MANAGEMENT_ROLES} />}>
          <Route path="/companies" element={<CompaniesPage />} />
        </Route>
        <Route element={<RoleRoute roles={USER_MANAGEMENT_ROLES} />}>
          <Route path="/users" element={<UsersPage />} />
        </Route>
        <Route path="/vehicles" element={<VehiclesPage />} />
        <Route path="/live-map" element={<LiveMapPage />} />
        <Route path="/drivers" element={<DriversPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/geofences" element={<GeofencesPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
