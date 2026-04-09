import { useMutation, useQueryClient } from '@tanstack/react-query';
import { changePassword, updateProfile } from '@/lib/api/profile';
import { updateCompany } from '@/lib/api/companies';
import { useAuthStore } from '@/app/store/authStore';

export function useUpdateProfile() {
  const token = useAuthStore((state) => state.token);
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (user) => {
      if (token) {
        setSession(token, user);
      }
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
  });
}

export function useUpdateCompanySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ companyId, speedAlertThresholdKmh }: { companyId: number; speedAlertThresholdKmh: number }) => {
      const { user } = useAuthStore.getState();
      const currentCompany = user?.company;

      if (!currentCompany) {
        throw new Error('Company context is not available.');
      }

      return updateCompany(companyId, {
        name: currentCompany.name,
        timezone: currentCompany.timezone,
        is_active: currentCompany.is_active ?? true,
        settings: {
          speed_alert_threshold_kmh: speedAlertThresholdKmh,
        },
      });
    },
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });

      const { token, user, setSession } = useAuthStore.getState();

      if (token && user && user.company) {
        setSession(token, {
          ...user,
          company: {
            ...user.company,
            name: data.name,
            timezone: data.timezone,
            is_active: data.is_active,
            settings: data.settings,
          },
        });
      }
    },
  });
}
