import { apiClient } from '@/lib/api/client';
import type { AuthUser } from '@/types/domain';

export type LoginPayload = {
  email: string;
  password: string;
};

export async function login(payload: LoginPayload): Promise<{ token: string; user: AuthUser }> {
  const { data } = await apiClient.post('/auth/login', payload);
  return data;
}

export async function logout(): Promise<{ message: string }> {
  const { data } = await apiClient.post('/auth/logout');
  return data;
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const { data } = await apiClient.post('/auth/forgot-password', { email });
  return data;
}

export async function resetPassword(payload: {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}): Promise<{ message: string }> {
  const { data } = await apiClient.post('/auth/reset-password', payload);
  return data;
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await apiClient.get('/auth/user');
  return data.data ?? data;
}
