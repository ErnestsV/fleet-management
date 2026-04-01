import { useEffect, useRef } from 'react';
import clsx from 'clsx';

type DismissibleAlertProps = {
  message: string;
  tone?: 'success' | 'error' | 'info';
  onClose: () => void;
  autoDismissMs?: number;
  className?: string;
};

const toneMap: Record<NonNullable<DismissibleAlertProps['tone']>, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  error: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
};

export function DismissibleAlert({
  message,
  tone = 'success',
  onClose,
  autoDismissMs = 5000,
  className,
}: DismissibleAlertProps) {
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => onCloseRef.current(), autoDismissMs);

    return () => window.clearTimeout(timeoutId);
  }, [autoDismissMs, message]);

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      className={clsx('flex items-start justify-between gap-3 rounded-2xl border px-4 py-3 text-sm', toneMap[tone], className)}
    >
      <div>{message}</div>
      <button
        type="button"
        aria-label="Close message"
        className="shrink-0 rounded-full p-1 text-current/70 transition hover:bg-white/50 hover:text-current"
        onClick={onClose}
      >
        ×
      </button>
    </div>
  );
}
