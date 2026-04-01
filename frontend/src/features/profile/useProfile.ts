import { useMutation } from '@tanstack/react-query';
import { changePassword, updateProfile } from '@/lib/api/profile';
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
