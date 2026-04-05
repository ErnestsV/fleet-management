import axios from 'axios';
import { useAuthStore } from '@/app/store/authStore';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1',
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('fleetos.token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      useAuthStore.getState().clearSession();

      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }

    return Promise.reject(error);
  },
);
