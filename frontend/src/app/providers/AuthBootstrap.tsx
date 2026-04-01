import { ReactNode, useEffect } from 'react';
import { fetchMe } from '@/lib/api/auth';
import { useAuthStore } from '@/app/store/authStore';

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.token);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);

  useEffect(() => {
    if (!token) {
      return;
    }

    fetchMe()
      .then((user) => setSession(token, user))
      .catch(() => clearSession());
  }, [clearSession, setSession, token]);

  return <>{children}</>;
}
