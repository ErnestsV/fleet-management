import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Building2, CarFront, ChevronDown, ChevronsLeft, ChevronsRight, CircleUserRound, LayoutDashboard, LineChart, Map, MapPinned, Menu, Route, Settings, Users, Wrench, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/app/store/authStore';
import { useAlerts } from '@/features/alerts/useAlerts';
import { logout } from '@/lib/api/auth';
import type { AlertItem } from '@/types/domain';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/companies', label: 'Companies', icon: Building2 },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/vehicles', label: 'Vehicles', icon: CarFront },
  { to: '/live-map', label: 'Live Map', icon: MapPinned },
  { to: '/drivers', label: 'Drivers', icon: Route },
  { to: '/driver-insights', label: 'Driver Insights', icon: LineChart },
  { to: '/trips', label: 'Trips', icon: Route },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/geofences', label: 'Geofences', icon: Map },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/profile', label: 'Settings', icon: Settings },
];

const informationalAlertTypes = new Set<AlertItem['type']>(['geofence_entry', 'geofence_exit']);

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [desktopNavExpanded, setDesktopNavExpanded] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const { data: activeAlerts } = useAlerts({ status: 'active' }, { refetchInterval: 10000 });

  const activeAlertCount = activeAlerts?.data?.filter((alert) => !informationalAlertTypes.has(alert.type)).length ?? 0;
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

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);

    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className={`grid min-h-screen ${desktopNavExpanded ? 'lg:grid-cols-[240px_minmax(0,1fr)]' : 'lg:grid-cols-[88px_minmax(0,1fr)]'}`}>
        <aside className={`hidden border-r border-slate-200 bg-slate-950 text-white transition-all duration-200 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:self-start lg:overflow-y-auto lg:py-6 ${desktopNavExpanded ? 'lg:px-4' : 'lg:items-center'}`}>
          <div className={`mb-10 text-lg font-extrabold tracking-wide text-brand-100 ${desktopNavExpanded ? 'px-3' : ''}`}>FO</div>
          <nav className={`flex flex-1 flex-col gap-3 ${desktopNavExpanded ? '' : ''}`}>
            {links.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex items-center rounded-2xl transition ${
                    desktopNavExpanded ? 'gap-3 px-4 py-3' : 'h-12 w-12 justify-center'
                  } ${
                    isActive ? 'bg-brand-500 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                  }`
                }
                title={label}
              >
                <Icon size={20} />
                {desktopNavExpanded ? <span className="text-sm font-medium">{label}</span> : null}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            className={`mt-6 rounded-2xl text-slate-400 transition hover:bg-slate-900 hover:text-white ${desktopNavExpanded ? 'flex items-center gap-3 px-4 py-3 text-sm font-medium' : 'flex h-12 w-12 items-center justify-center self-center'}`}
            onClick={() => setDesktopNavExpanded((value) => !value)}
            aria-label={desktopNavExpanded ? 'Collapse desktop menu' : 'Expand desktop menu'}
          >
            {desktopNavExpanded ? <ChevronsLeft size={18} /> : <ChevronsRight size={18} />}
            {desktopNavExpanded ? <span>Collapse menu</span> : null}
          </button>
        </aside>
        {mobileNavOpen ? (
          <div className="fixed inset-0 z-[1100] lg:hidden">
            <button type="button" className="absolute inset-0 bg-slate-950/45" onClick={() => setMobileNavOpen(false)} aria-label="Close mobile navigation" />
            <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-slate-200 bg-slate-950 px-5 py-6 text-white shadow-2xl">
              <div className="mb-8 flex items-center justify-between">
                <div className="text-lg font-extrabold tracking-wide text-brand-100">FO</div>
                <button type="button" className="rounded-xl p-2 text-slate-300 hover:bg-slate-900 hover:text-white" onClick={() => setMobileNavOpen(false)} aria-label="Close mobile navigation">
                  <X size={20} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto pr-1">
                <div className="flex flex-col gap-2">
                {links.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMobileNavOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                        isActive ? 'bg-brand-500 text-white' : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                      }`
                    }
                  >
                    <Icon size={18} />
                    <span>{label}</span>
                  </NavLink>
                ))}
                </div>
              </nav>
            </aside>
          </div>
        ) : null}
        <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/70 px-6 py-4 backdrop-blur lg:static">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 shadow-panel transition hover:border-slate-300 hover:text-slate-900 lg:hidden"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open mobile navigation"
              >
                <Menu size={18} />
              </button>
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">FleetOS</div>
                <div className="hidden text-xs text-slate-500 lg:block">Fleet telemetry and SaaS operations</div>
              </div>
            </div>
            <div className="flex flex-wrap justify-end items-center gap-4">
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

              <div ref={profileMenuRef} className="relative">
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
          <main className="flex-1 p-4 md:p-6 max-w-[100vw]">{children}</main>
        </div>
      </div>
    </div>
  );
}
