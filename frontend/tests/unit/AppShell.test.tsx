import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from '@/components/layout/AppShell';
import { renderWithProviders } from '../test-utils';
import type { AuthUser } from '@/types/domain';

const navigateMock = vi.fn();
const clearSessionMock = vi.fn();

const authUser: AuthUser = {
  id: 1,
  company_id: null,
  name: 'Platform Admin',
  email: 'admin@example.test',
  role: 'super_admin',
  timezone: 'Europe/Riga',
  is_active: true,
  company: null,
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/app/store/authStore', () => ({
  useAuthStore: (selector: (state: { user: AuthUser | null; clearSession: () => void }) => unknown) =>
    selector({
      user: authUser,
      clearSession: clearSessionMock,
    }),
}));

vi.mock('@/features/alerts/useAlerts', () => ({
  useAlerts: () => ({
    data: {
      data: [],
      meta: {
        total: 1,
      },
    },
  }),
}));

vi.mock('@/lib/api/auth', () => ({
  logout: vi.fn().mockResolvedValue({ message: 'ok' }),
}));

describe('AppShell', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    clearSessionMock.mockReset();
  });

  it('shows only platform navigation for super admin users', () => {
    renderWithProviders(
      <AppShell>
        <div>Dashboard content</div>
      </AppShell>,
    );

    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(screen.getByTitle('Companies')).toBeInTheDocument();
    expect(screen.getByTitle('Settings')).toBeInTheDocument();
    expect(screen.queryByTitle('Vehicles')).not.toBeInTheDocument();
  });

  it('closes the profile menu when clicking outside', () => {
    renderWithProviders(
      <AppShell>
        <div>Dashboard content</div>
      </AppShell>,
    );

    fireEvent.click(screen.getByRole('button', { name: /platform admin/i }));
    expect(screen.getByRole('button', { name: 'Profile' })).toBeInTheDocument();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('button', { name: 'Profile' })).not.toBeInTheDocument();
  });
});
