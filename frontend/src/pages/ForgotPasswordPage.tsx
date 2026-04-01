import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForgotPassword } from '@/features/auth/useForgotPassword';
import { getApiErrorMessage } from '@/lib/api/errors';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const mutation = useForgotPassword();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
        <h1 className="text-3xl font-bold">Forgot password</h1>
        <p className="mt-2 text-sm text-slate-500">Send a Laravel password reset email through Mailpit or your configured SMTP provider.</p>
        <form
          className="mt-8 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate(email);
          }}
        >
          <input
            className="w-full rounded-2xl border border-slate-200 px-4 py-3"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <button className="w-full rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white">
            {mutation.isPending ? 'Sending...' : 'Send reset link'}
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
