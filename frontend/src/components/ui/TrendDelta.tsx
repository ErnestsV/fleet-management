import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

function formatSignedPercent(value: number): string {
  const sign = value > 0 ? '+' : '';

  return `${sign}${value.toFixed(1)}%`;
}

export function TrendDelta({
  deltaPct,
  higherIsBetter = true,
  suffix = 'vs previous day',
  emptyLabel = 'No previous-day baseline',
}: {
  deltaPct: number | null;
  higherIsBetter?: boolean;
  suffix?: string;
  emptyLabel?: string;
}) {
  if (deltaPct == null || !Number.isFinite(deltaPct)) {
    return <div className="flex items-center gap-2 text-sm font-medium text-slate-500">{emptyLabel}</div>;
  }

  if (deltaPct === 0) {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <Minus size={16} />
        <span>{formatSignedPercent(deltaPct)} {suffix}</span>
      </div>
    );
  }

  const improving = higherIsBetter ? deltaPct > 0 : deltaPct < 0;
  const Icon = deltaPct > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <div className={`flex items-center gap-2 text-sm font-medium ${improving ? 'text-emerald-600' : 'text-rose-600'}`}>
      <Icon size={16} />
      <span>{formatSignedPercent(deltaPct)} {suffix}</span>
    </div>
  );
}
