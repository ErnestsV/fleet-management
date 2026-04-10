import clsx from 'clsx';

const toneMap: Record<string, string> = {
  moving: 'bg-emerald-100 text-emerald-700',
  idling: 'bg-amber-100 text-amber-800',
  stopped: 'bg-slate-200 text-slate-700',
  offline: 'bg-rose-100 text-rose-700',
  healthy: 'bg-emerald-100 text-emerald-700',
  fresh: 'bg-emerald-100 text-emerald-700',
  delayed: 'bg-amber-100 text-amber-800',
  stale: 'bg-amber-100 text-amber-800',
  no_data: 'bg-slate-100 text-slate-700',
  low_frequency: 'bg-amber-100 text-amber-800',
  missing_fields: 'bg-sky-100 text-sky-700',
  active: 'bg-emerald-100 text-emerald-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  success: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-800',
  failed: 'bg-rose-100 text-rose-700',
  unknown: 'bg-slate-100 text-slate-700',
  high: 'bg-rose-100 text-rose-700',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-sky-100 text-sky-700',
};

export function StatusBadge({ value }: { value: string | null | undefined }) {
  if (!value) {
    return <span className="inline-flex items-center justify-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Unknown</span>;
  }

  return (
    <span className={clsx('inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold capitalize', toneMap[value] ?? 'bg-slate-100 text-slate-700')}>
      {value.replace(/_/g, ' ')}
    </span>
  );
}
