import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from '@/pages/LoginPage';
import { renderWithProviders } from '../test-utils';

const navigateMock = vi.fn();
const mutateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/features/auth/useLogin', () => ({
  useLogin: () => ({
    mutate: mutateMock,
    isPending: false,
    isError: false,
    error: null,
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    mutateMock.mockReset();
  });

  it('renders the forgot password link', () => {
    renderWithProviders(<LoginPage />, { route: '/login' });

    expect(screen.getByRole('link', { name: 'Forgot password?' })).toHaveAttribute('href', '/forgot-password');
  });

  it('submits credentials through the login mutation', () => {
    renderWithProviders(<LoginPage />, { route: '/login' });

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'admin@example.test' } });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));

    expect(mutateMock).toHaveBeenCalled();
    const [payload] = mutateMock.mock.calls[0];
    expect(payload).toEqual({ email: 'admin@example.test', password: 'secret123' });
  });
});
