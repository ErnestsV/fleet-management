import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin } from '@/features/auth/useLogin';
import { getApiErrorMessage } from '@/lib/api/errors';

export function LoginPage() {
  const navigate = useNavigate();
  const mutation = useLogin();
  const [email, setEmail] = useState('superadmin@fleetos.test');
  const [password, setPassword] = useState('password');

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-white p-8 shadow-2xl">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">FleetOS</div>
        <h1 className="mt-3 text-3xl font-bold text-slate-950">Sign in</h1>
        <p className="mt-2 text-sm text-slate-500">Sanctum-backed authentication UI scaffold.</p>
        <form
          className="mt-8 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate(
              { email, password },
              {
                onSuccess: () => navigate('/'),
              },
            );
          }}
        >
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button className="w-full rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white">
            {mutation.isPending ? 'Signing in...' : 'Login'}
          </button>
          {mutation.isError ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{getApiErrorMessage(mutation.error)}</div> : null}
        </form>
        <div className="mt-4 flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="font-medium text-brand-700 hover:text-brand-800">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
}
