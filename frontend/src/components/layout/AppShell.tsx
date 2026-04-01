import { ReactNode, useMemo, useState } from 'react';
import { Bell, Building2, CarFront, ChevronDown, CircleUserRound, LayoutDashboard, Map, MapPinned, Route, Settings, Users, Wrench } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/app/store/authStore';
import { useAlerts } from '@/features/alerts/useAlerts';
import { logout } from '@/lib/api/auth';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/vehicles', label: 'Vehicles', icon: CarFront },
  { to: '/live-map', label: 'Live Map', icon: MapPinned },
  { to: '/drivers', label: 'Drivers', icon: Route },
  { to: '/trips', label: 'Trips', icon: Route },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/geofences', label: 'Geofences', icon: Map },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/profile', label: 'Settings', icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: activeAlerts } = useAlerts({ status: 'active' });

  const activeAlertCount = activeAlerts?.data?.length ?? 0;
  const companyLabel = useMemo(() => {
    if (user?.company?.name) {
      return user.company.name;
    }

    return user?.role === 'super_admin' ? 'Platform' : 'No company';
  }, [user]);

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Ignore API logout failures and clear the local session anyway.
    }

    clearSession();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="grid min-h-screen lg:grid-cols-[88px_minmax(0,1fr)]">
        <aside className="hidden border-r border-slate-200 bg-slate-950 text-white lg:flex lg:flex-col lg:items-center lg:py-6">
          <div className="mb-10 text-lg font-extrabold tracking-wide text-brand-100">FO</div>
          <nav className="flex flex-1 flex-col gap-3">
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                    isActive ? 'bg-brand-500 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`
                }
                title={label}
              >
                <Icon size={20} />
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="flex min-h-screen flex-col">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white/70 px-6 py-4 backdrop-blur">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">FleetOS</div>
              <div className="text-xs text-slate-500">Fleet telemetry and SaaS operations</div>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="relative flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-panel transition hover:border-slate-300 hover:text-slate-900"
                onClick={() => navigate('/alerts')}
              >
                <Bell size={16} />
                <span className="hidden sm:inline">Notifications</span>
                {activeAlertCount > 0 ? (
                  <span className="flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                    {activeAlertCount}
                  </span>
                ) : null}
              </button>

              <div className="relative">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-2xl bg-transparent px-2 py-1 text-left transition hover:bg-slate-100"
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  <CircleUserRound className="text-slate-500" size={18} />
                  <div className="hidden leading-tight sm:block">
                    <div className="text-sm font-medium text-slate-900">{user?.name ?? 'Account'}</div>
                    <div className="text-xs text-slate-400">{companyLabel}</div>
                  </div>
                  <ChevronDown className="text-slate-400" size={16} />
                </button>

                {menuOpen ? (
                  <div className="absolute right-0 z-20 mt-2 w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                    <button
                      type="button"
                      className="w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                      onClick={() => {
                        setMenuOpen(false);
                        navigate('/profile');
                      }}
                    >
                      Profile
                    </button>
                    <button
                      type="button"
                      className="w-full rounded-xl px-3 py-2 text-left text-sm text-rose-600 transition hover:bg-rose-50"
                      onClick={async () => {
                        setMenuOpen(false);
                        await handleLogout();
                      }}
                    >
                      Log out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
