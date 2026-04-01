import { create } from 'zustand';
import type { AuthUser } from '@/types/domain';

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('fleetos.token'),
  user: null,
  setSession: (token, user) => {
    localStorage.setItem('fleetos.token', token);
    set({ token, user });
  },
  clearSession: () => {
    localStorage.removeItem('fleetos.token');
    set({ token: null, user: null });
  },
}));
