import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/app/store/authStore';
import { PageHeader } from '@/components/ui/PageHeader';
import { Panel } from '@/components/ui/Panel';
import { useChangePassword, useUpdateCompanySettings, useUpdateProfile } from '@/features/profile/useProfile';
import { getApiErrorMessage } from '@/lib/api/errors';

export function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const profileMutation = useUpdateProfile();
  const companySettingsMutation = useUpdateCompanySettings();
  const passwordMutation = useChangePassword();
  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    timezone: user?.timezone ?? 'Europe/Riga',
  });
  const [companySettingsForm, setCompanySettingsForm] = useState({
    speed_alert_threshold_kmh: user?.company?.settings?.speed_alert_threshold_kmh ?? 90,
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [visiblePasswordFields, setVisiblePasswordFields] = useState({
    current_password: false,
    password: false,
    password_confirmation: false,
  });

  useEffect(() => {
    if (!user) {
      return;
    }

    setProfileForm({
      name: user.name,
      email: user.email,
      timezone: user.timezone ?? 'Europe/Riga',
    });
    setCompanySettingsForm({
      speed_alert_threshold_kmh: user.company?.settings?.speed_alert_threshold_kmh ?? 90,
    });
  }, [user]);

  const canManageCompanySettings = Boolean(user?.company) && (user?.role === 'owner' || user?.role === 'admin');

  return (
    <div>
      <PageHeader title="Profile & settings" description="Authenticated user profile, company context, operational settings, and password management." />
      {!user ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">Loading profile...</div> : null}
      {user ? (
      <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-4">
        <Panel title="Profile" description="Update the signed-in account details used throughout the platform.">
          <div className="space-y-3">
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={profileForm.name} onChange={(event) => setProfileForm((state) => ({ ...state, name: event.target.value }))} placeholder="Name" />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={profileForm.email} onChange={(event) => setProfileForm((state) => ({ ...state, email: event.target.value }))} placeholder="Email" />
            <input className="w-full rounded-2xl border border-slate-200 px-4 py-3" value={profileForm.timezone} onChange={(event) => setProfileForm((state) => ({ ...state, timezone: event.target.value }))} placeholder="Timezone" />
            <button className="w-full rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white" onClick={() => profileMutation.mutate(profileForm)}>
              {profileMutation.isPending ? 'Saving...' : 'Save profile'}
            </button>
            {profileMutation.isSuccess ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Profile updated.</div> : null}
            {profileMutation.isError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{getApiErrorMessage(profileMutation.error)}</div> : null}
          </div>
        </Panel>
        <Panel title="Identity" description="Current tenant and role information from the authenticated session.">
          <div className="space-y-4 text-sm">
            <div><div className="text-slate-500">Role</div><div className="mt-1 font-semibold capitalize">{user?.role?.replace(/_/g, ' ')}</div></div>
            <div><div className="text-slate-500">Company</div><div className="mt-1 font-semibold">{user?.company?.name ?? 'Platform'}</div></div>
            <div><div className="text-slate-500">Company timezone</div><div className="mt-1 font-semibold">{user?.company?.timezone ?? 'N/A'}</div></div>
          </div>
        </Panel>
        {canManageCompanySettings ? (
          <Panel title="Company settings" description="Operational company-level settings that affect fleet behavior and alerts.">
            <div className="space-y-3">
              <input
                type="number"
                min={1}
                max={300}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                value={companySettingsForm.speed_alert_threshold_kmh}
                onChange={(event) => setCompanySettingsForm({ speed_alert_threshold_kmh: Number(event.target.value || 90) })}
                placeholder="Speed alert threshold (km/h)"
              />
              <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                Speeding alerts are triggered when telemetry speed is above this company threshold. Default is 90 km/h.
                <div className="mt-2 text-sky-700">
                  Active speeding alerts resolve automatically after 3 consecutive telemetry events at or below the configured threshold.
                </div>
              </div>
              <button
                className="w-full rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white"
                onClick={() =>
                  user.company &&
                  companySettingsMutation.mutate({
                    companyId: user.company.id,
                    speedAlertThresholdKmh: companySettingsForm.speed_alert_threshold_kmh,
                  })
                }
              >
                {companySettingsMutation.isPending ? 'Saving...' : 'Save company settings'}
              </button>
              {companySettingsMutation.isSuccess ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Company settings updated.</div> : null}
              {companySettingsMutation.isError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{getApiErrorMessage(companySettingsMutation.error)}</div> : null}
            </div>
          </Panel>
        ) : null}
        <Panel title="Password" description="Change the current account password safely.">
          <div className="space-y-3">
            <div className="relative">
              <input
                id="profile-current-password"
                name="current_password"
                autoComplete="current-password"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12"
                type={visiblePasswordFields.current_password ? 'text' : 'password'}
                value={passwordForm.current_password}
                onChange={(event) => setPasswordForm((state) => ({ ...state, current_password: event.target.value }))}
                placeholder="Current password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-2xl text-slate-400 transition hover:text-slate-700"
                onClick={() => setVisiblePasswordFields((state) => ({ ...state, current_password: !state.current_password }))}
                aria-label={visiblePasswordFields.current_password ? 'Hide current password' : 'Show current password'}
              >
                {visiblePasswordFields.current_password ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="relative">
              <input
                id="profile-new-password"
                name="password"
                autoComplete="new-password"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12"
                type={visiblePasswordFields.password ? 'text' : 'password'}
                value={passwordForm.password}
                onChange={(event) => setPasswordForm((state) => ({ ...state, password: event.target.value }))}
                placeholder="New password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-2xl text-slate-400 transition hover:text-slate-700"
                onClick={() => setVisiblePasswordFields((state) => ({ ...state, password: !state.password }))}
                aria-label={visiblePasswordFields.password ? 'Hide new password' : 'Show new password'}
              >
                {visiblePasswordFields.password ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="relative">
              <input
                id="profile-password-confirmation"
                name="password_confirmation"
                autoComplete="new-password"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12"
                type={visiblePasswordFields.password_confirmation ? 'text' : 'password'}
                value={passwordForm.password_confirmation}
                onChange={(event) => setPasswordForm((state) => ({ ...state, password_confirmation: event.target.value }))}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-2xl text-slate-400 transition hover:text-slate-700"
                onClick={() => setVisiblePasswordFields((state) => ({ ...state, password_confirmation: !state.password_confirmation }))}
                aria-label={visiblePasswordFields.password_confirmation ? 'Hide password confirmation' : 'Show password confirmation'}
              >
                {visiblePasswordFields.password_confirmation ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white"
              onClick={() =>
                passwordMutation.mutate(passwordForm, {
                  onSuccess: () => {
                    setPasswordForm({
                      current_password: '',
                      password: '',
                      password_confirmation: '',
                    });
                    setVisiblePasswordFields({
                      current_password: false,
                      password: false,
                      password_confirmation: false,
                    });
                  },
                })
              }
            >
              {passwordMutation.isPending ? 'Updating...' : 'Update password'}
            </button>
            {passwordMutation.isSuccess ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Password updated successfully.</div> : null}
            {passwordMutation.isError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{getApiErrorMessage(passwordMutation.error)}</div> : null}
          </div>
        </Panel>
      </div>
      ) : null}
    </div>
  );
}
