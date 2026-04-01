import { formatDateTime } from '@/lib/utils/format';

export type AssignmentHistoryItem = {
  id: number;
  title: string;
  subtitle?: string | null;
  assignedFrom: string;
  assignedUntil?: string | null;
  onEnd?: () => void;
};

export function AssignmentHistoryList({ items }: { items: AssignmentHistoryItem[] }) {
  if (items.length === 0) {
    return <div className="text-sm text-slate-500">No assignment history yet.</div>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 text-sm">
          <div>
            <div className="font-semibold">{item.title}</div>
            {item.subtitle ? <div className="text-slate-500">{item.subtitle}</div> : null}
            <div className="text-slate-500">
              {formatDateTime(item.assignedFrom)}
              {item.assignedUntil ? ` to ${formatDateTime(item.assignedUntil)}` : ' · Active'}
            </div>
          </div>
          {!item.assignedUntil && item.onEnd ? (
            <button className="rounded-2xl border border-slate-200 px-3 py-2 font-semibold" onClick={item.onEnd}>
              End
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
