import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin } from '@/features/auth/useLogin';
import { getApiErrorMessage } from '@/lib/api/errors';

export function LoginPage() {
  const navigate = useNavigate();
  const mutation = useLogin();
  const [email, setEmail] = useState('superadmin@fleetos.test');
  const [password, setPassword] = useState('password');
  const [showPassword, setShowPassword] = useState(false);

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
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <div className="relative">
            <input
              id="login-password"
              name="password"
              autoComplete="current-password"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12"
              placeholder="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-2xl text-slate-400 transition hover:text-slate-700"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
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
