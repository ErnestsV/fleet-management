import { useMutation } from '@tanstack/react-query';
import { login } from '@/lib/api/auth';
import { useAuthStore } from '@/app/store/authStore';

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: login,
    onSuccess: ({ token, user }) => setSession(token, user),
  });
}
