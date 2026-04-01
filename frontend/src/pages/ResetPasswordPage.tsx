import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useResetPassword } from '@/features/auth/useResetPassword';
import { getApiErrorMessage } from '@/lib/api/errors';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const mutation = useResetPassword();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
        <h1 className="text-3xl font-bold">Reset password</h1>
        <p className="mt-2 text-sm text-slate-500">Complete the Laravel password broker flow using the token from the email link.</p>
        <form
          className="mt-8 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate({
              token,
              email,
              password,
              password_confirmation: passwordConfirmation,
            });
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
            placeholder="New password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            placeholder="Confirm password"
            type="password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
          />
          <button className="w-full rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white">
            {mutation.isPending ? 'Resetting...' : 'Reset password'}
          </button>
        </form>
        {mutation.data ? <p className="mt-4 text-sm text-brand-700">{mutation.data.message}</p> : null}
        {mutation.isError ? <p className="mt-4 text-sm text-rose-700">{getApiErrorMessage(mutation.error)}</p> : null}
        <Link to="/login" className="mt-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-800">
          Back to login
        </Link>
      </div>
    </div>
  );
}
