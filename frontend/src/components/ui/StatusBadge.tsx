import clsx from 'clsx';

const toneMap: Record<string, string> = {
  moving: 'bg-emerald-100 text-emerald-700',
  idling: 'bg-amber-100 text-amber-800',
  stopped: 'bg-slate-200 text-slate-700',
  offline: 'bg-rose-100 text-rose-700',
  active: 'bg-rose-100 text-rose-700',
  resolved: 'bg-emerald-100 text-emerald-700',
  high: 'bg-rose-100 text-rose-700',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-sky-100 text-sky-700',
};

export function StatusBadge({ value }: { value: string | null | undefined }) {
  if (!value) {
    return <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Unknown</span>;
  }

  return (
    <span className={clsx('rounded-full px-3 py-1 text-xs font-semibold capitalize', toneMap[value] ?? 'bg-slate-100 text-slate-700')}>
      {value.replace(/_/g, ' ')}
    </span>
  );
}
