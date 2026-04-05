import { Suspense, lazy } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '@/app/store/authStore';
import { AppShell } from '@/components/layout/AppShell';
import { AccessDenied } from '@/components/ui/AccessDenied';
import { RouteContentFallback } from '@/components/ui/RouteContentFallback';
import type { UserRole } from '@/types/domain';
import { COMPANY_MANAGEMENT_ROLES, USER_MANAGEMENT_ROLES } from '@/lib/constants/roles';

const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const LoginPage = lazy(() => import('@/pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage').then((module) => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage').then((module) => ({ default: module.ResetPasswordPage })));
const CompaniesPage = lazy(() => import('@/pages/CompaniesPage').then((module) => ({ default: module.CompaniesPage })));
const UsersPage = lazy(() => import('@/pages/UsersPage').then((module) => ({ default: module.UsersPage })));
const VehiclesPage = lazy(() => import('@/pages/VehiclesPage').then((module) => ({ default: module.VehiclesPage })));
const DriversPage = lazy(() => import('@/pages/DriversPage').then((module) => ({ default: module.DriversPage })));
const DriverInsightsPage = lazy(() => import('@/pages/DriverInsightsPage').then((module) => ({ default: module.DriverInsightsPage })));
const AlertsPage = lazy(() => import('@/pages/AlertsPage').then((module) => ({ default: module.AlertsPage })));
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((module) => ({ default: module.ProfilePage })));
const TripsPage = lazy(() => import('@/pages/TripsPage').then((module) => ({ default: module.TripsPage })));
const GeofencesPage = lazy(() => import('@/pages/GeofencesPage').then((module) => ({ default: module.GeofencesPage })));
const MaintenancePage = lazy(() => import('@/pages/MaintenancePage').then((module) => ({ default: module.MaintenancePage })));
const LiveMapPage = lazy(() => import('@/pages/LiveMapPage').then((module) => ({ default: module.LiveMapPage })));

function ProtectedLayout() {
  const token = useAuthStore((state) => state.token);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell>
      <Suspense fallback={<RouteContentFallback />}>
        <Outlet />
      </Suspense>
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
      <Route path="/login" element={<Suspense fallback={<RouteContentFallback />}><LoginPage /></Suspense>} />
      <Route path="/forgot-password" element={<Suspense fallback={<RouteContentFallback />}><ForgotPasswordPage /></Suspense>} />
      <Route path="/reset-password" element={<Suspense fallback={<RouteContentFallback />}><ResetPasswordPage /></Suspense>} />
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
        <Route path="/driver-insights" element={<DriverInsightsPage />} />
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
